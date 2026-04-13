import { EnemyEntity } from './EnemyEntity';

export class CombatManager {
    constructor(scene, assetLoader, player) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.player = player;
        this.enemies = [];
        this.wave = 1;
        this.maxEnemies = 3;
    }

    async spawnEnemy(position) {
        const mesh = await this.assetLoader.loadModel(
            "https://assets.babylonjs.com/meshes/", 
            "alien.glb",
            {
                scaling: new BABYLON.Vector3(2.5, 2.5, 2.5),
                position: position.add(new BABYLON.Vector3(0, 2.5, 0))
            }
        );
        const entity = new EnemyEntity(this.scene, mesh, position);
        entity.target = this.player;
        this.enemies.push(entity);
        return entity;
    }

    update() {
        // Cleanup dead enemies
        this.enemies = this.enemies.filter(e => !e.isDisposed());

        // Spawn logic: If enemies < maxEnemies, spawn more at random positions near player
        if (this.enemies.length < this.maxEnemies) {
            const spawnPos = this.player.camera.position.clone();
            spawnPos.x += (Math.random() - 0.5) * 100;
            spawnPos.z += (Math.random() - 0.5) * 100;
            spawnPos.y = 2;
            
            this.spawnEnemy(spawnPos);
        }
    }
}
