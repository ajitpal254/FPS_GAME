import * as BABYLON from 'babylonjs';

export class EnemyEntity {
    constructor(scene, rootNode, initialPos) {
        this.scene = scene;
        this.root = rootNode;
        this.root.position = initialPos;
        this.health = 100;
        this.isDead = false;
        
        // AI State
        this.state = "IDLE"; // IDLE, PATROL, CHASE, ATTACK
        this.target = null;
        this.speed = 0.15;
        this.lastAttackTime = 0;
        
        this.setupHitbox();
        this.setupLogic();
    }

    setupHitbox() {
        // Create an invisible capsule/box proxy that covers the whole model
        this.hitbox = BABYLON.MeshBuilder.CreateBox("enemy_hitbox", {width: 2, height: 4, depth: 2}, this.scene);
        this.hitbox.parent = this.root;
        this.hitbox.position.y = 2;
        this.hitbox.visibility = 0; // Stay invisible but hittable
        this.hitbox.isPickable = true;
        this.hitbox.metadata = { type: "enemy", entity: this };

        // Route all child mesh hits to this entity
        this.root.getChildMeshes().forEach(m => {
            m.isPickable = true;
            m.metadata = { type: "enemy", entity: this };
            m.onHit = (damage) => this.takeDamage(damage);
        });

        this.hitbox.onHit = (damage) => this.takeDamage(damage);
    }

    setupLogic() {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.isDead) return;
            this.updateAI();
        });
    }

    updateAI() {
        if (!this.target) return;

        const dist = BABYLON.Vector3.Distance(this.root.position, this.target.position);

        if (dist < 40) {
            this.state = "CHASE";
            this.moveTowardTarget();
        } else {
            this.state = "IDLE";
        }

        if (dist < 10) {
            this.state = "ATTACK";
            this.attack();
        }
    }

    moveTowardTarget() {
        const dir = this.target.position.subtract(this.root.position);
        dir.y = 0;
        dir.normalize();
        
        // Look at target
        this.root.lookAt(new BABYLON.Vector3(this.target.position.x, this.root.position.y, this.target.position.z));
        
        // Tactical movement optimization: Random side strafe
        const strafe = Math.sin(Date.now() * 0.002) * 0.05;
        const strafeDir = BABYLON.Vector3.Cross(dir, BABYLON.Vector3.Up());
        
        this.root.position.addInPlace(dir.scale(this.speed));
        this.root.position.addInPlace(strafeDir.scale(strafe));
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime > 1500) {
            if (this.target.takeDamage) {
                this.target.takeDamage(10);
            }
            this.lastAttackTime = now;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.root.dispose();
        // Trigger death animation or vfx here
    }

    isDisposed() {
        return this.root.isDisposed();
    }

    get position() {
        return this.root.position;
    }
}
