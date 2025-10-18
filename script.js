document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E ELEMENTOS ---
  const CONFIG = {
    MAX_DEPTH: 11000,
    PIXELS_PER_METER: 25,
    ANIMAL_ACTIVATION_RANGE: 500,
    OCEAN_FLOOR_START_DEPTH: 7000,
    OCEAN_FLOOR_FULL_OPACITY_DEPTH: 10000,
  };
  const PARTICLE_START_DEPTH = 1000;
  const oceanAbyss = document.getElementById("ocean-abyss");
  const oceanBackground = document.querySelector(".ocean-background");

  const titleSlide = document.querySelector(".title-slide");
  const oceanFloor = document.querySelector(".ocean-floor-svg-wrapper");
  const particleCanvas = document.getElementById("particle-canvas");
  const ctx = particleCanvas.getContext("2d");
  const resetButton = document.getElementById("reset-button");
  const timeTravelButton = document.getElementById("time-travel-button");

  // --- ELEMENTOS DA NOVA INTERFACE DO LOG ---
  const logToggleButton = document.getElementById("log-toggle-button");
  const logPanel = document.getElementById("log-panel");
  const logTabsContainer = document.querySelector(".log-tabs");
  const logMessagesList = document.getElementById("log-messages-list");
  const hullBar = document.getElementById("hull-bar"),
    energyBar = document.getElementById("energy-bar"),
    oxygenBar = document.getElementById("oxygen-bar");
  const hullValue = document.getElementById("hull-value"),
    energyValue = document.getElementById("energy-value"),
    oxygenValue = document.getElementById("oxygen-value");
  const faunaLogList = document.querySelector(".fauna-log-list"),
    faunaEmptyState = document.querySelector(".log-empty-state");
  const zoneInfoTitle = document.getElementById("zone-info-title"),
    zoneInfoList = document.getElementById("zone-info-list");

  const cornerDepthHud = document.getElementById("corner-depth-hud");
  const cornerDepthValue = document.getElementById("corner-depth-value");
  const cornerPressureValue = document.getElementById("corner-pressure-value"); // ADICIONE ESTA
  const cornerTempValue = document.getElementById("corner-temp-value");

  const ZONES = [
    {
      id: "zone-epipelagic",
      name: "Epipelágica",
      startDepth: 0,
      color: [0, 119, 190],
      logged: false,
      curiosidades: [
        "Também conhecida como 'Zona da Luz Solar', pois é a única camada que recebe luz suficiente para a fotossíntese.",
        "Abriga a grande maioria da vida marinha conhecida.",
        "A temperatura pode variar muito nesta zona.",
      ],
    },
    {
      id: "zone-mesopelagic",
      name: "Mesopelágica",
      startDepth: 200,
      color: [0, 66, 104],
      logged: false,
      curiosidades: [
        "Conhecida como 'Zona do Crepúsculo', a luz solar aqui é extremamente fraca.",
        "Muitos animais desta zona são bioluminescentes.",
        "Organismos realizam a 'migração vertical diária' para se alimentar.",
      ],
    },
    {
      id: "zone-bathypelagic",
      name: "Batipelágica",
      startDepth: 1000,
      color: [2, 25, 40],
      logged: false,
      curiosidades: [
        "Conhecida como 'Zona da Meia-Noite', não há luz solar.",
        "A pressão da água aqui é esmagadora, mais de 100 vezes a da superfície.",
        "Animais aqui desenvolveram corpos moles e metabolismo lento para sobreviver.",
      ],
    },
    {
      id: "zone-abyssopelagic",
      name: "Abissopelágica",
      startDepth: 4000,
      color: [1, 8, 15],
      logged: false,
      curiosidades: [
        "O nome vem do grego e significa 'sem fundo'.",
        "As temperaturas são próximas do congelamento.",
        "A comida é escassa, consistindo principalmente de 'neve marinha' que cai das camadas superiores.",
      ],
    },
    {
      id: "zone-hadopelagic",
      name: "Hadopelágica",
      startDepth: 6000,
      color: [0, 2, 5],
      logged: false,
      curiosidades: [
        "Localizada nas fossas oceânicas mais profundas do mundo.",
        "A pressão pode exceder 1.000 vezes a da superfície.",
        "A vida aqui é surpreendente, incluindo espécies como o peixe-caracol e anfípodes gigantes.",
      ],
    },
    {
      id: "final-depth",
      name: "Fim",
      startDepth: CONFIG.MAX_DEPTH,
      color: [0, 0, 0],
      logged: false,
    },
  ];

  let vehicleStats = { hull: 100, energy: 100, oxygen: 100 };
  let animals = [],
    currentDepth = 0,
    lastScrollY = 0,
    isTicking = false,
    particles = [];

  let noiseSeedX = Math.random() * 1000;
  let noiseSeedY = Math.random() * 1000;

  function calculatePressure(depth) {
    // 1 ATM na superfície + 1 ATM a cada 10 metros
    const pressure = 1 + depth / 10;
    return pressure;
  }

  function calculateTemperature(depth) {
    const surfaceTemp = 20;
    const deepTemp = 4;

    if (depth <= 200) {
      // Epipelágica
      return surfaceTemp - (depth / 200) * (surfaceTemp - 19);
    } else if (depth <= 1000) {
      // Mesopelágica (Termoclina)
      const progress = (depth - 200) / 800;
      return 19 - 15 * progress;
    } else {
      // Águas profundas
      const progress = Math.min(1, (depth - 1000) / 9000);
      return deepTemp - 2 * progress;
    }
  }

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
          <p class="image-credit modal-main-credit"></p> <p class="modal-description"></p>
        </div>
        <div class="tab-content" id="tab-ficha">
          <ul class="ficha-tecnica-list"></ul>
          <div class="info-module map-module"> <h4>Mapa de Distribuição</h4> <img src="" alt=""> <p class="image-credit map-credit"></p> </div> <div class="info-module size-module"> <h4>Comparativo de Tamanho</h4> <img src="" alt=""> <p class="image-credit size-credit"></p> <p></p> </div> </div>
        <div class="tab-content" id="tab-galeria">
          <div class="gallery-grid"></div>
          <div class="expanded-media-viewer">
            <span class="close-expanded-media">&times;</span>
            <div class="expanded-media-content"></div>
            <p class="expanded-media-caption"></p>
            <p class="image-credit expanded-media-credit"></p> </div>
        </div>
        <div class="tab-content" id="tab-curiosidades"> <ul class="curiosidades-list"></ul> </div>
        <div class="tab-content" id="tab-relacionados"> <div class="related-species-grid"></div> </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // --- MODAL ---
  const modalCloseBtn = modal.querySelector(".modal-close");
  const modalTitle = modal.querySelector(".modal-title");
  const modalScientific = modal.querySelector(".modal-scientific-name");
  const tabsContainer = modal.querySelector(".modal-tabs");
  const expandedMediaViewer = modal.querySelector(".expanded-media-viewer");
  const closeExpandedMediaBtn = modal.querySelector(".close-expanded-media");
  const expandedMediaContent = modal.querySelector(".expanded-media-content");
  const relatedGrid = modal.querySelector(".related-species-grid");

  // --- FUNÇÕES DE CONTROLE MODAL ---
  function openModal() {
    document.body.style.overflow = "hidden";
    modal.classList.add("active");
  }

  function closeModal() {
    document.body.style.overflow = "auto";
    modal.classList.remove("active");
  }

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
    // Limpeza inicial
    modal.querySelector(".ficha-tecnica-list").innerHTML = "";
    modal.querySelector(".gallery-grid").innerHTML = "";
    modal.querySelector(".curiosidades-list").innerHTML = "";
    relatedGrid.innerHTML = "";

    modalTitle.textContent = animalData.name;
    modalScientific.textContent = animalData.scientificName;
    modal.querySelector(".modal-main-image").src = animalData.img;

    // Crédito da imagem principal
    const mainCredit = modal.querySelector(".modal-main-credit");
    mainCredit.textContent = animalData.fonte
      ? `Fonte: ${animalData.fonte}`
      : "";

    modal.querySelector(".modal-description").textContent =
      animalData.description;

    // Ficha Técnica
    const fichaList = modal.querySelector(".ficha-tecnica-list");
    for (const [key, value] of Object.entries(animalData.fichaTecnica)) {
      const li = document.createElement("li");
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      li.innerHTML = `<strong>${label}:</strong> <span>${value}</span>`;
      fichaList.appendChild(li);
    }

    // Módulos de Informação (Mapa e Tamanho) com créditos
    const mapModule = modal.querySelector(".map-module");
    if (animalData.mapaDistribuicao && animalData.mapaDistribuicao.img) {
      mapModule.style.display = "block";
      mapModule.querySelector("img").src = animalData.mapaDistribuicao.img;
      mapModule.querySelector("img").alt =
        animalData.mapaDistribuicao.alt || "Mapa de Distribuição";
      mapModule.querySelector(".map-credit").textContent = animalData
        .mapaDistribuicao.fonte
        ? `Fonte: ${animalData.mapaDistribuicao.fonte}`
        : "";
    } else {
      mapModule.style.display = "none";
    }

    const sizeModule = modal.querySelector(".size-module");
    if (animalData.comparativoTamanho && animalData.comparativoTamanho.img) {
      sizeModule.style.display = "block";
      sizeModule.querySelector("img").src = animalData.comparativoTamanho.img;
      sizeModule.querySelector("img").alt =
        animalData.comparativoTamanho.alt || "Comparativo de Tamanho";
      sizeModule.querySelector(".size-credit").textContent = animalData
        .comparativoTamanho.fonte
        ? `Fonte: ${animalData.comparativoTamanho.fonte}`
        : "";
      sizeModule.querySelector("p:last-of-type").textContent =
        animalData.comparativoTamanho.descricao || "";
    } else {
      sizeModule.style.display = "none";
    }

    // Galeria (ÁREA CORRIGIDA)
    const galleryGrid = modal.querySelector(".gallery-grid");
    animalData.galeria.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "gallery-item-wrapper";
      let mediaElement;

      if (item.type === "image") {
        mediaElement = document.createElement("img");
        mediaElement.src = item.src;
      } else if (item.type === "video") {
        mediaElement = document.createElement("video");
        mediaElement.src = item.src;
        Object.assign(mediaElement, {
          muted: true,
          loop: true,
          playsInline: true,
          preload: "metadata",
        });
      } else if (item.type === "youtube") {
        // <- NOVA LÓGICA AQUI
        // Para a galeria, criamos uma imagem (thumbnail) que o YouTube nos fornece
        mediaElement = document.createElement("img");
        // Usamos o ID do vídeo (item.src) para buscar a thumbnail padrão
        mediaElement.src = `https://img.youtube.com/vi/${item.src}/mqdefault.jpg`;
        // Adicionamos uma classe para o CSS saber que é um vídeo do YouTube
        wrapper.classList.add("youtube-thumb");
      }

      if (mediaElement) {
        mediaElement.alt = item.alt;
        wrapper.appendChild(mediaElement);
        galleryGrid.appendChild(wrapper);
        wrapper.addEventListener("click", () => showExpandedMedia(item));
      }
    });

    expandedMediaViewer.classList.remove("active");

    // Curiosidades
    const curiosidadesList = modal.querySelector(".curiosidades-list");
    animalData.curiosidades.forEach((fact) => {
      const li = document.createElement("li");
      li.textContent = fact;
      curiosidadesList.appendChild(li);
    });

    // Espécies Relacionadas com 'targetId'
    if (
      animalData.especiesRelacionadas &&
      animalData.especiesRelacionadas.length > 0
    ) {
      animalData.especiesRelacionadas.forEach((species) => {
        const item = document.createElement("div");
        item.className = "related-species-item";
        item.dataset.targetId = species.targetId;
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

  function showExpandedMedia(item) {
    expandedMediaContent.innerHTML = "";
    let mediaElement;

    if (item.type === "image") {
      mediaElement = document.createElement("img");
      mediaElement.src = item.src;
    } else if (item.type === "video") {
      mediaElement = document.createElement("video");
      Object.assign(mediaElement, {
        src: item.src,
        controls: true,
        autoplay: true,
        loop: true,
        playsInline: true,
      });
    } else if (item.type === "youtube") {
      // <- NOVA CONDIÇÃO
      mediaElement = document.createElement("iframe");
      mediaElement.src = `https://www.youtube.com/embed/${item.src}?autoplay=1&rel=0`;
      mediaElement.setAttribute("frameborder", "0");
      mediaElement.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
      mediaElement.setAttribute("allowfullscreen", "");
    }

    if (mediaElement) {
      mediaElement.alt = item.alt;
      expandedMediaContent.appendChild(mediaElement);
    }

    // Exibe legenda e crédito (funciona para todos os tipos)
    expandedMediaViewer.querySelector(".expanded-media-caption").textContent =
      item.legenda || "";
    expandedMediaViewer.querySelector(".expanded-media-credit").textContent =
      item.fonte ? `Fonte: ${item.fonte}` : "";
    expandedMediaViewer.classList.add("active");
  }

  // Evento de fechar a mídia expandida (MODIFICADO)
  closeExpandedMediaBtn.addEventListener("click", () => {
    expandedMediaViewer.classList.remove("active");

    // Pausa o vídeo se for um <video>
    const currentVideo = expandedMediaContent.querySelector("video");
    if (currentVideo) currentVideo.pause();

    // Limpa o src do iframe para parar o vídeo do YouTube
    const currentIframe = expandedMediaContent.querySelector("iframe");
    if (currentIframe) currentIframe.src = "";
  });

  function pseudoPerlinNoise(x, y) {
    const freq = 0.05;
    const amplitude = 0.5;
    return (
      (Math.sin(x * freq) + Math.sin(y * freq) + Math.sin((x + y) * freq)) *
        amplitude +
      Math.random() * 0.1
    );
  }

  // --- INICIALIZAÇÃO E ANIMAÇÃO ---
  function init() {
    const totalHeight =
      CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER + window.innerHeight * 2;
    oceanAbyss.style.height = `${totalHeight}px`;

    ZONES.forEach((zone) => {
      const element = document.getElementById(zone.id);
      if (element) {
        element.style.top = `${zone.startDepth * CONFIG.PIXELS_PER_METER}px`;
      }
    });

    prepareAnimals();
    // Adiciona o listener de rolagem que estava faltando
    window.addEventListener("scroll", onScroll);

    update(); // Chama uma vez para definir o estado inicial
    setupParticles();
    requestAnimationFrame(animateParticles);

    setTimeout(() => {
      addLogMessage("Sistemas online. Iniciando descida.");
    }, 1000);
  }

  // Função para preparar os animais
  // SUBSTITUA A SUA FUNÇÃO 'prepareAnimals' INTEIRA POR ESTA:
  function prepareAnimals() {
    document.querySelectorAll('[data-animal="true"]').forEach((figure) => {
      const specifiedScale = parseFloat(figure.dataset.scale) || 1.0;

      const zIndex = Math.max(1, 100 - Math.floor(specifiedScale * 5));
      figure.style.zIndex = zIndex;

      const gallery = figure.parentElement;
      const zoneDiv = gallery.parentElement;

      const zoneData = ZONES.find((z) => z.id === zoneDiv.id);
      const nextZoneData = ZONES[ZONES.indexOf(zoneData) + 1];

      const zoneHeight = nextZoneData
        ? (nextZoneData.startDepth - zoneData.startDepth) *
          CONFIG.PIXELS_PER_METER
        : window.innerHeight;

      const animalDepthInMeters = parseInt(figure.dataset.depth, 10);
      const depthRatio = nextZoneData
        ? (animalDepthInMeters - zoneData.startDepth) /
          (nextZoneData.startDepth - zoneData.startDepth)
        : 0.5;

      const homeY = depthRatio * zoneHeight;

      const animal = {
        figure,
        img: figure.querySelector("img"),
        depth: animalDepthInMeters,
        homeY: homeY,
        zoneHeight: zoneHeight,
        name: figure.dataset.name || "Espécie desconhecida",
        articlePath: figure.dataset.article || null,
        type: figure.dataset.type || "peixe",
        isActive: false,
        sighted: false,
        x: -9999,
        y: homeY,
        vx: Math.random() - 0.5,
        vy: Math.random() - 0.5,
        scale: specifiedScale,
        flip: 1,
        wanderAngle: Math.random() * Math.PI * 2,
        spookTimer: 0,
        width: 0,
      };

      animal.figure.style.opacity = 0;
      animal.figure.style.transition = "opacity 0.5s ease-in-out";

      figure.addEventListener("click", async () => {
        if (!animal.articlePath) return;
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
    animateAnimals();
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

    // Atualiza a opacidade do título
    titleSlide.style.opacity = Math.max(
      0,
      1 - lastScrollY / (window.innerHeight * 0.75)
    );

    // LÓGICA DO HUD AMBIENTAL DE CANTO
    cornerDepthHud.style.opacity = lastScrollY > 50 ? 1 : 0;
    cornerDepthValue.textContent = currentDepth.toLocaleString("pt-BR");

    const pressure = calculatePressure(currentDepth);
    const temperature = calculateTemperature(currentDepth);
    cornerPressureValue.textContent = pressure.toFixed(0);
    cornerTempValue.textContent = temperature.toFixed(1);

    // Atualiza os status do veículo no painel
    const depthRatio = currentDepth / CONFIG.MAX_DEPTH;
    vehicleStats.hull = Math.max(
      0,
      100 - depthRatio * 15 + Math.sin(Date.now() / 1000) * 0.5
    );
    vehicleStats.energy = Math.max(0, 100 - depthRatio * 40);
    updateLogPanelUI();

    // CORREÇÃO AQUI: Define 'atTheEnd' e usa para os dois botões
    const atTheEnd = currentDepth >= CONFIG.MAX_DEPTH;
    resetButton.classList.toggle("visible", atTheEnd);
    timeTravelButton.classList.toggle("visible", atTheEnd);

    // CHAMA AS FUNÇÕES DE ATUALIZAÇÃO VISUAL
    updateBackgroundColor(currentDepth);
    checkAnimalActivation();
    updateOceanFloor(currentDepth);
    updateParticleVisibility(currentDepth);
  }

  function updateLogPanelUI() {
    hullBar.style.width = `${vehicleStats.hull}%`;
    hullValue.textContent = `${Math.floor(vehicleStats.hull)}%`;
    energyBar.style.width = `${vehicleStats.energy}%`;
    energyValue.textContent = `${Math.floor(vehicleStats.energy)}%`;
    oxygenBar.style.width = `${vehicleStats.oxygen}%`;
    oxygenValue.textContent = `${Math.floor(vehicleStats.oxygen)}%`;

    let currentZone =
      ZONES.find(
        (z) =>
          currentDepth >= z.startDepth &&
          (ZONES[ZONES.indexOf(z) + 1]
            ? currentDepth < ZONES[ZONES.indexOf(z) + 1].startDepth
            : true)
      ) || ZONES[0];
    zoneInfoTitle.textContent = `Zona ${currentZone.name}`;
    if (zoneInfoTitle.dataset.current !== currentZone.id) {
      zoneInfoTitle.dataset.current = currentZone.id;
      zoneInfoList.innerHTML = "";
      currentZone.curiosidades?.forEach((fact) => {
        const li = document.createElement("li");
        li.textContent = fact;
        zoneInfoList.appendChild(li);
      });
    }
  }

  function updateBackgroundColor(depth) {
    let startZone = ZONES[0],
      endZone = ZONES[1];
    for (let i = 0; i < ZONES.length - 1; i++) {
      if (depth >= ZONES[i].startDepth) {
        startZone = ZONES[i];
        endZone = ZONES[i + 1];
      }
    }

    if (startZone && !startZone.logged && startZone.startDepth > 0) {
      addLogMessage(`Entrando na Zona ${startZone.name}.`);
      startZone.logged = true;
    }

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

  function checkAnimalActivation() {
    const range = CONFIG.ANIMAL_ACTIVATION_RANGE;
    animals.forEach((animal) => {
      const viewportCenterDepth =
        currentDepth + window.innerHeight / 2 / CONFIG.PIXELS_PER_METER;
      const isInRange =
        Math.abs(animal.depth - viewportCenterDepth) < range / 2;

      if (isInRange && !animal.isActive) {
        if (animal.img.dataset.src) {
          animal.img.src = animal.img.dataset.src; // Inicia o carregamento

          // ESSA É A PARTE CRÍTICA:
          // Define o que fazer QUANDO a imagem terminar de carregar
          animal.img.onload = () => {
            // Agora que a imagem carregou, medimos a largura real e guardamos
            animal.width = animal.figure.offsetWidth;
          };
          animal.img.removeAttribute("data-src");
        }

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

  // --- Função Animar animais por tipo ---
  function animateAnimals() {
    animals.forEach((animal) => {
      if (!animal.isActive) return;
      if (animal.x === -9999) {
        const gallery = animal.figure.parentElement;
        if (gallery && gallery.offsetWidth > 0) {
          const animalWidth = animal.width || animal.scale * 100;

          const spawnableWidth = gallery.offsetWidth - animalWidth;

          animal.x = Math.random() * Math.max(0, spawnableWidth);
        } else {
          return;
        }
      }

      // Decide qual comportamento aplicar com base no tipo do animal
      switch (animal.type) {
        case "lula":
          applyLulaPhysics(animal);
          break;
        case "agua-viva":
          applyAguaVivaPhysics(animal);
          break;
        case "peixe-pequeno":
          applyPequenoPeixePhysics(animal); // Agora usa a nova física!
          break;

        case "reptil":
          applyReptilPhysics(animal);
          break;
        default:
          applyPeixePhysics(animal);
          break;
      }

      const flipThreshold = 0.1;

      if (animal.vx > flipThreshold) {
        animal.flip = 1;
      } else if (animal.vx < -flipThreshold) {
        animal.flip = -1;
      }

      animal.figure.style.transform = `translate(${animal.x}px, ${animal.y}px) scale(${animal.scale}) scaleX(${animal.flip})`;
    });

    requestAnimationFrame(animateAnimals);
  }

  // COLE ESTA NOVA FUNÇÃO NO SEU SCRIPT.JS

  function applyReptilPhysics(animal) {
    if (animal.spookTimer > 0) animal.spookTimer--;

    const gallery = animal.figure.parentElement;
    if (!gallery || gallery.offsetWidth === 0) return;

    const galleryWidth = gallery.offsetWidth;
    const galleryHeight = animal.zoneHeight;
    const imgWidth = animal.width || animal.scale * 100;

    // Movimento mais lento e deliberado, muda de direção com menos frequência
    animal.wanderAngle += (Math.random() - 0.5) * 0.2;
    const wanderForce = {
      x: Math.cos(animal.wanderAngle) * 0.05, // Força de nado mais suave
      y: Math.sin(animal.wanderAngle) * 0.05,
    };

    // Força para retornar à sua profundidade ideal
    const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.005 };

    const avoidanceForce = { x: 0, y: 0 };
    const margin = 200; // A "zona de perigo" perto da borda

    // Calcula a força baseada na proximidade da borda
    let progress;

    // Borda Esquerda
    if (animal.x < margin) {
      progress = (margin - animal.x) / margin; // 0.0 a 1.0
      avoidanceForce.x = progress * 0.5; // Força aumenta quanto mais perto
    }
    // Borda Direita
    else if (animal.x > galleryWidth - imgWidth - margin) {
      progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
      avoidanceForce.x = -progress * 0.5;
    }

    // Borda Superior
    if (animal.y < margin) {
      progress = (margin - animal.y) / margin;
      avoidanceForce.y = progress * 0.5;
    }
    // Borda Inferior
    else if (animal.y > galleryHeight - imgWidth - margin) {
      progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
      avoidanceForce.y = -progress * 0.5;
    }

    // Aplica as forças na aceleração
    animal.vx += wanderForce.x + homeForce.x + avoidanceForce.x;
    animal.vy += wanderForce.y + homeForce.y + avoidanceForce.y;

    // Atrito maior (simula o "planar" na água) e velocidade máxima menor
    animal.vx *= 0.98;
    animal.vy *= 0.98;
    const maxSpeed = 0.8; // Velocidade máxima mais baixa que a dos peixes

    const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
    if (speed > maxSpeed) {
      animal.vx = (animal.vx / speed) * maxSpeed;
      animal.vy = (animal.vy / speed) * maxSpeed;
    }

    animal.x += animal.vx;
    animal.y += animal.vy;

    // Trava de Segurança para garantir que não saia da tela
    if (galleryWidth > imgWidth) {
      animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
    }
  }

  function applyPequenoPeixePhysics(animal) {
    if (animal.spookTimer > 0) animal.spookTimer--;

    const gallery = animal.figure.parentElement;
    if (!gallery || gallery.offsetWidth === 0) return;

    const galleryWidth = gallery.offsetWidth;
    const galleryHeight = animal.zoneHeight;
    const imgWidth = animal.width || animal.scale * 100;

    // Movimento mais errático e rápido para peixes pequenos
    animal.wanderAngle += (Math.random() - 0.5) * 0.8; // Muda de direção mais rápido
    const wanderForce = {
      x: Math.cos(animal.wanderAngle) * 0.15,
      y: Math.sin(animal.wanderAngle) * 0.15,
    };

    // Força maior para voltar ao centro
    const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.01 };

    // Aceleração e velocidade
    const avoidanceForce = { x: 0, y: 0 };
    const margin = 200; // A "zona de perigo" perto da borda

    // Calcula a força baseada na proximidade da borda
    let progress;

    // Borda Esquerda
    if (animal.x < margin) {
      progress = (margin - animal.x) / margin; // 0.0 a 1.0
      avoidanceForce.x = progress * 0.5; // Força aumenta quanto mais perto
    }
    // Borda Direita
    else if (animal.x > galleryWidth - imgWidth - margin) {
      progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
      avoidanceForce.x = -progress * 0.5;
    }

    // Borda Superior
    if (animal.y < margin) {
      progress = (margin - animal.y) / margin;
      avoidanceForce.y = progress * 0.5;
    }
    // Borda Inferior
    else if (animal.y > galleryHeight - imgWidth - margin) {
      progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
      avoidanceForce.y = -progress * 0.5;
    }

    animal.vx += wanderForce.x + homeForce.x;
    animal.vy += wanderForce.y + homeForce.y;

    animal.vx *= 0.93; // Atrito um pouco maior para movimentos mais "secos"
    animal.vy *= 0.93;

    const maxSpeed = 1.6; // Um pouco mais rápido em seus "surtos"
    const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
    if (speed > maxSpeed) {
      animal.vx = (animal.vx / speed) * maxSpeed;
      animal.vy = (animal.vy / speed) * maxSpeed;
    }

    animal.x += animal.vx;
    animal.y += animal.vy;

    // --- Trava de Segurança (Clamp) ---
    // Impede fisicamente que o animal saia dos limites da galeria
    if (galleryWidth > imgWidth) {
      animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
    }
  }
  function applyPeixePhysics(animal) {
    if (animal.spookTimer > 0) animal.spookTimer--;

    const gallery = animal.figure.parentElement;
    if (!gallery || gallery.offsetWidth === 0) return;

    const galleryWidth = gallery.offsetWidth;
    const galleryHeight = animal.zoneHeight;
    const imgWidth = animal.width || animal.scale * 100;

    animal.wanderAngle += (Math.random() - 0.5) * 0.4;
    const wanderForce = {
      x: Math.cos(animal.wanderAngle) * 0.1,
      y: Math.sin(animal.wanderAngle) * 0.1,
    };
    const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.005 };
    const avoidanceForce = { x: 0, y: 0 };
    const margin = 200; // A "zona de perigo" perto da borda

    // Calcula a força baseada na proximidade da borda
    let progress;

    // Borda Esquerda
    if (animal.x < margin) {
      progress = (margin - animal.x) / margin; // 0.0 a 1.0
      avoidanceForce.x = progress * 0.5; // Força aumenta quanto mais perto
    }
    // Borda Direita
    else if (animal.x > galleryWidth - imgWidth - margin) {
      progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
      avoidanceForce.x = -progress * 0.5;
    }

    // Borda Superior
    if (animal.y < margin) {
      progress = (margin - animal.y) / margin;
      avoidanceForce.y = progress * 0.5;
    }
    // Borda Inferior
    else if (animal.y > galleryHeight - imgWidth - margin) {
      progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
      avoidanceForce.y = -progress * 0.5;
    }

    const accelerationX = wanderForce.x + homeForce.x + avoidanceForce.x * 1.0;
    const accelerationY = wanderForce.y + homeForce.y + avoidanceForce.y * 1.0;
    animal.vx += accelerationX;
    animal.vy += accelerationY;

    animal.vx *= 0.96;
    animal.vy *= 0.96;
    const maxSpeed = 1.2;
    const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
    if (speed > maxSpeed) {
      animal.vx = (animal.vx / speed) * maxSpeed;
      animal.vy = (animal.vy / speed) * maxSpeed;
    }

    animal.x += animal.vx;
    animal.y += animal.vy;

    // --- Trava de Segurança (Clamp) --- NOVO BLOCO ADICIONADO AQUI
    // Impede fisicamente que o animal saia dos limites da galeria
    if (galleryWidth > imgWidth) {
      animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
    }
  }

  // 3. NOVA FÍSICA DAS LULAS
  function applyLulaPhysics(animal) {
    if (animal.spookTimer > 0) animal.spookTimer--;

    animal.propulsionTimer = (animal.propulsionTimer || 0) - 1;
    if (animal.propulsionTimer <= 0) {
      animal.propulsionTimer = 60 + Math.random() * 120;
      const angle = (Math.random() - 0.5) * 0.8;
      const thrust = 4 + Math.random() * 4;
      animal.vx += animal.flip * Math.cos(angle) * thrust;
      animal.vy += Math.sin(angle) * thrust * 0.5;
    }

    // --- LÓGICA PARA EVITAR PAREDES (ADICIONADA AQUI) ---
    const gallery = animal.figure.parentElement;
    const avoidanceForce = { x: 0, y: 0 }; // Força de desvio começa em zero

    if (gallery) {
      const galleryWidth = gallery.offsetWidth;
      const imgWidth = animal.width || animal.scale * 100;
      const margin = 200; // Usa a mesma margem segura dos peixes

      if (animal.x < margin) avoidanceForce.x = 1;
      if (animal.x > galleryWidth - imgWidth - margin) avoidanceForce.x = -1;
      if (animal.y < margin) avoidanceForce.y = 1;
      if (animal.y > gallery.offsetHeight - imgWidth - margin)
        avoidanceForce.y = -1;
    }

    // Aplica a força de desvio à velocidade
    animal.vx += avoidanceForce.x * 1.0;
    animal.vy += avoidanceForce.y * 1.0;
    // --- FIM DA LÓGICA DE EVITAR PAREDES ---

    // Atrito forte e retorno suave à profundidade
    animal.vx *= 0.94;
    animal.vy *= 0.94;
    animal.vy += (animal.homeY - animal.y) * 0.002;

    // Atualiza a posição
    animal.x += animal.vx;
    animal.y += animal.vy;
  }

  // 4. FÍSICA DAS ÁGUAS-VIVAS (PULSAÇÃO VERTICAL)
  function applyAguaVivaPhysics(animal) {
    if (animal.spookTimer > 0) animal.spookTimer--;
    animal.pulseTimer = (animal.pulseTimer || Math.random() * 100) + 0.05;

    const pulseForce = Math.sin(animal.pulseTimer) * 0.1;
    animal.vy += pulseForce;

    animal.vx += (Math.random() - 0.5) * 0.01;

    animal.vx *= 0.9;
    animal.vy *= 0.9;
    animal.vy += (animal.homeY - animal.y) * 0.005;

    animal.x += animal.vx;
    animal.y += animal.vy;
  }

  function setupParticles() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particles = [];
    const particleCount = (particleCanvas.width * particleCanvas.height) / 8000;

    for (let i = 0; i < particleCount; i++) {
      const isBioluminescent = Math.random() < 0.1; // Aumentei a chance para 10%
      const particle = {
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        z: Math.random() * 0.7 + 0.3,
        radius: isBioluminescent
          ? Math.random() * 1.5 + 0.5
          : Math.random() * 1.2,
        opacity: isBioluminescent
          ? Math.random() * 0.6 + 0.4
          : Math.random() * 0.5 + 0.3,
        isBioluminescent: isBioluminescent,

        // --- NOVAS PROPRIEDADES DE MOVIMENTO E TIPO ---
        vx: 0,
        vy: 0,
        wanderAngle: 0,
        bioType: "none", // Novo: tipo de bioluminescência
      };

      if (isBioluminescent) {
        // Define velocidades iniciais apenas para as criaturas
        particle.vx = (Math.random() - 0.5) * 0.5;
        particle.vy = (Math.random() - 0.5) * 0.5;
        particle.wanderAngle = Math.random() * Math.PI * 2;

        // Escolhe um tipo aleatório de bioluminescência
        const bioRoll = Math.random();
        if (bioRoll < 0.6) {
          particle.bioType = "nadador_verde"; // 60% de chance: o que já tínhamos
        } else if (bioRoll < 0.9) {
          particle.bioType = "pulsante_azul"; // 30% de chance: um novo tipo que pulsa
        } else {
          particle.bioType = "estatico_amarelo"; // 10% de chance: um tipo que quase não se move
        }
      }

      particles.push(particle);
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    const deltaY = lastScrollY - (window.previousScrollY || 0);

    particles.forEach((p) => {
      // --- LÓGICA PARA CRIATURAS BIOLUMINESCENTES ---
      if (p.isBioluminescent && currentDepth > PARTICLE_START_DEPTH) {
        let color = "100, 255, 200"; // Cor padrão (verde)

        // Aplica comportamento com base no tipo
        switch (p.bioType) {
          case "nadador_verde":
            // O movimento de nadar que já tínhamos
            p.wanderAngle += (Math.random() - 0.5) * 0.3;
            p.vx += Math.cos(p.wanderAngle) * 0.03;
            p.vy += Math.sin(p.wanderAngle) * 0.03;
            break;

          case "pulsante_azul":
            color = "100, 180, 255"; // Cor azul
            // Movimento de pulsação suave e lento
            p.opacity = 0.5 + Math.sin(p.wanderAngle) * 0.3;
            p.wanderAngle += 0.02; // Controla a velocidade da pulsação
            p.vx *= 0.9; // Movimento horizontal quase nulo
            p.vy *= 0.9;
            break;

          case "estatico_amarelo":
            color = "255, 220, 100"; // Cor amarela/dourada
            // Quase não se move, apenas flutua
            p.vx *= 0.8;
            p.vy *= 0.8;
            break;
        }

        // Limita a velocidade para os nadadores
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 0.4;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        // Aplica a velocidade e o paralaxe
        p.x += p.vx;
        p.y += p.vy;
        p.y += deltaY * p.z * 0.1;

        // Desenha a partícula com a cor e brilho corretos
        ctx.beginPath();
        ctx.shadowColor = `rgba(${color}, 0.9)`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // A cauda apenas para os nadadores
        if (p.bioType === "nadador_verde") {
          const tailX = p.x - p.vx * 4;
          const tailY = p.y - p.vy * 4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(tailX, tailY);
          ctx.lineWidth = p.radius * 0.8;
          ctx.strokeStyle = `rgba(${color}, ${p.opacity * 0.5})`;
          ctx.stroke();
        }

        // --- LÓGICA PARA PARTÍCULAS NORMAIS (NEVE MARINHA) ---
      } else {
        p.y += deltaY * p.z * 0.1;

        ctx.beginPath();
        ctx.shadowBlur = 0;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

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
    li.className = `log-message ${type}`;
    if (type === "sighting") {
      const animalName = text.replace("AVISTAMENTO: ", "").replace(".", "");
      li.innerHTML = `AVISTAMENTO: <a data-animal-id="${animalName}">${animalName}</a>.`;
      if (!faunaLogList.querySelector(`[data-animal-id="${animalName}"]`)) {
        const faunaLi = document.createElement("li");
        faunaLi.textContent = animalName;
        faunaLi.dataset.animalId = animalName;
        faunaLogList.appendChild(faunaLi);
        faunaEmptyState.style.display = "none";
      }
    } else {
      li.textContent = text;
    }
    logMessagesList.appendChild(li);
    logMessagesList.scrollTop = logMessagesList.scrollHeight;
  }

  logToggleButton.addEventListener("click", () =>
    logPanel.classList.toggle("visible")
  );
  logTabsContainer.addEventListener("click", (e) => {
    if (e.target.matches(".log-tab-button")) {
      logTabsContainer.querySelector(".active").classList.remove("active");
      e.target.classList.add("active");
      document
        .querySelector(".log-tab-content.active")
        .classList.remove("active");
      document
        .getElementById(`log-content-${e.target.dataset.tab}`)
        .classList.add("active");
    }
  });
  logPanel.addEventListener("click", (e) => {
    if (e.target.dataset.animalId) {
      const animal = animals.find((a) => a.name === e.target.dataset.animalId);
      if (animal) {
        closeModal();
        animal.figure.click();
      }
    }
  });
  resetButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    addLogMessage("Retornando à superfície...", "system");
    setTimeout(() => {
      logMessagesList.innerHTML = "";
      faunaLogList.innerHTML = "";
      faunaEmptyState.style.display = "block";
      addLogMessage("Sistemas online. Iniciando descida.");
    }, 2000);
    ZONES.forEach((zone) => (zone.logged = false));
  });

  timeTravelButton.addEventListener("click", () => {
    // Adiciona uma classe ao body para o efeito de distorção de saída
    document.body.classList.add("time-travel-start");

    // Espera a animação de CSS terminar antes de navegar
    setTimeout(() => {
      window.location.href = "./timetravel/timetravel.html";
    }, 1500); // 1.5 segundos
  });
  init();
});
