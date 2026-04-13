import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Environment } from './src/Environment.js';
import { Player } from './src/Player.js';
import { UIManager } from './src/UIManager.js';
import { AssetLoader } from './src/AssetLoader.js';
import { MenuManager } from './src/MenuManager.js';
import { AudioManager } from './src/AudioManager.js';
import { CombatManager } from './src/CombatManager.js';

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
        this.audio = null;

        this.gameState = "MENU";
        this.syncProgress = 0;
        this.combat = null;

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
        
        this.audio = new AudioManager(this.scene);
        this.audio.initPresets();

        // Modules
        this.env = new Environment(this.scene, this.audio);
        this.player = new Player(this.scene, this.canvas, this.audio);
        
        // Attach rendering pipelines to the player camera
        this.env.setupPipelines(this.player.camera);

        this.ui = new UIManager(this.scene);
        this.assets = new AssetLoader(this.scene);
        
        // Menu
        this.menu = new MenuManager((config) => this.startGame(config));

        this.combat = new CombatManager(this.scene, this.assets, this.player);

        this.loadAssets();
        // this.initAudio(); // Replaced by audio manager presets

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

    startGame(config = {}) {
        this.gameState = "PLAYING";
        
        // Apply Config
        if (config.quality) this.env.setQuality(config.quality);
        if (config.weapon) this.player.setWeapon(config.weapon);

        this.audio.unlockAudio(); // Resume audio context
        this.audio.play("ambient_cyber");
        this.engine.enterPointerlock();
    }

    // Old Audio logic removed in favor of AudioManager

    async loadAssets() {
        // CombatManager now handles NPC spawning during gameplay
        this.combat.spawnEnemy(new BABYLON.Vector3(0, 2.5, 20));

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
        // 1. Update HUD & Combat
        this.ui.updateStats(this.player.shield, this.player.energy);
        this.ui.updateMinimap(this.player.camera.position, this.combat.enemies);
        this.combat.update();

        if (this.player.shield <= 0) {
            this.gameState = "GAME_OVER";
            this.menu.showGameOver();
            this.engine.exitPointerlock();
            return;
        }

        // 2. Head-Bob Link to Footsteps
        const isMoving = this.player.camera.cameraDirection.length() > 0.001;
        if (isMoving && Math.sin(Date.now() * 0.01) > 0.95) {
            this.audio.play("footstep");
        }

        // 3. Enemy HUD
        let closestEnemy = null;
        let minDist = Infinity;

        this.combat.enemies.forEach(enemy => {
            const dist = BABYLON.Vector3.Distance(this.player.camera.position, enemy.position);
            if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
            }
        });

        if (closestEnemy && minDist < 50) {
            this.ui.showEnemyHealth(true, closestEnemy.health);
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
}

const game = new Game();
