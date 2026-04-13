import * as BABYLON from 'babylonjs';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.pipeline = null;
        this.csm = null;
        this.init();
    }

    init() {
        // Starry Skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000.0}, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/textures/skybox/", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        // Image-Based Lighting (IBL)
        this.scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "https://assets.babylonjs.com/environments/environmentSpecular.env", 
            this.scene
        );

        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.01; 
        this.scene.fogColor = new BABYLON.Color3(0.01, 0.01, 0.015);

        this.createMaterials();
        this.generateAAAEnvironment();
    }

    setupPipelines(camera) {
        if (!camera) return;

        // AAA Cinematic Pipeline
        this.pipeline = new BABYLON.DefaultRenderingPipeline("pipeline", true, this.scene, [camera]);
        this.pipeline.bloomEnabled = true;
        this.pipeline.bloomThreshold = 0.9;
        this.pipeline.bloomWeight = 0.4;
        this.pipeline.fxaaEnabled = true;
        
        // Tone Mapping & Gritty Contrast
        this.pipeline.imageProcessingEnabled = true;
        this.pipeline.imageProcessing.toneMappingEnabled = true;
        this.pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        this.pipeline.imageProcessing.contrast = 1.4; // PUNCHY
        this.pipeline.imageProcessing.exposure = 1.1;
        this.pipeline.imageProcessing.vignetteEnabled = true;
        this.pipeline.imageProcessing.vignetteWeight = 5;

        this.pipeline.sharpenEnabled = true;
        this.pipeline.sharpen.edgeAmount = 0.3;
        this.pipeline.chromaticAberrationEnabled = true;
        this.pipeline.chromaticAberration.aberrationAmount = 20;

        // SSAO for depth
        const ssao = new BABYLON.SSAORenderingPipeline("ssao", this.scene, 0.75, [camera]);
        ssao.radius = 2.0;
        ssao.totalStrength = 1.5;
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    }

    createMaterials() {
        // Industrial Concrete (PBR)
        this.concreteMat = new BABYLON.PBRMaterial("concreteMat", this.scene);
        this.concreteMat.albedoColor = new BABYLON.Color3(0.15, 0.15, 0.16);
        this.concreteMat.roughness = 0.85;
        this.concreteMat.metallic = 0.05;
        this.concreteMat.environmentIntensity = 0.5;

        // Shiny Metal Detail
        this.metalMat = new BABYLON.PBRMaterial("metalMat", this.scene);
        this.metalMat.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.12);
        this.metalMat.metallic = 1.0;
        this.metalMat.roughness = 0.2;
        this.metalMat.environmentIntensity = 1.0;

        // High-Quality Wet Road
        this.roadMat = new BABYLON.PBRMaterial("roadMat", this.scene);
        this.roadMat.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        this.roadMat.metallic = 0.2;
        this.roadMat.roughness = 0.15;
        this.roadMat.environmentIntensity = 2.0; // High reflection for wet look
    }

    generateAAAEnvironment() {
        const sectorSize = 500;
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: sectorSize, height: sectorSize}, this.scene);
        ground.material = this.roadMat;
        ground.checkCollisions = true;

        // CASCADED SHADOWS (CSM)
        const light = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -0.5), this.scene);
        light.position = new BABYLON.Vector3(50, 100, 50);
        light.intensity = 1.5;
        
        this.csm = new BABYLON.CascadedShadowGenerator(2048, light);
        this.csm.lambda = 0.5;
        this.csm.cascadeBlendPercentage = 0.1;
        this.csm.shadowMaxZ = 300;

        // City Layout
        for (let x = -200; x <= 200; x += 120) {
            for (let z = -200; z <= 200; z += 120) {
                if (x === 0 && z === 0) continue;
                this.createStructuralBuilding(new BABYLON.Vector3(x, 0, z));
            }
        }
    }

    createStructuralBuilding(pos) {
        const w = 40 + Math.random() * 20;
        const h = 60 + Math.random() * 80;
        const base = BABYLON.MeshBuilder.CreateBox("building", {width: w, height: h, depth: w}, this.scene);
        base.position = new BABYLON.Vector3(pos.x, h/2, pos.z);
        base.material = this.concreteMat;
        base.checkCollisions = true;
        this.csm.addShadowCaster(base);

        // Industrial Details
        for (let i = 1; i <= 3; i++) {
            const hDiv = h * (i / 4);
            const band = BABYLON.MeshBuilder.CreateBox("band", {width: w + 2, height: 1, depth: w + 2}, this.scene);
            band.position = new BABYLON.Vector3(pos.x, hDiv, pos.z);
            band.material = this.metalMat;
            this.csm.addShadowCaster(band);
        }

        // Side Pillars for silhuette
        const p = BABYLON.MeshBuilder.CreateBox("pillar", {width: 4, height: h, depth: 4}, this.scene);
        p.position = new BABYLON.Vector3(pos.x + w/2, h/2, pos.z + w/2);
        p.material = this.metalMat;
        this.csm.addShadowCaster(p);
    }

    addShadowCaster(mesh) {
        if (this.csm) this.csm.addShadowCaster(mesh);
    }
}
