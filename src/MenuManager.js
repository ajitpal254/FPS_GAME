export class MenuManager {
    constructor(onStart) {
        this.onStart = onStart;
        this.createMenu();
    }

    createMenu() {
        const style = document.createElement("style");
        style.innerHTML = `
            #menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at center, #0a0a0a 0%, #000 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                color: #0ff;
                font-family: 'Segoe UI', Roboto, sans-serif;
                transition: opacity 1s ease-out;
            }
            .title {
                font-size: 8rem;
                font-weight: 900;
                letter-spacing: 1rem;
                text-shadow: 0 0 20px #0ff, 0 0 40px #0ff;
                margin-bottom: 0;
                animation: flicker 4s infinite;
            }
            .subtitle {
                font-size: 1.5rem;
                letter-spacing: 0.5rem;
                color: #555;
                margin-bottom: 4rem;
                text-transform: uppercase;
            }
            .start-btn {
                padding: 1rem 3rem;
                background: transparent;
                border: 2px solid #0ff;
                color: #0ff;
                font-size: 1.2rem;
                text-transform: uppercase;
                letter-spacing: 0.3rem;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }
            .start-btn:hover {
                background: #0ff;
                color: #000;
                box-shadow: 0 0 30px #0ff;
                transform: scale(1.1);
            }
            .loading-text {
                margin-top: 20px;
                color: #333;
                font-size: 0.9rem;
            }
            @keyframes flicker {
                0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; }
                20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; }
            }
        `;
        document.head.appendChild(style);

        this.overlay = document.createElement("div");
        this.overlay.id = "menu-overlay";
        this.overlay.innerHTML = `
            <h1 class="title">NEON</h1>
            <p class="subtitle">METROPOLIS // SECTOR 01</p>
            <button class="start-btn" id="start-btn">Enter City</button>
            <p class="loading-text">RETRIEVING URBAN CONNECTIVITY...</p>
        `;
        document.body.appendChild(this.overlay);

        document.getElementById("start-btn").addEventListener("click", () => {
            this.hide();
            if (this.onStart) this.onStart();
        });
    }

    hide() {
        this.overlay.style.opacity = "0";
        setTimeout(() => {
            this.overlay.style.display = "none";
        }, 1000);
    }
}
