import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Environment } from './src/Environment.js';
import { Player } from './src/Player.js';
import { UIManager } from './src/UIManager.js';
import { AssetLoader } from './src/AssetLoader.js';
import { MenuManager } from './src/MenuManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById("renderCanvas");
        this.engine = null;
        this.scene = null;
        this.env = null;
        this.player = null;
        this.ui = null;
        this.assets = null;
        this.menu = null;

        this.gameState = "MENU";
        this.syncProgress = 0;
        this.enemies = [];
        this.isRobotHostile = false;

        this.init();
    }

    async init() {
        try {
            const webgpuSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
            if (webgpuSupported) {
                this.engine = new BABYLON.WebGPUEngine(this.canvas);
                await this.engine.initAsync();
            } else {
                this.engine = new BABYLON.Engine(this.canvas, true);
            }
        } catch (e) {
            this.engine = new BABYLON.Engine(this.canvas, true);
        }

        this.scene = new BABYLON.Scene(this.engine);
        
        // Modules
        this.env = new Environment(this.scene);
        this.player = new Player(this.scene, this.canvas);
        
        // Attach rendering pipelines to the player camera
        this.env.setupPipelines(this.player.camera);

        this.ui = new UIManager(this.scene);
        this.assets = new AssetLoader(this.scene);
        
        // Menu
        this.menu = new MenuManager(() => this.startGame());

        this.loadAssets();
        this.initAudio();

        this.engine.runRenderLoop(() => {
            if (this.gameState === "PLAYING") {
                this.update();
            }
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    startGame() {
        this.gameState = "PLAYING";
        if (this.ambientSound) this.ambientSound.play();
        this.engine.enterPointerlock();
    }

    initAudio() {
        try {
            // High-quality verified ambient
            this.ambientSound = new BABYLON.Sound("Ambient", "https://assets.babylonjs.com/sounds/babylonjs.mp3", this.scene, null, {
                loop: true,
                volume: 0.2
            });
            this.pulseSound = new BABYLON.Sound("Shot", "https://www.babylonjs.com/player/sounds/cannon.wav", this.scene);
            this.footstepSound = new BABYLON.Sound("Footstep", "https://www.babylonjs.com/player/sounds/step.wav", this.scene);
        } catch (e) { console.warn("Audio Context init fail", e); }
    }

    async loadAssets() {
        // Guard NPC (Alien)
        try {
            await this.assets.loadModel(
                "https://assets.babylonjs.com/meshes/", 
                "alien.glb", 
                {
                    position: new BABYLON.Vector3(0, 2.5, 10), // Corrected Y for alien height
                    scaling: new BABYLON.Vector3(2.5, 2.5, 2.5),
                    onMeshLoaded: (m) => {
                        this.env.addShadowCaster(m);
                        m.getChildMeshes().forEach(cm => cm.metadata = { type: "enemy" });
                        m.metadata = { type: "enemy", health: 100 };
                        
                        m.onHit = (damage) => {
                            m.metadata.health -= damage;
                            this.isRobotHostile = true;
                            // Stun effect
                            m.position.y += 0.5;
                            setTimeout(() => { if(!m.isDisposed()) m.position.y -= 0.5; }, 100);

                            if (m.metadata.health <= 0) {
                                m.dispose();
                                this.isRobotHostile = false;
                            }
                        };
                        this.enemies.push(m);
                    }
                }
            );
        } catch (err) { console.error("Guard load fail", err); }

        // Procedural Terminal (Objective)
        this.createProceduralTerminal(new BABYLON.Vector3(100, 0, 100));
    }

    createProceduralTerminal(pos) {
        const base = BABYLON.MeshBuilder.CreateBox("term_base", {width: 4, height: 8, depth: 4}, this.scene);
        base.position = pos.add(new BABYLON.Vector3(0, 4, 0));
        
        const monitor = BABYLON.MeshBuilder.CreateBox("term_monitor", {width: 3, height: 2, depth: 0.2}, this.scene);
        monitor.position = pos.add(new BABYLON.Vector3(0, 7.5, -1.5));
        monitor.rotation.x = -0.5;

        const mat = new BABYLON.PBRMaterial("termMat", this.scene);
        mat.albedoColor = new BABYLON.Color3(0, 1, 1);
        mat.emissiveColor = new BABYLON.Color3(0, 0.4, 0.4);
        monitor.material = mat;
        
        this.terminal = monitor;
        this.env.addShadowCaster(base);
    }

    update() {
        // 1. Update HUD
        this.ui.updateStats(this.player.shield, this.player.energy);

        // 2. Head-Bob Link to Footsteps
        const isMoving = this.player.camera.cameraDirection.length() > 0.001;
        if (isMoving && Math.sin(Date.now() * 0.01) > 0.95) {
            if (this.footstepSound && !this.footstepSound.isPlaying) this.footstepSound.play();
        }

        // 3. Enemy AI
        let closestEnemy = null;
        let minDist = Infinity;

        this.enemies.forEach(enemy => {
            if (enemy.isDisposed()) return;
            const dist = BABYLON.Vector3.Distance(this.player.camera.position, enemy.position);
            if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
            }

            if (this.isRobotHostile || dist < 30) {
                const dir = this.player.camera.position.subtract(enemy.position).normalize();
                dir.y = 0;
                enemy.position.addInPlace(dir.scale(0.18)); // Faster COD chase
                const targetRot = Math.atan2(dir.x, dir.z);
                enemy.rotation.y = BABYLON.Scalar.LerpAngle(enemy.rotation.y, targetRot, 0.1);

                if (dist < 4.0) {
                    this.player.takeDamage(0.8);
                }
            }
        });

        if (closestEnemy && minDist < 50) {
            this.ui.showEnemyHealth(true, closestEnemy.metadata.health);
        } else {
            this.ui.showEnemyHealth(false, 0);
        }

        // 4. Interaction
        if (this.terminal) {
            const dist = BABYLON.Vector3.Distance(this.player.camera.position, this.terminal.position);
            const nearTerminal = dist < 15;
            this.ui.showPrompt(nearTerminal);

            if (nearTerminal && this.player.isInteracting) {
                this.syncProgress += 0.4;
                if (this.syncProgress > 100) this.syncProgress = 100;
                this.ui.showProgress(true, this.syncProgress);
                
                if (this.syncProgress === 100) {
                    this.ui.prompt.text = "PHASE 7 VERIFIED // SECTOR PURGED";
                    this.ui.prompt.color = "#0ff";
                    this.ui.setCrosshairColor("#0ff");
                }
            } else if (this.syncProgress < 100) {
                this.ui.showProgress(nearTerminal, this.syncProgress);
            }
        }
    }

    playPulseSound() {
        if (this.pulseSound) this.pulseSound.play();
    }
}

const game = new Game();
window.addEventListener("mousedown", (evt) => {
    if (evt.button === 0 && game.gameState === "PLAYING" && game.scene.getEngine().isPointerLock) {
        game.playPulseSound();
    }
});
