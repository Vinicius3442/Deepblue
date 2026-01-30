
// cambrian.js - Lógica para o Período Cambriano

const worldContainer = document.getElementById("world-container");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
const effectsCanvas = document.getElementById("cambrian-effects");
const ctx = effectsCanvas.getContext("2d");

// Estado do Mundo
let state = {
    cameraX: 0, // Posição horizontal da câmera (virtual)
    zoom: 1,
    isDragging: false,
    lastMouseX: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    creatures: []
};

// Configurações
const SCROLL_SPEED_FACTOR = 1.5; // Multiplicador de velocidade do arrasto
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

// Placeholder de Criaturas (Dados mínimos)
const CREATURE_TYPES = [
    { name: "Anomalocaris", src: "../../img/anomalocaris.png", width: 300, depthY: 0.3 }, // depthY: 0 (top) a 1 (bottom)
    { name: "Trilobita", src: "../../img/trilobite.png", width: 80, depthY: 0.8 },
    { name: "Opabinia", src: "../../img/opabinia.png", width: 150, depthY: 0.5 },
    { name: "Wiwaxia", src: "../../img/wiwaxia.png", width: 50, depthY: 0.9 }
];

// --- SISTEMA DE CÂMERA E SCROLL INFINITO ---

function init() {
    resize();
    window.addEventListener("resize", resize);

    // Controles de Mouse/Touch para arrastar
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("mouseleave", onPointerUp);

    // Zoom
    zoomInBtn.addEventListener("click", () => adjustZoom(0.1));
    zoomOutBtn.addEventListener("click", () => adjustZoom(-0.1));
    document.addEventListener("wheel", onWheel, { passive: false });

    // Spawn inicial
    spawnCreaturesInternal(-1000, 2000); // Spawnar numa área inicial

    // Loop visual
    requestAnimationFrame(loop);
}

function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    effectsCanvas.width = state.width;
    effectsCanvas.height = state.height;
}

function onPointerDown(e) {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    document.body.style.cursor = "grabbing";
}

function onPointerMove(e) {
    if (!state.isDragging) return;

    const deltaX = e.clientX - state.lastMouseX;
    state.lastMouseX = e.clientX;

    // Move a câmera (invertido: arrastar para esquerda move câmera para direita visualmente)
    state.cameraX -= deltaX * SCROLL_SPEED_FACTOR;

    updateWorldTransform();
    checkSpawn();
}

function onPointerUp() {
    state.isDragging = false;
    document.body.style.cursor = "default";
}

function onWheel(e) {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    adjustZoom(zoomDelta);
}

function adjustZoom(delta) {
    state.zoom += delta;
    state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom));
    updateWorldTransform();
}

function updateWorldTransform() {
    // A translação compensa a câmera. 
    // Como é 'infinito', o background CSS é fixo, mas movemos o container de entidades.
    // Usamos módulo para simular repetição se tivéssemos background padronizado, 
    // mas aqui apenas movemos as criaturas.

    worldContainer.style.transform = `scale(${state.zoom}) translateX(${-state.cameraX}px)`;
}

// --- LOGICA DE SPAWN E ENTIDADES ---

function spawnCreaturesInternal(startX, endX) {
    // Spawna criaturas aleatórias nesta faixa de X
    const density = 0.002; // criaturas por pixel
    const range = endX - startX;
    const count = Math.floor(range * density);

    for (let i = 0; i < count; i++) {
        const type = CREATURE_TYPES[Math.floor(Math.random() * CREATURE_TYPES.length)];
        const x = startX + Math.random() * range;
        const y = type.depthY * state.height * 0.8 + (Math.random() * 100); // Variação na altura

        const el = document.createElement("div"); // Placeholder box ou img
        el.className = "cambrian-creature";
        // el.innerHTML = `<img src="${type.src}" alt="${type.name}" style="width: 100%;">`; 
        // Usar div colorida temporária se não houver imagem
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${type.width}px`;
        el.style.height = `${type.width / 2}px`; // Aspect ratio chucro
        el.style.backgroundColor = `hsl(${Math.random() * 60 + 20}, 70%, 50%)`; // Cores quentes/terrosas
        el.style.borderRadius = "50px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.textContent = type.name;
        el.style.color = "white";
        el.style.textShadow = "1px 1px 2px black";

        worldContainer.appendChild(el);
        state.creatures.push({ el, x, y });
    }
}

let lastSpawnCheckedCameraX = 0;
function checkSpawn() {
    // Se moveu mais de 500px, spawna mais na direção do movimento
    if (Math.abs(state.cameraX - lastSpawnCheckedCameraX) > 500) {
        const direction = state.cameraX > lastSpawnCheckedCameraX ? 1 : -1;
        const spawnWidth = 1000;

        let startX, endX;

        if (direction > 0) {
            // Movendo para direita -> spawnar à direita
            startX = state.cameraX + state.width + 100; // Um pouco além da tela
            endX = startX + spawnWidth;
        } else {
            // Movendo para esquerda -> spawnar à esquerda
            endX = state.cameraX - 100;
            startX = endX - spawnWidth;
        }

        spawnCreaturesInternal(startX, endX);
        lastSpawnCheckedCameraX = state.cameraX;

        // Limpeza (opcional para performance: remover criaturas muito longe)
        cleanupCreatures();
    }
}

function cleanupCreatures() {
    // Remove criaturas que estão muito longe (ex: 2 telas de distância)
    const threshold = state.width * 3;

    state.creatures = state.creatures.filter(c => {
        const distance = Math.abs(c.x - state.cameraX);
        if (distance > threshold) {
            c.el.remove();
            return false;
        }
        return true;
    });
}

// --- EFEITOS VISUAIS (Sun Rays Simplificados) ---
// Reutilizando lógica similar ao visual.js mas adaptada para Canvas 2D fixo

class SunRay {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * state.width;
        this.y = -100;
        this.length = Math.random() * state.height * 0.8 + 200;
        this.width = Math.random() * 30 + 10;
        this.angle = (Math.random() - 0.5) * 0.2 + (Math.PI / 2.2);
        this.speed = Math.random() * 0.2 + 0.05;
        this.opacity = Math.random() * 0.1 + 0.05;
        this.phase = Math.random() * Math.PI * 2;
    }
    update() {
        this.phase += 0.01;
        this.opacity = (Math.sin(this.phase) * 0.05 + 0.1) * 0.6;
        this.x += Math.sin(this.phase) * 0.2;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, -50); // Sempre do topo
        ctx.rotate(this.angle - Math.PI / 2);
        const gradient = ctx.createLinearGradient(0, 0, 0, this.length);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, 0, this.width, this.length);
        ctx.restore();
    }
}

const sunRays = Array.from({ length: 20 }, () => new SunRay());

function loop() {
    // Render Efeitos
    ctx.clearRect(0, 0, state.width, state.height);
    sunRays.forEach(ray => {
        ray.update();
        ray.draw();
    });

    requestAnimationFrame(loop);
}

init();
