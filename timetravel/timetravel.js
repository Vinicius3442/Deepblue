// --- SETUP BÁSICO DA CENA 3D ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('time-travel-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// --- ELEMENTOS DA UI ---
const yearCounter = document.getElementById('year-counter');

// --- CRIANDO OS OBJETOS E LUZES ---
const textureLoader = new THREE.TextureLoader();

// Sol
const sunLight = new THREE.PointLight(0xffddaa, 2, 500);
scene.add(sunLight);
const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: textureLoader.load('./img/sun.jpg') });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Terra
const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ map: textureLoader.load('./img/earth.jpg') });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Câmera
camera.position.z = 80;
camera.lookAt(sun.position);

// --- LÓGICA DA ANIMAÇÃO E DO CONTADOR (VERSÃO CORRIGIDA) ---
const INITIAL_SPEED = 0.005; // Guardamos a velocidade inicial como uma constante
let angle = 0;
let speed = INITIAL_SPEED; // A velocidade começa com o valor inicial
const accelerationFactor = 1.0035;

let currentYear = 2025;
let lastOrbitAngle = 0;

function animate() {
    requestAnimationFrame(animate);

    // Acelera a velocidade de forma exponencial
    speed *= accelerationFactor;

    // Move a Terra e o Sol
    angle -= speed;
    earth.position.x = 60 * Math.cos(angle);
    earth.position.z = 60 * Math.sin(angle);
    earth.rotation.y -= 0.05;
    sun.rotation.y += speed * 0.5;

    // --- LÓGICA DO CONTADOR DE ANO (AGORA CORRIGIDA) ---
    if (lastOrbitAngle - angle >= (2 * Math.PI)) {
        // A redução de anos agora é a proporção da velocidade atual pela inicial.
        // Isso garante que no início, a redução seja exatamente 1.
        const yearReductionPerOrbit = 1;
        
        currentYear -= yearReductionPerOrbit;
        lastOrbitAngle -= (2 * Math.PI);
    }

    // Atualiza o texto na tela
    if (speed > 0.2) {
        yearCounter.textContent = "?";
    } else {
        yearCounter.textContent = Math.floor(currentYear);
    }
    
    renderer.render(scene, camera);
}

// Inicia a animação
animate();

// --- REDIRECIONAMENTO APÓS A ANIMAÇÃO ---
setTimeout(() => {
    const infoText = document.getElementById('info-text');
    infoText.textContent = "SALTO TEMPORAL IMINENTE...";

    setTimeout(() => {
        document.body.style.animation = "flash 0.5s forwards";
        setTimeout(() => {
            window.location.href = '../timeline/select.html';
        }, 500);
    }, 30000);

}, 1000);