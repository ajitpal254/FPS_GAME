import * as GUI from 'babylonjs-gui';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.dot = null;
        this.prompt = null;
        this.init();
    }

    init() {
        // Crosshair
        const crosshair = new GUI.Ellipse();
        crosshair.width = "10px";
        crosshair.height = "10px";
        crosshair.color = "cyan";
        crosshair.thickness = 2;
        this.advancedTexture.addControl(crosshair);
        
        this.dot = new GUI.Ellipse();
        this.dot.width = "2px";
        this.dot.height = "2px";
        this.dot.color = "cyan";
        this.dot.background = "cyan";
        this.advancedTexture.addControl(this.dot);

        // Proximity Prompt
        this.prompt = new GUI.TextBlock();
        this.prompt.text = "HOLD [E] TO SYNC DATA";
        this.prompt.color = "white";
        this.prompt.fontSize = 24;
        this.prompt.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.prompt.top = "-120px";
        this.prompt.isVisible = false;
        this.advancedTexture.addControl(this.prompt);

        // Progress Bar
        this.progressContainer = new GUI.Rectangle();
        this.progressContainer.width = "300px";
        this.progressContainer.height = "20px";
        this.progressContainer.color = "white";
        this.progressContainer.thickness = 2;
        this.progressContainer.background = "rgba(0,0,0,0.5)";
        this.progressContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.progressContainer.top = "-80px";
        this.progressContainer.isVisible = false;
        this.advancedTexture.addControl(this.progressContainer);

        this.progressBar = new GUI.Rectangle();
        this.progressBar.width = "0%";
        this.progressBar.height = "100%";
        this.progressBar.color = "cyan";
        this.progressBar.background = "cyan";
        this.progressBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.progressContainer.addControl(this.progressBar);

        // Combat HUD: Energy & Shield
        this.createCombatBars();
    }

    createCombatBars() {
        const createBar = (offsetY, color, name) => {
            const container = new GUI.Rectangle();
            container.width = "200px";
            container.height = "10px";
            container.color = "rgba(255,255,255,0.2)";
            container.background = "rgba(0,0,0,0.5)";
            container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            container.left = "40px";
            container.top = offsetY;
            this.advancedTexture.addControl(container);

            const bar = new GUI.Rectangle();
            bar.width = "100%";
            bar.height = "100%";
            bar.color = color;
            bar.background = color;
            bar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            container.addControl(bar);
            return bar;
        };

        this.shieldBar = createBar("-40px", "#0ff", "shield");
        this.energyBar = createBar("-60px", "#f0f", "energy");

        // Enemy Health Overlay
        this.enemyHealthContainer = new GUI.Rectangle();
        this.enemyHealthContainer.width = "400px";
        this.enemyHealthContainer.height = "5px";
        this.enemyHealthContainer.color = "transparent";
        this.enemyHealthContainer.background = "rgba(255,0,0,0.2)";
        this.enemyHealthContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.enemyHealthContainer.top = "40px";
        this.enemyHealthContainer.isVisible = false;
        this.advancedTexture.addControl(this.enemyHealthContainer);

        this.enemyHealthBar = new GUI.Rectangle();
        this.enemyHealthBar.width = "100%";
        this.enemyHealthBar.height = "100%";
        this.enemyHealthBar.background = "red";
        this.enemyHealthBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.enemyHealthContainer.addControl(this.enemyHealthBar);

        this.createMinimap();
    }

    createMinimap() {
        const mapSize = 150;
        this.mapContainer = new GUI.Rectangle();
        this.mapContainer.width = `${mapSize}px`;
        this.mapContainer.height = `${mapSize}px`;
        this.mapContainer.color = "rgba(0, 255, 255, 0.4)";
        this.mapContainer.background = "rgba(0, 0, 0, 0.6)";
        this.mapContainer.thickness = 2;
        this.mapContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.mapContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.mapContainer.top = "20px";
        this.mapContainer.left = "-20px";
        this.advancedTexture.addControl(this.mapContainer);

        this.playerMarker = new GUI.Ellipse();
        this.playerMarker.width = "6px";
        this.playerMarker.height = "6px";
        this.playerMarker.background = "white";
        this.playerMarker.color = "white";
        this.mapContainer.addControl(this.playerMarker);

        this.enemyMarkers = [];
    }

    updateMinimap(playerPos, enemies) {
        const scale = 0.5; // Scale world units to pixels
        const mapSize = 150;

        // Clear old markers (simple approach)
        this.enemyMarkers.forEach(m => m.dispose());
        this.enemyMarkers = [];

        enemies.forEach(enemy => {
            if (enemy.isDisposed()) return;
            const delta = enemy.position.subtract(playerPos);
            const marker = new GUI.Ellipse();
            marker.width = "4px";
            marker.height = "4px";
            marker.background = "red";
            marker.color = "red";
            
            // Limit to map bounds
            const mapX = delta.x * scale;
            const mapY = delta.z * scale;
            if (Math.abs(mapX) < mapSize/2 && Math.abs(mapY) < mapSize/2) {
                marker.left = mapX;
                marker.top = -mapY; // Invert Z for screen space
                this.mapContainer.addControl(marker);
                this.enemyMarkers.push(marker);
            }
        });
    }

    updateStats(shield, energy) {
        this.shieldBar.width = `${shield}%`;
        this.energyBar.width = `${energy}%`;
    }

    showEnemyHealth(visible, percent) {
        this.enemyHealthContainer.isVisible = visible;
        this.enemyHealthBar.width = `${percent}%`;
    }

    showPrompt(visible) {
        this.prompt.isVisible = visible;
        if (!visible) this.showProgress(false, 0);
    }

    showProgress(visible, percent) {
        this.progressContainer.isVisible = visible;
        this.progressBar.width = `${percent}%`;
    }

    setCrosshairColor(color) {
        this.dot.color = color;
        this.dot.background = color;
    }
}
