import * as BABYLON from 'babylonjs';

export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.spatialSounds = new Map();
        
        // Audio categories for future volume control
        this.volumes = {
            sfx: 1.0,
            music: 0.4,
            ambient: 0.3
        };
    }

    /**
     * Loads a sound into the library
     * @param {string} name - Internal ID
     * @param {string} url - Audio file URL
     * @param {object} options - Babylon Sound options
     */
    addSound(name, url, options = {}) {
        const defaultOptions = {
            loop: false,
            autoplay: false,
            volume: this.volumes.sfx,
            spatialSound: false
        };

        const config = { ...defaultOptions, ...options };
        const sound = new BABYLON.Sound(name, url, this.scene, null, config);
        this.sounds.set(name, sound);
        return sound;
    }

    /**
     * Creates a spatial sound attached to a mesh
     * @param {string} name 
     * @param {string} url 
     * @param {BABYLON.AbstractMesh} mesh 
     * @param {object} options 
     */
    addSpatialSound(name, url, mesh, options = {}) {
        const config = {
            loop: true,
            autoplay: true,
            distanceModel: "exponential",
            rolloffFactor: 1.5,
            maxDistance: 50,
            ...options,
            spatialSound: true
        };

        const sound = new BABYLON.Sound(name, url, this.scene, null, config);
        sound.attachToMesh(mesh);
        this.sounds.set(name, sound);
        return sound;
    }

    play(name) {
        if (this.sounds.has(name)) {
            const s = this.sounds.get(name);
            if (s.isPaused) {
                s.resume();
            } else {
                s.play();
            }
        }
    }

    stop(name) {
        if (this.sounds.has(name)) {
            this.sounds.get(name).stop();
        }
    }

    pause(name) {
        if (this.sounds.has(name)) {
            this.sounds.get(name).pause();
        }
    }

    setVolume(category, value) {
        if (this.volumes[category] !== undefined) {
            this.volumes[category] = value;
            // Update all sounds in this category (would need tags in a real system)
            // For now, we adjust the Master volume or specific sets if needed
        }
    }

    /**
     * Resumes the audio context if it's suspended
     */
    async unlockAudio() {
        if (BABYLON.Engine.audioEngine) {
            await BABYLON.Engine.audioEngine.unlockAsync();
            console.log("Audio Engine Unlocked");
        }
    }

    /**
     * High-level helper for common game SFX
     */
    initPresets() {
        const base = "https://assets.babylonjs.com/sound/";
        // Core SFX
        this.addSound("fire_m4", base + "cannonBlast.mp3", { volume: 0.3 }); // Ballistic stand-in
        this.addSound("fire_ak", base + "cannonBlast.mp3", { volume: 0.5, pitch: 0.8 }); // Heavier AK sound
        this.addSound("fire_mp5", base + "cannonBlast.mp3", { volume: 0.2, pitch: 1.2 }); // Faster/lighter SMG sound
        
        this.addSound("footstep", base + "violons11.wav", { volume: 0.05 }); 
        this.addSound("jump", base + "violons11.wav", { volume: 0.1 });
        this.addSound("land", base + "violons11.wav", { volume: 0.1 });
        
        // Ambient
        this.addSound("ambient_cyber", base + "pirateFun.mp3", { 
            loop: true, 
            volume: 0.05 
        });
    }
}
