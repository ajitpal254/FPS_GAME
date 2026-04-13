import * as BABYLON from 'babylonjs';

export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
    }

    async loadModel(url, filename, options = {}) {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh("", url, filename, this.scene, (meshes) => {
                const root = meshes[0];
                if (options.position) root.position = options.position;
                if (options.scaling) root.scaling = options.scaling;
                if (options.rotation) root.rotation = options.rotation;
                
                meshes.forEach(m => {
                    if (m.name !== "__root__") {
                        if (options.checkCollisions) m.checkCollisions = true;
                        if (options.onMeshLoaded) options.onMeshLoaded(m);
                    }
                });
                resolve(root);
            }, null, (scene, message) => {
                reject(message);
            });
        });
    }
}
