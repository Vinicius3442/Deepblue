document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES GLOBAIS DA SIMULAÇÃO ---
  const CONFIG = {
    MAX_DEPTH: 11000,
    PIXELS_PER_METER: 8,
    ANIMAL_ACTIVATION_RANGE: 1500,
  };

  // --- ELEMENTOS DO DOM ---
  const oceanAbyss = document.getElementById("ocean-abyss");
  const oceanBackground = document.querySelector(".ocean-background");
  const depthIndicator = document.getElementById("depth-indicator");
  const depthValueSpan = document.querySelector("#depth-indicator .depth-value");
  const titleSlide = document.querySelector(".title-slide");

  // --- DEFINIÇÃO DAS ZONAS E CORES ---
  const ZONES = [
    { id: "zone-epipelagic", name: "Epipelágica", startDepth: 0, color: [0, 119, 190] },
    { id: "zone-mesopelagic", name: "Mesopelágica", startDepth: 200, color: [0, 66, 104] },
    { id: "zone-bathypelagic", name: "Batipelágica", startDepth: 1000, color: [2, 25, 40] },
    { id: "zone-abyssopelagic", name: "Abissopelágica", startDepth: 4000, color: [1, 8, 15] },
    { id: "zone-hadopelagic", name: "Hadopelágica", startDepth: 6000, color: [0, 2, 5] },
    { id: "final-depth", name: "Fim", startDepth: CONFIG.MAX_DEPTH, color: [0, 0, 0] },
  ];

  // --- DADOS DOS ANIMAIS ---
  let animals = [];
  let currentDepth = 0;

  // --- ESTADO ---
  let lastScrollY = 0;
  let isTicking = false;

  // --- MODAL ---
  // Crie o modal apenas UMA vez e adicione ao body
  const modal = document.createElement("div");
  modal.className = "animal-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <img src="" alt="Animal Image">
      <h2 class="modal-title"></h2>
      <h3 class="modal-scientific-name"></h3>
      <p class="modal-description"></p>
    </div>
  `;
  document.body.appendChild(modal);

  // Obtenha as referências dos elementos internos do modal APÓS ele ser adicionado ao DOM
  const modalImg = modal.querySelector("img");
  const modalTitle = modal.querySelector(".modal-title");
  const modalScientific = modal.querySelector(".modal-scientific-name");
  const modalDescription = modal.querySelector(".modal-description");
  const modalCloseBtn = modal.querySelector(".modal-close");

  // Listener para fechar o modal
  modalCloseBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Opcional: Fechar o modal clicando fora do conteúdo
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("active");
    }
  });


  // --- INICIALIZAÇÃO ---
  function init() {
    const totalHeight = CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER + window.innerHeight;
    oceanAbyss.style.height = `${totalHeight}px`;

    ZONES.forEach(zone => {
      const element = document.getElementById(zone.id);
      if (element) {
        const zoneTop = zone.startDepth * CONFIG.PIXELS_PER_METER;
        element.style.top = `${zoneTop}px`;
      }
    });

    prepareAnimals();
    window.addEventListener("scroll", onScroll);
    update(); // Dispara uma atualização inicial
  }

  // --- SCROLL ---
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
    currentDepth = Math.min(Math.floor(scrollY / CONFIG.PIXELS_PER_METER), CONFIG.MAX_DEPTH);

    const titleOpacity = Math.max(0, 1 - (scrollY / (window.innerHeight * 0.75)));
    titleSlide.style.opacity = titleOpacity;
    titleSlide.style.pointerEvents = titleOpacity > 0 ? "auto" : "none";

    depthValueSpan.textContent = currentDepth.toLocaleString("pt-BR");
    depthIndicator.style.opacity = scrollY > 50 ? 1 : 0;

    updateBackgroundColor(currentDepth);
    checkAnimalActivation();
  }

  function updateBackgroundColor(depth) {
    let startZone = ZONES[0];
    let endZone = ZONES[1];

    for (let i = 0; i < ZONES.length - 1; i++) {
      if (depth >= ZONES[i].startDepth && depth < ZONES[i + 1].startDepth) {
        startZone = ZONES[i];
        endZone = ZONES[i + 1];
        break;
      }
      if (depth >= ZONES[ZONES.length - 2].startDepth && i === ZONES.length - 2) {
        startZone = ZONES[ZONES.length - 2];
        endZone = ZONES[ZONES.length - 1];
        break;
      }
    }

    let blendFactor = 0;
    if (endZone.startDepth > startZone.startDepth) {
      blendFactor = (depth - startZone.startDepth) / (endZone.startDepth - startZone.startDepth);
    }

    const r = startZone.color[0] + blendFactor * (endZone.color[0] - startZone.color[0]);
    const g = startZone.color[1] + blendFactor * (endZone.color[1] - startZone.color[1]);
    const b = startZone.color[2] + blendFactor * (endZone.color[2] - startZone.color[2]);
    oceanBackground.style.backgroundColor = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  // --- ANIMAIS ---
  function prepareAnimals() {
    document.querySelectorAll('[data-animal="true"]').forEach(figure => {
      const gallery = figure.parentElement;
      const galleryRect = gallery.getBoundingClientRect(); // Use gallery.getBoundingClientRect() para referências

      const depth = parseInt(figure.dataset.depth, 10);
      const type = figure.dataset.type || "generic";
      const articlePath = figure.dataset.article || null;

      const baseSpeed = 0.2 + Math.random() * 0.4;
      const smoothness = 0.015 + Math.random() * 0.015;
      const verticalDrift = 0.2 + Math.random() * 0.4;

      const animal = {
        figure,
        img: figure.querySelector("img"),
        depth,
        type,
        articlePath,
        isActive: false,
        x: Math.random() * (window.innerWidth - (figure.offsetWidth || 100)), // Posição relativa à viewport
        y: Math.random() * (window.innerHeight - (figure.offsetHeight || 100)), // Posição relativa à viewport
        homeY: window.innerHeight / 2,
        speed: baseSpeed,
        baseSpeed,
        wander: 0.6 + Math.random() * 0.5,
        smoothness,
        verticalDrift,
        direction: Math.random() * Math.PI * 2,
        turnSpeed: (Math.random() - 0.5) * 0.002,
        targetDirection: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.4,
        flip: 1,
        time: Math.random() * Math.PI * 2,
      };

      animal.figure.style.opacity = 0;
      animal.figure.style.transition = 'opacity 0.5s ease-in-out';

      // Listener para abrir o modal
      figure.addEventListener("click", async () => {
        console.log("Animal clicked:", animal.img.alt, "Path:", animal.articlePath); // Debug
        if (!animal.articlePath) {
          console.warn("Animal sem caminho de artigo:", animal.img.alt);
          return;
        }
        try {
          const response = await fetch(animal.articlePath);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          modalImg.src = data.img;
          modalTitle.textContent = data.name;
          modalScientific.textContent = data.scientificName || "";
          modalDescription.textContent = data.description;
          modal.classList.add("active"); // Ativa o modal
        } catch (err) {
          console.error("Erro ao carregar artigo JSON:", err);
        }
      });

      animals.push(animal);
    });

    animateAnimals();
  }

  function checkAnimalActivation() {
    const range = CONFIG.ANIMAL_ACTIVATION_RANGE;
    animals.forEach(animal => {
      const viewportCenterDepth = currentDepth + (window.innerHeight / 2 / CONFIG.PIXELS_PER_METER);
      const isInRange = Math.abs(animal.depth - viewportCenterDepth) < range / 2;

      if (isInRange && !animal.isActive) {
        animal.isActive = true;
        animal.figure.style.opacity = 1;
      } else if (!isInRange && animal.isActive) {
        animal.isActive = false;
        animal.figure.style.opacity = 0;
      }
    });
  }


  function animateAnimals() {
    animals.forEach(animal => {
      if (!animal.isActive) {
        // Se o animal não estiver ativo, não precisamos animá-lo nem atualizar sua posição
        return;
      }

      // Certifique-se de que galleryRect está atualizado para o posicionamento relativo
      // A posição dos animais deve ser relativa ao 'zone-cluster' pai
      // Pegar o 'zone-cluster' pai para calcular o offset
      const parentZone = animal.figure.closest('.zone-cluster');
      if (!parentZone) return; // Se não houver pai, algo está errado

      const parentZoneRect = parentZone.getBoundingClientRect(); // Posição da zona na viewport

      const imgWidth = animal.img?.offsetWidth || animal.figure.offsetWidth || 50;
      const imgHeight = animal.img?.offsetHeight || animal.figure.offsetHeight || 50;

      animal.time += 0.01;

      if (Math.random() < 0.01) animal.targetDirection += (Math.random() - 0.5) * animal.wander * 0.5;
      let angleDiff = Math.atan2(Math.sin(animal.targetDirection - animal.direction), Math.cos(animal.targetDirection - animal.direction));
      animal.direction += angleDiff * animal.smoothness;

      let currentSpeedX = Math.cos(animal.direction) * animal.speed;
      let currentSpeedY = Math.sin(animal.direction) * animal.speed;

      switch (animal.type) {
        case "cardume": currentSpeedX *= 1.1; animal.y += Math.sin(animal.time * 2) * 0.8; break;
        case "predador-pequeno":
        case "predador-medio":
        case "predador-grande":
          if (Math.random() < 0.002) animal.speed = animal.baseSpeed * 2;
          else animal.speed = animal.speed * 0.95 + animal.baseSpeed * 0.05;
          currentSpeedX = Math.cos(animal.direction) * animal.speed;
          currentSpeedY = Math.sin(animal.direction) * animal.speed;
          break;
        case "lula":
        case "polvo":
          currentSpeedX *= 0.5;
          currentSpeedY = Math.sin(animal.time * 1.5) * animal.verticalDrift * 1.2;
          if (Math.random() < 0.008) animal.targetDirection = Math.random() * Math.PI * 2;
          break;
        case "aguaviva":
          currentSpeedX *= 0.1;
          currentSpeedY = Math.sin(animal.time * 0.7) * animal.verticalDrift * 1.5;
          break;
        case "crustaceo":
          currentSpeedX *= 0.2;
          currentSpeedY = Math.sin(animal.time * 3) * 0.2;
          if (Math.random() < 0.01) animal.targetDirection = Math.random() * Math.PI * 2;
          break;
      }

      animal.x += currentSpeedX;
      animal.y += currentSpeedY;

      // Limites horizontais e verticais para garantir que os animais fiquem dentro da galeria do pai
      animal.x = Math.max(0, Math.min(animal.x, parentZoneRect.width - imgWidth));
      animal.y = Math.max(0, Math.min(animal.y, parentZoneRect.height - imgHeight));

      animal.flip = Math.cos(animal.direction) < 0 ? -1 : 1;

      animal.figure.style.transform = `translate(${animal.x}px, ${animal.y}px) scale(${animal.scale}) scaleX(${animal.flip})`;
    });

    requestAnimationFrame(animateAnimals);
  }

  init();
});