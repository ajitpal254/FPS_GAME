export class MenuManager {
    constructor(onStart) {
        this.onStart = onStart;
        this.selectedWeapon = "M4A1";
        this.selectedSecondary = "GLOCK";
        this.graphicsQuality = "HIGH";
        this.createMenu();
    }

    createMenu() {
        const style = document.createElement("style");
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;900&display=swap');
            
            #menu-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: #050505;
                display: flex; flex-direction: column;
                justify-content: center; align-items: center;
                z-index: 1000; color: #fff;
                font-family: 'Outfit', sans-serif;
                transition: opacity 1s ease-out;
                overflow: hidden;
            }

            #menu-overlay::before {
                content: '';
                position: absolute; width: 200%; height: 200%;
                background: radial-gradient(circle at 30% 30%, rgba(0, 255, 255, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 70% 70%, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
                animation: bgMove 20s infinite linear;
            }

            @keyframes bgMove {
                from { transform: translate(-25%, -25%); }
                to { transform: translate(0%, 0%); }
            }

            .menu-content {
                position: relative;
                display: flex; flex-direction: column;
                align-items: center; width: 80%; max-width: 1200px;
            }

            .title-box { text-align: center; margin-bottom: 3rem; }
            .title {
                font-size: 8rem; font-weight: 900; letter-spacing: 2rem;
                background: linear-gradient(to bottom, #fff, #444);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                filter: drop-shadow(0 0 20px rgba(0,255,255,0.3));
                margin: 0;
            }

            .section-label {
                font-size: 0.8rem; letter-spacing: 0.5rem; color: #0ff;
                text-transform: uppercase; margin-bottom: 2rem; opacity: 0.7;
            }

            .loadout-grid {
                display: flex; gap: 2rem; margin-bottom: 4rem;
            }

            .weapon-card {
                width: 220px; height: 320px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 2rem; display: flex; flex-direction: column;
                justify-content: space-between; cursor: pointer;
                transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                position: relative;
                backdrop-filter: blur(10px);
            }

            .weapon-card:hover {
                transform: translateY(-10px);
                border-color: #0ff;
                background: rgba(0,255,255,0.05);
                box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,255,0.2);
            }

            .weapon-card.active {
                border-color: #0ff;
                background: rgba(0,255,255,0.08);
                box-shadow: 0 0 30px rgba(0,255,255,0.3);
            }

            .weapon-name { font-size: 1.5rem; font-weight: 900; margin: 0; }
            .weapon-type { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.2rem; }
            .weapon-desc { font-size: 0.8rem; color: #555; line-height: 1.4; margin-top: 1rem; }

            .start-btn {
                padding: 1.5rem 6rem;
                background: #fff; color: #000;
                font-weight: 900; font-size: 1.2rem;
                text-transform: uppercase; letter-spacing: 0.5rem;
                border: none; cursor: pointer;
                transition: all 0.3s ease;
                clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
            }

            .start-btn:hover {
                background: #0ff;
                box-shadow: 0 0 50px rgba(0,255,255,0.5);
                transform: scale(1.05);
            }

            .options-row {
                display: flex; gap: 4rem; margin-top: 3rem;
                font-size: 0.8rem; color: #444;
            }
            .opt { cursor: pointer; transition: color 0.3s; }
            .opt:hover { color: #fff; }
            .opt.active { color: #0ff; }
        `;
        document.head.appendChild(style);

        this.overlay = document.createElement("div");
        this.overlay.id = "menu-overlay";
        this.render();
        document.body.appendChild(this.overlay);
    }

    render() {
        this.overlay.innerHTML = `
            <div class="menu-content">
                <div class="title-box">
                    <h1 class="title">NEON</h1>
                    <div class="section-label">Tactical Infiltration // Loadout Selection</div>
                </div>

                <div class="loadout-grid">
                    <div class="weapon-card ${this.selectedWeapon === 'M4A1' ? 'active' : ''}" data-weapon="M4A1">
                        <div>
                            <p class="weapon-type">Assault Rifle</p>
                            <h2 class="weapon-name">M4A1</h2>
                            <p class="weapon-desc">High precision carbine. Reliable in all urban combat scenarios.</p>
                        </div>
                    </div>
                    <div class="weapon-card ${this.selectedWeapon === 'AK47' ? 'active' : ''}" data-weapon="AK47">
                        <div>
                            <p class="weapon-type">Heavy Rifle</p>
                            <h2 class="weapon-name">AK-47</h2>
                            <p class="weapon-desc">Unmatched stopping power. Significant vertical recoil control required.</p>
                        </div>
                    </div>
                    <div class="weapon-card ${this.selectedWeapon === 'MP5' ? 'active' : ''}" data-weapon="MP5">
                        <div>
                            <p class="weapon-type">Submachine Gun</p>
                            <h2 class="weapon-name">MP5</h2>
                            <p class="weapon-desc">Tactical SMG. Superior rate of fire for close-quarters infiltration.</p>
                        </div>
                    </div>
                </div>

                <button class="start-btn" id="start-btn">Infiltrate</button>

                <div class="options-row">
                    <div class="opt ${this.graphicsQuality === 'LOW' ? 'active' : ''}" data-opt="LOW">Performance</div>
                    <div class="opt ${this.graphicsQuality === 'HIGH' ? 'active' : ''}" data-opt="HIGH">Cinematic (SSR/Fog)</div>
                </div>
            </div>
        `;

        this.overlay.querySelectorAll('.weapon-card').forEach(card => {
            card.onclick = () => {
                this.selectedWeapon = card.dataset.weapon;
                this.render();
            };
        });

        this.overlay.querySelectorAll('.opt').forEach(opt => {
            opt.onclick = () => {
                this.graphicsQuality = opt.dataset.opt;
                this.render();
            };
        });

        const btn = this.overlay.querySelector("#start-btn");
        if (btn) {
            btn.onclick = () => {
                this.hide();
                if (this.onStart) this.onStart({
                    weapon: this.selectedWeapon,
                    quality: this.graphicsQuality
                });
            };
        }
    }

    showGameOver() {
        this.overlay.style.display = "flex";
        this.overlay.style.opacity = "1";
        this.overlay.innerHTML = `
            <div class="menu-content">
                <div class="title-box">
                    <h1 class="title" style="background: linear-gradient(to bottom, #f00, #500); -webkit-text-fill-color: transparent;">TERMINATED</h1>
                    <div class="section-label" style="color: #f00;">MISSION ABORTED // CRITICAL SYSTEM FAILURE</div>
                </div>
                
                <button class="start-btn" onclick="window.location.reload()" style="border-color: #f00; color: #f00; background: rgba(255,0,0,0.1);">Restart Operation</button>
            </div>
        `;
    }

    hide() {
        this.overlay.style.opacity = "0";
        setTimeout(() => {
            this.overlay.style.display = "none";
        }, 1000);
    }
}
