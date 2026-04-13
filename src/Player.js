import * as BABYLON from 'babylonjs';
import { WeaponBuilder } from './WeaponBuilder';

export class Player {
    constructor(scene, canvas, audio) {
        this.scene = scene;
        this.canvas = canvas;
        this.audio = audio;
        this.camera = null;
        this.scanner = null;
        this.init();
    }

    init() {
        // FPS Camera
        this.camera = new BABYLON.FreeCamera("fpsCamera", new BABYLON.Vector3(0, 2, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
        
        // FPS Controls mapping
        this.camera.keysUp.push(87);    // W
        this.camera.keysDown.push(83);  // S
        this.camera.keysLeft.push(65);  // A
        this.camera.keysRight.push(68); // D
        this.camera.speed = 0.5;
        this.camera.angularSensibility = 2000;

        // Collision & Gravity
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(1, 1.5, 1);

        this.setupScanner();
        this.setupControls();
        this.isInteracting = false;

        // Combat Stats
        this.energy = 100;
        this.shield = 100;
        this.maxEnergy = 100;
        this.lastFireTime = 0;
        this.fireRate = 200; 
        this.lastDamageTime = 0;
        
        // Physics & Animation
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.canJump = true;
        this.recoilZ = 0;
    }

    setupScanner() {
        // Advanced Rifle Mesh
        this.scanner = BABYLON.MeshBuilder.CreateBox("gun_stock", {width: 0.12, height: 0.2, depth: 0.5}, this.scene);
        this.scanner.parent = this.camera;
        this.scanner.position = new BABYLON.Vector3(0.5, -0.4, 1);
        
        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {height: 0.7, diameter: 0.05}, this.scene);
        barrel.parent = this.scanner;
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.5;

        const scope = BABYLON.MeshBuilder.CreateBox("scope", {width: 0.06, height: 0.08, depth: 0.2}, this.scene);
        scope.parent = this.scanner;
        scope.position.y = 0.15;

        const mat = new BABYLON.PBRMaterial("gunMat", this.scene);
        mat.albedoColor = new BABYLON.Color3(0.04, 0.04, 0.05);
        mat.metallic = 1.0;
        mat.roughness = 0.3;
        mat.environmentIntensity = 0.8;
        this.scanner.material = mat;
        barrel.material = mat;
        scope.material = mat;

        // Muzzle Light
        this.muzzleLight = new BABYLON.PointLight("muzzleLight", BABYLON.Vector3.Zero(), this.scene);
        this.muzzleLight.intensity = 0;
        this.muzzleLight.diffuse = new BABYLON.Color3(1, 0.7, 0.3);
        this.muzzleLight.range = 30;

        // Animation Loop
        let walkTime = 0;
        this.scene.onBeforeRenderObservable.add(() => {
            const isMoving = this.camera.cameraDirection.length() > 0.001;
            
            // 1. Head Bobbing
            if (isMoving) {
                walkTime += 0.12;
                this.camera.position.y = 2.0 + Math.sin(walkTime) * 0.04;
            } else {
                this.camera.position.y = BABYLON.Scalar.Lerp(this.camera.position.y, 2.0, 0.1);
            }

            // 2. Weapon Sway & Recoil
            this.recoilZ = BABYLON.Scalar.Lerp(this.recoilZ, 0, 0.15);
            this.scanner.position.x = BABYLON.Scalar.Lerp(this.scanner.position.x, 0.5 - this.camera.cameraRotation.y * 4, 0.1);
            this.scanner.position.y = BABYLON.Scalar.Lerp(this.scanner.position.y, -0.4 + this.camera.cameraRotation.x * 4, 0.1);
            this.scanner.position.z = 1.0 - this.recoilZ;

            // 3. Regen
            if (Date.now() - this.lastDamageTime > 4000 && this.shield < 100) this.shield += 0.2;
            if (this.energy < 100) this.energy += 0.4;

        // Muzzle Light Decay
        if (this.muzzleLight.intensity > 0) this.muzzleLight.intensity -= 0.8;
    });

    this.setWeapon("M4A1");
}

setWeapon(type) {
    this.currentWeapon = type;
    if (this.scanner) this.scanner.dispose();
    
    // Weapon Stats
    const weaponProfiles = {
        "M4A1": { fireRate: 150, energyCost: 5, recoil: 0.15, damage: 20 },
        "AK47": { fireRate: 200, energyCost: 8, recoil: 0.25, damage: 35 },
        "MP5":  { fireRate: 100, energyCost: 4, recoil: 0.1,  damage: 15 }
    };

    const profile = weaponProfiles[type] || weaponProfiles["M4A1"];
    this.fireRate = profile.fireRate;
    this.recoilTarget = profile.recoil;
    this.damage = profile.damage;

    // Build modern mesh using WeaponBuilder
    this.scanner = WeaponBuilder.build(type, this.scene, this.camera);
    this.scanner.position = new BABYLON.Vector3(0.5, -0.4, 1);
}

    takeDamage(amount) {
        this.shield -= amount;
        this.lastDamageTime = Date.now();
    }

    setupControls() {
        window.addEventListener("keydown", (evt) => {
            if (evt.keyCode === 32 && this.canJump) this.jump(); 
            if (evt.keyCode === 16) this.camera.speed = 0.9; 
            if (evt.keyCode === 69) this.isInteracting = true;
        });
        window.addEventListener("keyup", (evt) => {
            if (evt.keyCode === 16) this.camera.speed = 0.5;
            if (evt.keyCode === 69) this.isInteracting = false;
        });

        this.scene.onPointerDown = (evt) => {
            if (evt.button === 0) {
                if (!this.scene.getEngine().isPointerLock) {
                    this.scene.getEngine().enterPointerlock();
                } else {
                    const now = Date.now();
                    if (now - this.lastFireTime > this.fireRate && this.energy > 5) {
                        this.firePulse();
                        this.energy -= 5;
                        this.lastFireTime = now;
                    }
                }
            }
        };
    }

    jump() {
        this.canJump = false;
        if (this.audio) this.audio.play("jump");
        let jumpForce = 4;
        const jumpObs = this.scene.onBeforeRenderObservable.add(() => {
            this.camera.position.y += jumpForce * 0.05;
            jumpForce -= 0.22;
            if (this.camera.position.y <= 2.0) {
                this.camera.position.y = 2.0;
                this.canJump = true;
                if (this.audio) this.audio.play("land");
                this.scene.onBeforeRenderObservable.remove(jumpObs);
                this.camera.position.y -= 0.15; // Land dip
            }
        });
    }

    firePulse() {
        const ray = this.camera.getForwardRay();
        const hit = this.scene.pickWithRay(ray, (m) => m.metadata && m.metadata.type === "enemy");
        if (hit.hit && hit.pickedMesh.onHit) hit.pickedMesh.onHit(this.damage || 25);

        // Sound logic
        const weaponSound = `fire_${this.currentWeapon.toLowerCase()}`;
        if (this.audio) this.audio.play(weaponSound);

        // Recoil
        this.recoilZ = this.recoilTarget || 0.25;

        // Muzzle Effects
        this.muzzleLight.position = this.scanner.getAbsolutePosition().add(this.camera.getDirection(BABYLON.Vector3.Forward()).scale(0.8));
        this.muzzleLight.intensity = 4.0;

        const pulse = BABYLON.MeshBuilder.CreateSphere("pulse", {diameter: 0.12}, this.scene);
        pulse.position = this.muzzleLight.position.clone();
        const dir = this.camera.getDirection(BABYLON.Vector3.Forward());
        const obs = this.scene.onBeforeRenderObservable.add(() => pulse.position.addInPlace(dir.scale(2.2)));
        setTimeout(() => { this.scene.onBeforeRenderObservable.remove(obs); pulse.dispose(); }, 400);
    }
}
