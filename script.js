document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E ELEMENTOS ---
  const CONFIG = {
    MAX_DEPTH: 11000,
    PIXELS_PER_METER: 50,
    ANIMAL_ACTIVATION_RANGE: 300, // Faixa de profundidade (em metros) para ativar os animais
    OCEAN_FLOOR_START_DEPTH: 7000, // Profundidade onde o solo começa a aparecer
    OCEAN_FLOOR_FULL_OPACITY_DEPTH: 10000, // Profundidade onde o solo está totalmente visível
  };

  const oceanAbyss = document.getElementById("ocean-abyss");
  const oceanBackground = document.querySelector(".ocean-background");
  const depthIndicator = document.getElementById("depth-indicator");
  const depthValueSpan = document.querySelector(
    "#depth-indicator .depth-value"
  );
  const titleSlide = document.querySelector(".title-slide");
  const oceanFloor = document.querySelector(".ocean-floor-svg-wrapper"); // Seleciona o novo elemento do solo
  const particleCanvas = document.getElementById("particle-canvas");
  const ctx = particleCanvas.getContext("2d");
  let particles = [];
  const PARTICLE_START_DEPTH = 1000;
  const logDisplay = document.getElementById("log-display");
  const logMessagesList = document.getElementById("log-messages-list");
  const vehicleHud = document.getElementById("vehicle-hud");
  const hudPressure = document.getElementById("hud-pressure");
  const hudTemperature = document.getElementById("hud-temperature");

  const ZONES = [
    {
      id: "zone-epipelagic",
      name: "Epipelágica",
      startDepth: 0,
      color: [0, 119, 190],
      logged: false,
    },
    {
      id: "zone-mesopelagic",
      name: "Mesopelágica",
      startDepth: 200,
      color: [0, 66, 104],
      logged: false,
    },
    {
      id: "zone-bathypelagic",
      name: "Batipelágica",
      startDepth: 1000,
      color: [2, 25, 40],
      logged: false,
    },
    {
      id: "zone-abyssopelagic",
      name: "Abissopelágica",
      startDepth: 4000,
      color: [1, 8, 15],
      logged: false,
    },
    {
      id: "zone-hadopelagic",
      name: "Hadopelágica",
      startDepth: 6000,
      color: [0, 2, 5],
      logged: false,
    },
    {
      id: "final-depth",
      name: "Fim",
      startDepth: CONFIG.MAX_DEPTH,
      color: [0, 0, 0],
      logged: false,
    },
  ];

  function calculatePressure(depth) {
    // A pressão na Terra aumenta em aproximadamente 1 atmosfera (ATM) a cada 10 metros de profundidade.
    // Começamos com 1 ATM na superfície.
    const pressure = 1 + depth / 10;
    return pressure;
  }

  function calculateTemperature(depth) {
    // A temperatura do oceano não cai de forma linear. Usamos um modelo de 3 camadas.
    const surfaceTemp = 20; // 20°C
    const deepTemp = 4; // 4°C

    if (depth <= 200) {
      // 1. Camada da Superfície (Epipelágica): A temperatura cai muito pouco.
      // Interpolação linear de 20°C a 19°C nos primeiros 200m.
      return surfaceTemp - depth / 200;
    } else if (depth <= 1000) {
      // 2. Termoclina (Mesopelágica): A temperatura cai drasticamente.
      // Interpolação linear de 19°C (a 200m) até 4°C (a 1000m).
      const progress = (depth - 200) / 800; // Progresso (0 a 1) dentro desta zona de 800m
      return 19 - 15 * progress; // 19°C - (diferença de 15°C * progresso)
    } else {
      // 3. Oceano Profundo: A temperatura permanece muito fria e estável.
      // Queda muito lenta de 4°C para ~2°C nos próximos 10.000m.
      const progress = (depth - 1000) / 10000;
      return deepTemp - 2 * progress;
    }
  }

  let animals = [];
  let currentDepth = 0;
  let lastScrollY = 0;
  let isTicking = false;

  // Variável para a "semente" do Perlin Noise simulado (para movimentos mais orgânicos)
  let noiseSeedX = Math.random() * 1000;
  let noiseSeedY = Math.random() * 1000;

  // --- ESTRUTURA HTML DO MODAL (sem alteração) ---
  const modal = document.createElement("div");
  modal.className = "animal-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <div class="modal-header">
        <h2 class="modal-title"></h2>
        <h3 class="modal-scientific-name"></h3>
      </div>
      <div class="modal-tabs">
        <button class="tab-button active" data-tab="tab-geral">Visão Geral</button>
        <button class="tab-button" data-tab="tab-ficha">Informações</button>
        <button class="tab-button" data-tab="tab-galeria">Galeria</button>
        <button class="tab-button" data-tab="tab-curiosidades">Curiosidades</button>
        <button class="tab-button" data-tab="tab-relacionados">Relacionados</button>
      </div>
      <div class="modal-body">
        <div class="tab-content active" id="tab-geral">
          <img class="modal-main-image" src="" alt="Imagem principal do animal">
          <p class="modal-description"></p>
        </div>
        <div class="tab-content" id="tab-ficha">
          <ul class="ficha-tecnica-list"></ul>
          <div class="info-module map-module"> <h4>Mapa de Distribuição</h4> <img src="" alt=""> </div>
          <div class="info-module size-module"> <h4>Comparativo de Tamanho</h4> <img src="" alt=""> <p></p> </div>
        </div>
        
        <div class="tab-content" id="tab-galeria">
          <div class="gallery-grid"></div>
          <div class="expanded-media-viewer">
            <span class="close-expanded-media">&times;</span>
            <div class="expanded-media-content"></div>
            <p class="expanded-media-caption"></p>  
          </div>
        </div>
        <div class="tab-content" id="tab-curiosidades"> <ul class="curiosidades-list"></ul> </div>
        <div class="tab-content" id="tab-relacionados"> <div class="related-species-grid"></div> </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // --- LÓGICA DO MODAL ---
  const modalCloseBtn = modal.querySelector(".modal-close");
  const modalTitle = modal.querySelector(".modal-title");
  const modalScientific = modal.querySelector(".modal-scientific-name");
  const tabsContainer = modal.querySelector(".modal-tabs");
  const expandedMediaViewer = modal.querySelector(".expanded-media-viewer");
  const closeExpandedMediaBtn = modal.querySelector(".close-expanded-media");
  const expandedMediaContent = modal.querySelector(".expanded-media-content");

  // --- NOVAS FUNÇÕES DE CONTROLE ---
  function openModal() {
    document.body.style.overflow = "hidden"; // Bloqueia o scroll da página
    modal.classList.add("active");
  }

  function closeModal() {
    document.body.style.overflow = "auto"; // Desbloqueia o scroll da página
    modal.classList.remove("active");
  }

  // Listeners agora chamam as funções de controle
  modalCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  tabsContainer.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") {
      const tabId = event.target.dataset.tab;
      tabsContainer
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
      modal
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));
      event.target.classList.add("active");
      modal.querySelector(`#${tabId}`).classList.add("active");
    }
  });

  function openAnimalModal(animalData) {
    modal.querySelector(".ficha-tecnica-list").innerHTML = "";
    modal.querySelector(".gallery-grid").innerHTML = "";
    modal.querySelector(".curiosidades-list").innerHTML = "";
    modal.querySelector(".related-species-grid").innerHTML = "";
    modalTitle.textContent = animalData.name;
    modalScientific.textContent = animalData.scientificName;
    modal.querySelector(".modal-main-image").src = animalData.img;
    modal.querySelector(".modal-description").textContent =
      animalData.description;
    const fichaList = modal.querySelector(".ficha-tecnica-list");
    for (const [key, value] of Object.entries(animalData.fichaTecnica)) {
      const li = document.createElement("li");
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      li.innerHTML = `<strong>${label}:</strong> <span>${value}</span>`; // Adicionado span para o valor
      fichaList.appendChild(li);
    }
    const mapModule = modal.querySelector(".map-module");
    if (animalData.mapaDistribuicao && animalData.mapaDistribuicao.img) {
      // Verifica se img existe
      mapModule.style.display = "block";
      mapModule.querySelector("img").src = animalData.mapaDistribuicao.img;
      mapModule.querySelector("img").alt =
        animalData.mapaDistribuicao.alt || "Mapa de Distribuição";
    } else {
      mapModule.style.display = "none";
    }
    const sizeModule = modal.querySelector(".size-module");
    if (animalData.comparativoTamanho && animalData.comparativoTamanho.img) {
      // Verifica se img existe
      sizeModule.style.display = "block";
      sizeModule.querySelector("img").src = animalData.comparativoTamanho.img;
      sizeModule.querySelector("img").alt =
        animalData.comparativoTamanho.alt || "Comparativo de Tamanho";
      sizeModule.querySelector("p").textContent =
        animalData.comparativoTamanho.descricao || "";
    } else {
      sizeModule.style.display = "none";
    }
    const galleryGrid = modal.querySelector(".gallery-grid");
    galleryGrid.innerHTML = ""; // Limpa a galeria para garantir que não haja duplicatas

    animalData.galeria.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "gallery-item-wrapper";

      let mediaElement;

      if (item.type === "image") {
        mediaElement = document.createElement("img");
        mediaElement.src = item.src;
        mediaElement.alt = item.alt;
      } else if (item.type === "video") {
        mediaElement = document.createElement("video");
        mediaElement.src = item.src;
        mediaElement.setAttribute("aria-label", item.alt);
        mediaElement.muted = true;
        mediaElement.loop = true;
        mediaElement.playsInline = true;
        mediaElement.preload = "metadata";
      }

      if (mediaElement) {
        wrapper.appendChild(mediaElement);
        galleryGrid.appendChild(wrapper);

        wrapper.addEventListener("click", () => {
          showExpandedMedia(item.type, item.src, item.alt, item.legenda);
        });
      }
    });

    expandedMediaViewer.classList.remove("active");
    const curiosidadesList = modal.querySelector(".curiosidades-list");
    animalData.curiosidades.forEach((fact) => {
      const li = document.createElement("li");
      li.textContent = fact;
      curiosidadesList.appendChild(li);
    });
    const relatedGrid = modal.querySelector(".related-species-grid");
    if (
      animalData.especiesRelacionadas &&
      animalData.especiesRelacionadas.length > 0
    ) {
      animalData.especiesRelacionadas.forEach((species) => {
        const item = document.createElement("div");
        item.className = "related-species-item";
        item.innerHTML = `<img src="${species.img}" alt="${species.nome}"><span>${species.nome}</span>`;
        relatedGrid.appendChild(item);
      });
    } else {
      relatedGrid.innerHTML =
        '<p style="text-align: center; opacity: 0.7;">Nenhuma espécie relacionada encontrada.</p>';
    }

    tabsContainer.querySelector('[data-tab="tab-geral"]').click();
    openModal();
  }

  function showExpandedMedia(type, src, alt, legenda) {
    expandedMediaContent.innerHTML = "";

    let mediaElement;
    if (type === "image") {
      mediaElement = document.createElement("img");
      mediaElement.src = src;
      mediaElement.alt = alt;
    } else if (type === "video") {
      mediaElement = document.createElement("video");
      mediaElement.src = src;
      mediaElement.setAttribute("aria-label", alt);
      mediaElement.controls = true;
      mediaElement.autoplay = true;
      mediaElement.loop = true;
      mediaElement.muted = false;
      mediaElement.playsInline = true;
    }

    if (mediaElement) {
      expandedMediaContent.appendChild(mediaElement);

      const captionElement = expandedMediaViewer.querySelector(
        ".expanded-media-caption"
      );
      if (legenda && legenda.trim() !== "") {
        captionElement.textContent = legenda;
        captionElement.style.display = "block";
      } else {
        captionElement.style.display = "none";
      }
    }

    closeExpandedMediaBtn.addEventListener(
      "click",
      () => {
        expandedMediaViewer.classList.remove("active");
        const currentMedia = expandedMediaContent.querySelector("video");
        if (currentMedia) {
          currentMedia.pause();
          currentMedia.currentTime = 0;
        }
      },
      { once: true }
    ); // Garante que o listener seja removido após um clique

    expandedMediaViewer.classList.add("active");
  }

  // --- FUNÇÃO PARA SIMULAR PERLIN NOISE (SIMPLIFICADA) ---
  // Esta é uma implementação MUITO simplificada e não um Perlin Noise real,
  // mas gera um movimento mais orgânico do que Math.random() puro.
  function pseudoPerlinNoise(x, y) {
    const freq = 0.05; // Frequência do "ruído"
    const amplitude = 0.5; // Amplitude do "ruído"
    return (
      (Math.sin(x * freq) + Math.sin(y * freq) + Math.sin((x + y) * freq)) *
        amplitude +
      Math.random() * 0.1
    );
  }

  // --- INICIALIZAÇÃO E ANIMAÇÃO ---
  function init() {
    // Define a altura total do #ocean-abyss para permitir o scroll
    const totalHeight =
      CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER + window.innerHeight;
    oceanAbyss.style.height = `${totalHeight}px`;

    // Posiciona as zonas de profundidade (apenas para referência visual no HTML)
    ZONES.forEach((zone) => {
      const element = document.getElementById(zone.id);
      if (element) {
        // Ajusta o top para que o título da zona apareça no início daquela profundidade
        element.style.top = `${zone.startDepth * CONFIG.PIXELS_PER_METER}px`;
      }
    });

    prepareAnimals();
    window.addEventListener("scroll", onScroll);
    update(); // Chamada inicial para renderizar tudo corretamente
    setupParticles();
    requestAnimationFrame(animateParticles);

    setTimeout(() => {
      addLogMessage("Sistemas online. Iniciando descida.");
    }, 1000);
  }

  function prepareAnimals() {
    document.querySelectorAll('[data-animal="true"]').forEach((figure) => {
      const specifiedScale = parseFloat(figure.dataset.scale);
      const scale = !isNaN(specifiedScale) ? specifiedScale : 1.0;

      // Inicializa a posição aleatoriamente dentro da galeria da zona
      const gallery = figure.parentElement;
      const initialX =
        Math.random() * (gallery.offsetWidth - (figure.offsetWidth || 100));
      const initialY =
        Math.random() * (gallery.offsetHeight - (figure.offsetHeight || 100));

      const animal = {
        figure,
        img: figure.querySelector("img"),
        depth: parseInt(figure.dataset.depth, 10),
        type: figure.dataset.type || "generic",
        articlePath: figure.dataset.article || null,
        isActive: false, // Só ativo quando visível
        x: initialX,
        y: initialY,
        vx: (Math.random() - 0.5) * 0.5, // Velocidade inicial X
        vy: (Math.random() - 0.5) * 0.5, // Velocidade inicial Y
        speed: 0.3 + Math.random() * 0.5, // Velocidade base dos animais
        maxSpeed: 0.8 + Math.random() * 0.5, // Velocidade máxima para picos
        wanderStrength: 0.02 + Math.random() * 0.03, // Força da mudança de direção
        scale: scale,
        flip: 1, // 1 para normal, -1 para flipado
        noiseOffsetX: Math.random() * 1000, // Offset para Perlin Noise
        noiseOffsetY: Math.random() * 1000, // Offset para Perlin Noise
        noiseSpeed: 0.005 + Math.random() * 0.005, // Velocidade do "tempo" para o noise
        name: figure.dataset.name || "Espécie desconhecida", // Pega o nome do HTML
        sighted: false, // Nova propriedade para controlar o log de avistamento
      };

      animal.figure.style.opacity = 0;
      animal.figure.style.transition = "opacity 0.5s ease-in-out"; // Transição suave de opacidade

      figure.addEventListener("click", async () => {
        if (!animal.articlePath) return; // Se não tiver articlePath, não faz nada
        try {
          const response = await fetch(animal.articlePath);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          openAnimalModal(data);
        } catch (err) {
          console.error("Erro ao carregar artigo JSON:", err);
        }
      });
      animals.push(animal);
    });
    animateAnimals(); // Inicia o loop de animação
  }

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
    currentDepth = Math.min(
      Math.floor(lastScrollY / CONFIG.PIXELS_PER_METER),
      CONFIG.MAX_DEPTH
    );

    // Efeito de fade-out para o título inicial
    const titleOpacity = Math.max(
      0,
      1 - lastScrollY / (window.innerHeight * 0.75)
    );
    titleSlide.style.opacity = titleOpacity;
    titleSlide.style.pointerEvents = titleOpacity > 0 ? "auto" : "none"; // Desabilita cliques quando invisível

    // Atualiza o indicador de profundidade
    depthValueSpan.textContent = currentDepth.toLocaleString("pt-BR");
    depthIndicator.style.opacity = lastScrollY > 50 ? 1 : 0; // Mostra/esconde o indicador

    if (lastScrollY > window.innerHeight * 0.8) {
      logDisplay.classList.add("visible");
    } else {
      logDisplay.classList.remove("visible");
    }
    if (lastScrollY > 50) {
      vehicleHud.style.opacity = 1;

      const pressure = calculatePressure(currentDepth);
      const temperature = calculateTemperature(currentDepth);

      hudPressure.textContent = pressure.toFixed(0); // Pressão sem casas decimais
      hudTemperature.textContent = temperature.toFixed(1); // Temperatura com uma casa decimal
    } else {
      vehicleHud.style.opacity = 0;
    }

    updateBackgroundColor(currentDepth);
    checkAnimalActivation();
    updateOceanFloor(currentDepth); // Nova função para o solo
    updateParticleVisibility(currentDepth);

    if (currentDepth >= CONFIG.MAX_DEPTH && !logCleared) {
      logMessagesList.innerHTML = "";
      setTimeout(() => {
        addLogMessage("SINAL PERDIDO...", "system");
        addLogMessage("FIM DA TRANSMISSÃO.", "system");
      }, 500);
      logCleared = true;
    }
  }

  function updateBackgroundColor(depth) {
    // Encontra a zona inicial e final para a interpolação de cor
    let startZone = ZONES[0],
      endZone = ZONES[1];
    for (let i = 0; i < ZONES.length - 1; i++) {
      if (depth >= ZONES[i].startDepth) {
        startZone = ZONES[i];
        endZone = ZONES[i + 1];
      }
    }

    // Lógica para registrar a entrada na zona (movida para cá e corrigida)
    if (startZone && !startZone.logged && startZone.startDepth > 0) {
      addLogMessage(`Entrando na Zona ${startZone.name}.`);
      startZone.logged = true;
    }

    // Calcula o fator de mistura entre as cores
    let blendFactor = 0;
    if (endZone.startDepth !== startZone.startDepth) {
      blendFactor = Math.max(
        0,
        Math.min(
          1,
          (depth - startZone.startDepth) /
            (endZone.startDepth - startZone.startDepth)
        )
      );
    }

    // Interpola as cores
    const r =
      startZone.color[0] +
      blendFactor * (endZone.color[0] - startZone.color[0]);
    const g =
      startZone.color[1] +
      blendFactor * (endZone.color[1] - startZone.color[1]);
    const b =
      startZone.color[2] +
      blendFactor * (endZone.color[2] - startZone.color[2]);

    oceanBackground.style.backgroundColor = `rgb(${Math.floor(r)}, ${Math.floor(
      g
    )}, ${Math.floor(b)})`;

    // Ajusta o brilho
    const brightnessFactor = 1 - (depth / CONFIG.MAX_DEPTH) * 0.8;
    oceanBackground.style.filter = `brightness(${brightnessFactor})`;
  }

  // SUBSTITUA A SUA FUNÇÃO INTEIRA POR ESTA:
  function checkAnimalActivation() {
    const range = CONFIG.ANIMAL_ACTIVATION_RANGE;
    animals.forEach((animal) => {
      const viewportCenterDepth =
        currentDepth + window.innerHeight / 2 / CONFIG.PIXELS_PER_METER;
      const isInRange =
        Math.abs(animal.depth - viewportCenterDepth) < range / 2;

      if (isInRange && !animal.isActive) {
        animal.isActive = true;
        animal.figure.style.opacity = 1;
        if (!animal.sighted) {
          addLogMessage(`AVISTAMENTO: ${animal.name}.`, "sighting");
          animal.sighted = true;
        }
      } else if (!isInRange && animal.isActive) {
        animal.isActive = false;
        animal.figure.style.opacity = 0;
      }
    });
  }

  function updateOceanFloor(depth) {
    if (depth >= CONFIG.OCEAN_FLOOR_START_DEPTH) {
      let floorOpacity = Math.min(
        1,
        (depth - CONFIG.OCEAN_FLOOR_START_DEPTH) /
          (CONFIG.OCEAN_FLOOR_FULL_OPACITY_DEPTH -
            CONFIG.OCEAN_FLOOR_START_DEPTH)
      );
      oceanFloor.style.opacity = floorOpacity;
    } else {
      oceanFloor.style.opacity = 0;
    }
  }

  // --- NOVO SISTEMA DE ANIMAÇÃO DOS ANIMAIS ---
  function animateAnimals() {
    animals.forEach((animal) => {
      if (!animal.isActive) {
        return; // Não anima se não estiver ativo
      }

      const gallery = animal.figure.parentElement;
      if (!gallery) return;

      const galleryWidth = gallery.offsetWidth;
      const galleryHeight = gallery.offsetHeight;
      const imgWidth = animal.figure.offsetWidth || animal.scale * 100; // Estimativa se não renderizado
      const imgHeight = animal.figure.offsetHeight || animal.scale * 100;

      // Simula Perlin Noise para um movimento mais orgânico
      animal.noiseOffsetX += animal.noiseSpeed;
      animal.noiseOffsetY += animal.noiseSpeed;

      const targetXDirection =
        pseudoPerlinNoise(animal.noiseOffsetX, noiseSeedX) * 2 - 1; // -1 a 1
      const targetYDirection =
        pseudoPerlinNoise(animal.noiseOffsetY, noiseSeedY) * 2 - 1; // -1 a 1

      // Interpolação suave para a velocidade
      animal.vx = animal.vx * 0.95 + targetXDirection * animal.wanderStrength;
      animal.vy = animal.vy * 0.95 + targetYDirection * animal.wanderStrength;

      // Limita a velocidade
      const currentSpeed = Math.sqrt(
        animal.vx * animal.vx + animal.vy * animal.vy
      );
      if (currentSpeed > animal.maxSpeed) {
        animal.vx = (animal.vx / currentSpeed) * animal.maxSpeed;
        animal.vy = (animal.vy / currentSpeed) * animal.maxSpeed;
      }

      // Aplica a velocidade base
      animal.x += animal.vx * animal.speed;
      animal.y += animal.vy * animal.speed;

      // Mantém os animais dentro dos limites da galeria
      if (animal.x < 0) {
        animal.x = 0;
        animal.vx *= -1; // Inverte a direção X
      } else if (animal.x + imgWidth > galleryWidth) {
        animal.x = galleryWidth - imgWidth;
        animal.vx *= -1; // Inverte a direção X
      }

      if (animal.y < 0) {
        animal.y = 0;
        animal.vy *= -1; // Inverte a direção Y
      } else if (animal.y + imgHeight > galleryHeight) {
        animal.y = galleryHeight - imgHeight;
        animal.vy *= -1; // Inverte a direção Y
      }

      // Vira a imagem na direção do movimento
      if (animal.vx < 0) {
        animal.flip = -1;
      } else if (animal.vx > 0) {
        animal.flip = 1;
      }

      animal.figure.style.transform = `translate(${animal.x}px, ${animal.y}px) scale(${animal.scale}) scaleX(${animal.flip})`;
    });

    requestAnimationFrame(animateAnimals); // Continua o loop
  }

  function setupParticles() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particles = [];
    const particleCount = (particleCanvas.width * particleCanvas.height) / 8000;

    for (let i = 0; i < particleCount; i++) {
      const isBioluminescent = Math.random() < 0.05; // 5% de chance de brilhar
      const particle = {
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        z: Math.random() * 0.7 + 0.3, // 'z' continua controlando o paralaxe do scroll
        radius: isBioluminescent
          ? Math.random() * 1.5 + 0.5
          : Math.random() * 1.2,
        opacity: isBioluminescent
          ? Math.random() * 0.6 + 0.4
          : Math.random() * 0.5 + 0.3,
        isBioluminescent: isBioluminescent,

        // --- NOVAS PROPRIEDADES PARA O MOVIMENTO ---
        // Apenas para as partículas que brilham
        vx: isBioluminescent ? (Math.random() - 0.5) * 0.5 : 0, // velocidade horizontal
        vy: isBioluminescent ? (Math.random() - 0.5) * 0.5 : 0, // velocidade vertical
        wanderAngle: isBioluminescent ? Math.random() * Math.PI * 2 : 0, // Ângulo para mudar de direção
      };
      particles.push(particle);
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    const deltaY = lastScrollY - (window.previousScrollY || 0);

    particles.forEach((p) => {
      // --- LÓGICA PARA CRIATURAS BIOLUMINESCENTES ---
      if (p.isBioluminescent && currentDepth > PARTICLE_START_DEPTH) {
        // 1. MOVIMENTO PRÓPRIO (NADAR)
        // Muda a direção de forma suave e aleatória
        p.wanderAngle += (Math.random() - 0.5) * 0.3;

        // Adiciona uma pequena força na nova direção
        p.vx += Math.cos(p.wanderAngle) * 0.03;
        p.vy += Math.sin(p.wanderAngle) * 0.03;

        // Limita a velocidade para não ficarem muito rápidos
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 0.4;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        // Aplica a velocidade para mover a partícula
        p.x += p.vx;
        p.y += p.vy;

        // 2. EFEITO PARALAXE DO SCROLL (continua funcionando!)
        p.y += deltaY * p.z * 0.1;

        // 3. DESENHO (Formato de cometa com brilho)
        ctx.beginPath();
        ctx.shadowColor = "rgba(100, 255, 200, 0.9)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(100, 255, 200, ${p.opacity})`;
        // Desenha a cabeça
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Desenha a cauda
        const tailX = p.x - p.vx * 4; // A cauda fica na direção oposta ao movimento
        const tailY = p.y - p.vy * 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = p.radius * 0.8;
        ctx.strokeStyle = `rgba(100, 255, 200, ${p.opacity * 0.5})`;
        ctx.stroke();

        // --- LÓGICA PARA PARTÍCULAS NORMAIS (NEVE MARINHA) ---
      } else {
        // Movimento passivo, apenas com o scroll
        p.y += deltaY * p.z * 0.1;

        // Desenho de um círculo simples e sem brilho
        ctx.beginPath();
        ctx.shadowBlur = 0;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

      // Reposiciona as partículas (todas elas) se saírem da tela
      if (p.y > particleCanvas.height) {
        p.y = 0;
        p.x = Math.random() * particleCanvas.width;
      }
      if (p.y < 0) {
        p.y = particleCanvas.height;
        p.x = Math.random() * particleCanvas.width;
      }
      if (p.x > particleCanvas.width) {
        p.x = 0;
        p.y = Math.random() * particleCanvas.height;
      }
      if (p.x < 0) {
        p.x = particleCanvas.width;
        p.y = Math.random() * particleCanvas.height;
      }
    });

    window.previousScrollY = lastScrollY;
    requestAnimationFrame(animateParticles);
  }

  function updateParticleVisibility(depth) {
    const fadeInStart = PARTICLE_START_DEPTH - 200;
    const fadeInEnd = PARTICLE_START_DEPTH + 300;
    if (depth > fadeInStart) {
      const progress = Math.min(
        1,
        (depth - fadeInStart) / (fadeInEnd - fadeInStart)
      );
      particleCanvas.style.opacity = progress;
    } else {
      particleCanvas.style.opacity = 0;
    }
  }
  window.addEventListener("resize", setupParticles);

  function addLogMessage(text, type = "info") {
    const li = document.createElement("li");
    li.className = `log-message ${type}`; // Adiciona classe para estilização opcional
    li.textContent = text;
    logMessagesList.appendChild(li);

    // Auto-scroll para a nova mensagem
    logMessagesList.scrollTop = logMessagesList.scrollHeight;

    // Limita o número de mensagens para não sobrecarregar
    if (logMessagesList.children.length > 50) {
      logMessagesList.removeChild(logMessagesList.children[0]);
    }
  }

  // --- INICIALIZA O SCRIPT QUANDO O DOM ESTIVER PRONTO ---
  init();
});
