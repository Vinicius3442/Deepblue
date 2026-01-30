
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
let width, height;
let sunRays = [];
let bubbles = [];
let lastScrollY = 0;

// Configurações
const SUN_RAY_COUNT = 15;
const BUBBLE_COUNT = 0; // Quantidade de bolhas ativas no total
const MAX_RAY_DEPTH = 300; // Raios visíveis até 300m

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class SunRay {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = -100;
        this.length = Math.random() * height * 0.8 + 200;
        this.width = Math.random() * 50 + 20;
        this.angle = (Math.random() - 0.5) * 0.2 + (Math.PI / 2.2); // Levemente inclinado
        this.speed = Math.random() * 0.2 + 0.05;
        this.opacity = Math.random() * 0.1 + 0.05;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(deltaY) {
        this.phase += 0.01;
        this.opacity = (Math.sin(this.phase) * 0.05 + 0.1) * 0.8;

        // Movimento sutil lateral para simular refração
        this.x += Math.sin(this.phase) * 0.2;
    }

    draw(currentDepth) {
        // Opacidade baseada na profundidade (some depois dos 300m)
        const depthOpacity = Math.max(0, 1 - currentDepth / MAX_RAY_DEPTH);
        if (depthOpacity <= 0) return;

        ctx.save();
        ctx.translate(this.x, 0);
        ctx.rotate(this.angle - Math.PI / 2);

        const gradient = ctx.createLinearGradient(0, 0, 0, this.length);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity * depthOpacity})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, 0, this.width, this.length);
        ctx.restore();
    }
}
export function initVisuals() {
    canvas.id = "visuals-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5"; // Atrás da interface (bestiário, HUD), frente do fundo

    // Inserir antes do canvas de partículas ou junto
    const particleCanvas = document.getElementById("particle-canvas");
    if (particleCanvas) {
        particleCanvas.parentNode.insertBefore(canvas, particleCanvas);
    } else {
        document.body.appendChild(canvas);
    }

    resize();
    window.addEventListener("resize", resize);

    // Inicializar Raios de Sol
    for (let i = 0; i < SUN_RAY_COUNT; i++) {
        sunRays.push(new SunRay());
    }

    // Inicializar Bolhas
    for (let i = 0; i < BUBBLE_COUNT; i++) {
        bubbles.push(new Bubble());
    }
}

export function updateVisuals(currentDepth) {
    const newScrollY = window.scrollY;
    const deltaY = newScrollY - lastScrollY;
    lastScrollY = newScrollY;

    ctx.clearRect(0, 0, width, height);

    // Desenhar Raios Solar
    sunRays.forEach(ray => {
        ray.update(deltaY);
        ray.draw(currentDepth);
    });

    // Desenhar Bolhas
    bubbles.forEach(bubble => {
        bubble.update(deltaY * 0.5); // 0.5 para efeito parallax
        bubble.draw();
    });
}
