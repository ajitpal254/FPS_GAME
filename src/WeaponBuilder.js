import * as BABYLON from 'babylonjs';

export class WeaponBuilder {
    static build(type, scene, parent) {
        const root = new BABYLON.TransformNode("weapon_root", scene);
        root.parent = parent;
        
        // Base Materials
        const metalMat = new BABYLON.PBRMaterial("metalMat", scene);
        metalMat.albedoColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        metalMat.metallic = 1.0;
        metalMat.roughness = 0.4;

        const detailMat = new BABYLON.PBRMaterial("detailMat", scene);
        detailMat.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        detailMat.roughness = 0.8;

        const woodMat = new BABYLON.PBRMaterial("woodMat", scene);
        woodMat.albedoColor = new BABYLON.Color3(0.2, 0.1, 0.05);
        woodMat.roughness = 0.9;

        if (type === "M4A1") {
            this.buildM4A1(scene, root, metalMat, detailMat);
        } else if (type === "AK47") {
            this.buildAK47(scene, root, metalMat, woodMat);
        } else if (type === "MP5") {
            this.buildMP5(scene, root, metalMat, detailMat);
        }

        return root;
    }

    static buildM4A1(scene, root, metal, detail) {
        // Upper Receiver
        const body = BABYLON.MeshBuilder.CreateBox("body", {width: 0.1, height: 0.15, depth: 0.4}, scene);
        body.parent = root;
        body.material = metal;

        // Barrel & Rail
        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {height: 0.5, diameter: 0.04}, scene);
        barrel.parent = body;
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.4;
        barrel.material = metal;

        const rail = BABYLON.MeshBuilder.CreateBox("rail", {width: 0.08, height: 0.08, depth: 0.35}, scene);
        rail.parent = body;
        rail.position.z = 0.25;
        rail.material = detail;

        // Stock
        const stockTube = BABYLON.MeshBuilder.CreateCylinder("stock_tube", {height: 0.2, diameter: 0.04}, scene);
        stockTube.parent = body;
        stockTube.rotation.x = Math.PI / 2;
        stockTube.position.z = -0.3;
        stockTube.material = detail;

        const stock = BABYLON.MeshBuilder.CreateBox("stock", {width: 0.08, height: 0.18, depth: 0.15}, scene);
        stock.parent = stockTube;
        stock.position.y = -0.2; // Adjusted for rotation
        stock.position.y = 0;
        stock.position.z = -0.1;
        stock.material = detail;

        // Mag
        const mag = BABYLON.MeshBuilder.CreateBox("mag", {width: 0.06, height: 0.25, depth: 0.1}, scene);
        mag.parent = body;
        mag.position.y = -0.15;
        mag.position.z = 0.1;
        mag.material = detail;

        // Red Dot Sight
        const optic = BABYLON.MeshBuilder.CreateBox("optic", {width: 0.06, height: 0.08, depth: 0.1}, scene);
        optic.parent = body;
        optic.position.y = 0.12;
        optic.position.z = 0.1;
        optic.material = detail;
    }

    static buildAK47(scene, root, metal, wood) {
        const body = BABYLON.MeshBuilder.CreateBox("body", {width: 0.12, height: 0.15, depth: 0.45}, scene);
        body.parent = root;
        body.material = metal;

        const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {height: 0.6, diameter: 0.04}, scene);
        barrel.parent = body;
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.5;
        barrel.material = metal;

        const stock = BABYLON.MeshBuilder.CreateBox("stock", {width: 0.1, height: 0.18, depth: 0.35}, scene);
        stock.parent = body;
        stock.position.z = -0.4;
        stock.position.y = -0.05;
        stock.material = wood;

        const grip = BABYLON.MeshBuilder.CreateBox("grip", {width: 0.08, height: 0.1, depth: 0.25}, scene);
        grip.parent = body;
        grip.position.z = 0.35;
        grip.material = wood;

        const mag = BABYLON.MeshBuilder.CreateBox("mag", {width: 0.06, height: 0.3, depth: 0.12}, scene);
        mag.parent = body;
        mag.position.y = -0.2;
        mag.position.z = 0.15;
        mag.rotation.x = 0.4;
        mag.material = metal;
    }

    static buildMP5(scene, root, metal, detail) {
        const body = BABYLON.MeshBuilder.CreateBox("body", {width: 0.08, height: 0.16, depth: 0.35}, scene);
        body.parent = root;
        body.material = metal;

        const suppressor = BABYLON.MeshBuilder.CreateCylinder("suppressor", {height: 0.3, diameter: 0.06}, scene);
        suppressor.parent = body;
        suppressor.rotation.x = Math.PI / 2;
        suppressor.position.z = 0.3;
        suppressor.material = detail;

        const mag = BABYLON.MeshBuilder.CreateBox("mag", {width: 0.05, height: 0.28, depth: 0.08}, scene);
        mag.parent = body;
        mag.position.y = -0.2;
        mag.position.z = 0.1;
        mag.rotation.x = 0.1;
        mag.material = metal;

        const stock = BABYLON.MeshBuilder.CreateBox("stock", {width: 0.06, height: 0.14, depth: 0.3}, scene);
        stock.parent = body;
        stock.position.z = -0.3;
        stock.material = detail;
    }
}
