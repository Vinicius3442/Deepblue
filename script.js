document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES GLOBAIS DA SIMULAÇÃO ---
    const CONFIG = {
        MAX_DEPTH: 11000, // Profundidade máxima em metros
        PIXELS_PER_METER: 8, // Aumente para uma descida "mais rápida", diminua para mais longa
        ANIMAL_VIEWPORT_PADDING: 200, // Distância (px) antes/depois de entrar na tela para ativar animais
    };

    // --- ELEMENTOS DO DOM ---
    const oceanAbyss = document.getElementById('ocean-abyss');
    const oceanBackground = document.querySelector('.ocean-background');
    const depthIndicator = document.getElementById('depth-indicator');
    const depthValueSpan = document.querySelector('#depth-indicator .depth-value');
    const titleSlide = document.querySelector('.title-slide');

    // --- DEFINIÇÃO DAS ZONAS E CORES ---
    const ZONES = [
        { id: 'zone-epipelagic', name: 'Epipelágica', startDepth: 0, color: [135, 206, 235] }, // SkyBlue
        { id: 'zone-mesopelagic', name: 'Mesopelágica', startDepth: 200, color: [93, 152, 212] }, // SteelBlue
        { id: 'zone-bathypelagic', name: 'Batipelágica', startDepth: 1000, color: [26, 77, 128] }, // DarkSlateBlue
        { id: 'zone-abyssopelagic', name: 'Abissopelágica', startDepth: 4000, color: [10, 31, 51] },  // Very Dark Blue
        { id: 'zone-hadopelagic', name: 'Hadopelágica', startDepth: 6000, color: [0, 10, 18] },     // Almost Black
        { id: 'final-depth', name: 'Fim', startDepth: CONFIG.MAX_DEPTH, color: [0, 0, 0] }         // Black
    ];

    // --- DADOS DOS ANIMAIS ---
    let animals = [];

    // --- ESTADO DA APLICAÇÃO ---
    let lastScrollY = 0;
    let isTicking = false;

    // --- INICIALIZAÇÃO ---
    function init() {
        // 1. Configurar a altura total do oceano para permitir a rolagem em escala real
        const totalHeight = CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER;
        oceanAbyss.style.height = `${totalHeight}px`;

        // 2. Posicionar cada cluster de zona na profundidade correta
        ZONES.forEach(zone => {
            const element = document.getElementById(zone.id);
            if (element) {
                const yPos = zone.startDepth * CONFIG.PIXELS_PER_METER;
                element.style.top = `${yPos}px`;
                zone.element = element; // Armazena a referência do elemento
            }
        });

        // 3. Preparar os animais para a animação
        prepareAnimals();

        // 4. Adicionar listeners de eventos
        window.addEventListener('scroll', onScroll);

        // 5. Chamar a atualização uma vez para o estado inicial
        update();
    }

    // --- LÓGICA DE ATUALIZAÇÃO NO SCROLL ---
    function onScroll() {
        lastScrollY = window.scrollY;
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                update();
                isTicking = false;
            });
            isTicking = true;
        }
    }

    function update() {
        const scrollY = lastScrollY;
        const currentDepth = Math.min(Math.floor(scrollY / CONFIG.PIXELS_PER_METER), CONFIG.MAX_DEPTH);
        
        // Esconde a tela de título após o início da rolagem
        titleSlide.style.opacity = Math.max(0, 1 - (scrollY / (window.innerHeight / 2)));

        // Atualiza o indicador de profundidade
        depthValueSpan.textContent = currentDepth.toLocaleString('pt-BR');
        depthIndicator.style.opacity = scrollY > 100 ? 1 : 0;

        // Atualiza a cor de fundo com base na profundidade
        updateBackgroundColor(currentDepth);
        
        // Ativa/desativa animais com base na visibilidade
        checkAnimalActivation();
    }

    function updateBackgroundColor(depth) {
        // Encontra as duas cores entre as quais a profundidade atual se encontra
        let startZone = ZONES[0];
        let endZone = ZONES[1];
        for (let i = 0; i < ZONES.length - 1; i++) {
            if (depth >= ZONES[i].startDepth && depth < ZONES[i + 1].startDepth) {
                startZone = ZONES[i];
                endZone = ZONES[i + 1];
                break;
            }
            if (depth >= ZONES[ZONES.length - 2].startDepth) {
                startZone = ZONES[ZONES.length - 2];
                endZone = ZONES[ZONES.length - 1];
            }
        }

        // Calcula o fator de interpolação (0 a 1) entre as duas zonas
        const blendFactor = (depth - startZone.startDepth) / (endZone.startDepth - startZone.startDepth);
        
        // Interpola a cor RGB
        const r = startZone.color[0] + blendFactor * (endZone.color[0] - startZone.color[0]);
        const g = startZone.color[1] + blendFactor * (endZone.color[1] - startZone.color[1]);
        const b = startZone.color[2] + blendFactor * (endZone.color[2] - startZone.color[2]);

        oceanBackground.style.background = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }


    // --- LÓGICA DE ANIMAÇÃO DOS ANIMAIS ---
    function prepareAnimals() {
        document.querySelectorAll('[data-animal="true"]').forEach((figure, i) => {
            const gallery = figure.parentElement;
            const rect = gallery.getBoundingClientRect();
            
            animals.push({
                figure: figure,
                img: figure.querySelector('img'),
                isActive: false,
                // Posições e velocidades randomizadas para cada animal
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                angle: Math.random() * 360,
                speed: 0.2 + Math.random() * 0.5,
                turnSpeed: 1 + Math.random() * 2,
                scale: 0.8 + Math.random() * 0.4,
                targetX: Math.random() * rect.width,
                targetY: Math.random() * rect.height,
            });
            figure.style.transform = `scale(${animals[i].scale})`;
        });
        
        // Inicia o loop de animação contínuo
        animateAnimals();
    }
    
    function checkAnimalActivation() {
        const viewportTop = lastScrollY;
        const viewportBottom = viewportTop + window.innerHeight;

        ZONES.forEach(zone => {
            if (!zone.element) return;
            
            const zoneTop = zone.startDepth * CONFIG.PIXELS_PER_METER;
            const zoneHeight = zone.element.offsetHeight;
            const zoneBottom = zoneTop + zoneHeight;

            // Verifica se a zona está na área visível (com uma margem)
            if (zoneBottom > viewportTop - CONFIG.ANIMAL_VIEWPORT_PADDING && zoneTop < viewportBottom + CONFIG.ANIMAL_VIEWPORT_PADDING) {
                // Ativa animais desta zona
                animals.filter(a => a.figure.parentElement.parentElement === zone.element).forEach(a => a.isActive = true);
            } else {
                // Desativa animais
                animals.filter(a => a.figure.parentElement.parentElement === zone.element).forEach(a => a.isActive = false);
            }
        });
    }

    function animateAnimals() {
        animals.forEach(animal => {
            if (!animal.isActive) return;

            // Lógica de movimento simples: move em direção a um ponto alvo
            const dx = animal.targetX - animal.x;
            const dy = animal.targetY - animal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Se chegou ao alvo, define um novo alvo
            if (distance < 50) {
                const galleryRect = animal.figure.parentElement.getBoundingClientRect();
                animal.targetX = Math.random() * galleryRect.width;
                animal.targetY = Math.random() * galleryRect.height;
            }

            // Calcula o ângulo em direção ao alvo
            const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Suaviza a rotação
            let angleDiff = targetAngle - animal.angle;
            while (angleDiff < -180) angleDiff += 360;
            while (angleDiff > 180) angleDiff -= 360;
            animal.angle += angleDiff * 0.05;
            
            // Move o animal
            animal.x += Math.cos(animal.angle * Math.PI / 180) * animal.speed;
            animal.y += Math.sin(animal.angle * Math.PI / 180) * animal.speed;

            // Vira a imagem horizontalmente com base na direção
            const scaleX = (animal.angle > 90 || animal.angle < -90) ? -1 : 1;
            
            animal.figure.style.transform = `translate(${animal.x}px, ${animal.y}px) scale(${animal.scale}) scaleX(${scaleX}) rotate(${scaleX === -1 ? 180 : 0}deg)`;
        });

        requestAnimationFrame(animateAnimals);
    }
    
    // --- INICIA A SIMULAÇÃO ---
    init();

});