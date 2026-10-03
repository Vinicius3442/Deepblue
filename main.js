import { CONFIG, ZONES } from "./js/config.js";
import { initModal, openAnimalModal, closeModal } from "./js/modal.js";
import { animateAnimals } from "./js/animal-behavior.js";
import {
  setupParticles,
  animateParticles,
  updateParticleVisibility,
} from "./js/particles.js";
import { initVisuals, updateVisuals } from "./js/visuals.js";
import { initHUD, updateHUD } from "./js/hud.js";
import { toggleAudio, updateAudioDepth } from "./js/audio.js";

document.addEventListener("DOMContentLoaded", () => {
  const oceanAbyss = document.getElementById("ocean-abyss");
  const oceanBackground = document.querySelector(".ocean-background");
  const titleSlide = document.querySelector(".title-slide");
  const oceanFloor = document.querySelector(".ocean-floor-svg-wrapper");
  const resetButton = document.getElementById("reset-button");

  // Botões de topo e modal do Bestiário
  const bestiaryToggleButton = document.getElementById("bestiary-toggle-button");
  const bestiaryPanel = document.getElementById("bestiary-panel");
  const bestiaryCloseButton = document.getElementById("bestiary-close-btn");
  const bestiaryCardsGrid = document.getElementById("bestiary-cards-grid");
  const bestiaryCountInfo = document.getElementById("bestiary-count-info");

  // Modo Foto com Print & Download PNG
  const photoModeBtn = document.getElementById("photo-mode-btn");
  const exitPhotoModeBtn = document.getElementById("exit-photo-mode-btn");

  const photoPreviewModal = document.getElementById("photo-preview-modal");
  const photoPreviewImg = document.getElementById("photo-preview-img");
  const photoPreviewClose = document.getElementById("photo-preview-close");
  const closePreviewBtn = document.getElementById("close-preview-btn");
  const downloadPhotoBtn = document.getElementById("download-photo-btn");
  const photoDepthTag = document.getElementById("photo-preview-depth-tag");

  // Alerta de Descoberta RPG
  const discoveryToast = document.getElementById("discovery-toast");
  const toastCloseBtn = document.getElementById("toast-close-btn");
  const toastAnimalImg = document.getElementById("toast-animal-img");
  const toastAnimalName = document.getElementById("toast-animal-name");
  const toastAnimalDepth = document.getElementById("toast-animal-depth");

  // Mini-Mapa Vertical
  const minimapProgressFill = document.getElementById("minimap-progress-fill");

  let animals = [];
  let currentDepth = 0,
    lastScrollY = 0,
    isTicking = false;

  // Estado do Filtro do Bestiário
  let currentZoneFilter = "all";
  let currentStatusFilter = "all";
  let currentCategoryFilter = "all";
  let currentSearchQuery = "";

  function getAnimalCategory(animal) {
    const path = (animal.articlePath || "").toLowerCase();
    const name = (animal.name || "").toLowerCase();
    const type = (animal.type || "").toLowerCase();

    if (
      path.includes("elasmobranchii") ||
      name.includes("tubarão") ||
      name.includes("arraia") ||
      name.includes("dogfish") ||
      name.includes("cação") ||
      name.includes("peregrino")
    ) {
      return "elasmobranchii";
    }

    if (
      path.includes("molluscae") ||
      type.includes("lula") ||
      name.includes("polvo") ||
      name.includes("lula") ||
      name.includes("sépia") ||
      name.includes("choco")
    ) {
      return "molluscae";
    }

    if (
      path.includes("cnidaria") ||
      type.includes("agua-viva") ||
      name.includes("viva") ||
      name.includes("medusa") ||
      name.includes("caravela") ||
      name.includes("anêmona") ||
      name.includes("coral")
    ) {
      return "cnidaria";
    }

    return "peixe";
  }

  function calculatePressure(depth) {
    return 1 + depth / 10;
  }

  function calculateTemperature(depth) {
    const surfaceTemp = 20;
    const deepTemp = 4;
    if (depth <= 200) {
      return surfaceTemp - (depth / 200) * (surfaceTemp - 19);
    } else if (depth <= 1000) {
      const progress = (depth - 200) / 800;
      return 19 - 15 * progress;
    } else {
      const progress = Math.min(1, (depth - 1000) / 9000);
      return deepTemp - 2 * progress;
    }
  }

  const BESTIARY_STORAGE_KEY = "deepBlueBestiary";

  function getDiscoveredAnimals() {
    const data = localStorage.getItem(BESTIARY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // --- ALERTA RPG DE DESCOBERTA (TOAST) COM SWIPE NO MOBILE E FECHAMENTO RÁPIDO NO PC ---
  let toastTimeout = null;
  let isSwipingToast = false;
  let toastStartX = 0;
  let toastDeltaX = 0;

  function dismissDiscoveryToast(direction = 0) {
    if (!discoveryToast) return;
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    discoveryToast.classList.remove("swiping");

    if (direction < 0) {
      discoveryToast.classList.add("dismissed-left");
    } else if (direction > 0) {
      discoveryToast.classList.add("dismissed-right");
    } else {
      discoveryToast.classList.remove("visible");
      discoveryToast.classList.add("hidden");
    }

    setTimeout(() => {
      discoveryToast.classList.remove("visible", "dismissed-left", "dismissed-right");
      discoveryToast.classList.add("hidden");
      discoveryToast.style.transform = "";
      discoveryToast.style.opacity = "";
    }, 320);
  }

  function showDiscoveryToast(animal) {
    if (!discoveryToast || !animal) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    discoveryToast.style.transform = "";
    discoveryToast.style.opacity = "";
    discoveryToast.classList.remove("swiping", "dismissed-left", "dismissed-right", "hidden");

    toastAnimalImg.src = animal.imgPath;
    toastAnimalName.textContent = animal.name;
    toastAnimalDepth.textContent = `Adicionado ao Bestiário • ${animal.depth}m`;

    discoveryToast.classList.add("visible");

    toastTimeout = setTimeout(() => {
      dismissDiscoveryToast(0);
    }, 4500);
  }

  // Fechamento no PC via botão 'X'
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissDiscoveryToast(0);
    });
  }

  // Suporte a Swipe para o lado no Mobile (Touch Gestures)
  if (discoveryToast) {
    discoveryToast.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        if (toastTimeout) clearTimeout(toastTimeout);
        isSwipingToast = true;
        toastStartX = e.touches[0].clientX;
        toastDeltaX = 0;
        discoveryToast.classList.add("swiping");
      },
      { passive: true }
    );

    discoveryToast.addEventListener(
      "touchmove",
      (e) => {
        if (!isSwipingToast || e.touches.length !== 1) return;
        const currentX = e.touches[0].clientX;
        toastDeltaX = currentX - toastStartX;

        const rotation = (toastDeltaX / 300) * 8;
        const opacity = Math.max(0.2, 1 - Math.abs(toastDeltaX) / 300);
        discoveryToast.style.transform = `translate(calc(-50% + ${toastDeltaX}px), 0) rotate(${rotation}deg)`;
        discoveryToast.style.opacity = opacity;
      },
      { passive: true }
    );

    const finishSwipe = () => {
      if (!isSwipingToast) return;
      isSwipingToast = false;
      discoveryToast.classList.remove("swiping");

      const threshold = 65; // limiar de 65px para descartar pro lado
      if (Math.abs(toastDeltaX) > threshold) {
        dismissDiscoveryToast(toastDeltaX > 0 ? 1 : -1);
      } else {
        // Snap-back elástico suave se não atingir o limiar
        discoveryToast.style.transition =
          "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.25s ease";
        discoveryToast.style.transform = "translate(-50%, 0)";
        discoveryToast.style.opacity = "1";

        setTimeout(() => {
          discoveryToast.style.transition = "";
          if (toastTimeout) clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => {
            dismissDiscoveryToast(0);
          }, 3500);
        }, 260);
      }
    };

    discoveryToast.addEventListener("touchend", finishSwipe);
    discoveryToast.addEventListener("touchcancel", finishSwipe);
  }

  // Descobrir um novo animal e atualizar a UI
  function discoverAnimal(animalName) {
    const discovered = getDiscoveredAnimals();

    if (!discovered.includes(animalName)) {
      discovered.push(animalName);
      localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(discovered));

      const animal = animals.find((a) => a.name === animalName);
      if (animal) {
        showDiscoveryToast(animal);
      }

      renderBestiaryGrid();
    }
  }



  // --- RENDERING DO BESTIÁRIO REDESENHADO ---
  function renderBestiaryGrid() {
    if (!bestiaryCardsGrid) return;
    bestiaryCardsGrid.innerHTML = "";

    const discovered = getDiscoveredAnimals();
    const sortedAnimals = [...animals].sort((a, b) => a.depth - b.depth);

    const filtered = sortedAnimals.filter((animal) => {
      // Filtro de Zona
      if (currentZoneFilter !== "all") {
        const figure = animal.figure;
        const gallery = figure ? figure.parentElement : null;
        const zoneDiv = gallery ? gallery.parentElement : null;
        if (zoneDiv && zoneDiv.id !== currentZoneFilter) {
          return false;
        }
      }

      // Filtro de Categoria
      if (currentCategoryFilter !== "all") {
        const cat = getAnimalCategory(animal);
        if (cat !== currentCategoryFilter) return false;
      }

      // Filtro de Status
      const isUnlocked = discovered.includes(animal.name);
      if (currentStatusFilter === "unlocked" && !isUnlocked) return false;
      if (currentStatusFilter === "locked" && isUnlocked) return false;

      // Filtro por Texto de Busca
      if (currentSearchQuery.trim() !== "") {
        const query = currentSearchQuery.toLowerCase().trim();
        const animalName = animal.name.toLowerCase();
        if (!animalName.includes(query)) return false;
      }

      return true;
    });

    filtered.forEach((animal) => {
      const isUnlocked = discovered.includes(animal.name);
      const card = document.createElement("li");
      card.className = `bestiary-card ${isUnlocked ? "unlocked" : "locked"}`;

      const imgWrapper = document.createElement("div");
      imgWrapper.className = "card-img-wrapper";
      const img = document.createElement("img");
      img.src = animal.imgPath;
      img.alt = animal.name;
      imgWrapper.appendChild(img);

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = isUnlocked ? animal.name : "???";

      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = isUnlocked
        ? "Registrado"
        : `Visto ~${animal.depth}m`;

      card.appendChild(imgWrapper);
      card.appendChild(title);
      card.appendChild(badge);

      card.addEventListener("click", async () => {
        if (isUnlocked) {
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
        }
      });

      bestiaryCardsGrid.appendChild(card);
    });

    if (bestiaryCountInfo) {
      bestiaryCountInfo.textContent = `${discovered.length} / ${animals.length} Espécies Descobertas`;
    }
  }

  // Listeners de Busca e Filtros do Bestiário
  const searchInput = document.getElementById("bestiary-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value;
      renderBestiaryGrid();
    });
  }

  document.querySelectorAll(".filter-category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-category-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategoryFilter = btn.dataset.categoryFilter;
      renderBestiaryGrid();
    });
  });

  // Listeners dos Filtros do Bestiário
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentZoneFilter = btn.dataset.zoneFilter;
      renderBestiaryGrid();
    });
  });

  document.querySelectorAll(".filter-status-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-status-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentStatusFilter = btn.dataset.statusFilter;
      renderBestiaryGrid();
    });
  });

  // --- MODO FOTO COM CAPTURA PNG E MODAL DE DOWNLOAD ---
  function closePhotoPreview() {
    if (photoPreviewModal) photoPreviewModal.classList.add("hidden");
  }

  if (photoPreviewClose) photoPreviewClose.addEventListener("click", closePhotoPreview);
  if (closePreviewBtn) closePreviewBtn.addEventListener("click", closePhotoPreview);
  if (photoPreviewModal) {
    photoPreviewModal.addEventListener("click", (e) => {
      if (e.target === photoPreviewModal) closePhotoPreview();
    });
  }

  if (photoModeBtn) {
    photoModeBtn.addEventListener("click", async () => {
      const topBar = document.getElementById("top-controls-bar");
      const minimap = document.getElementById("zone-minimap");
      const depthHud = document.getElementById("corner-depth-hud");

      const hiddenElements = [topBar, minimap, depthHud, resetButton, discoveryToast];
      hiddenElements.forEach((el) => {
        if (el) el.style.visibility = "hidden";
      });

      try {
        if (window.html2canvas) {
          const canvas = await window.html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: window.innerWidth,
            height: window.innerHeight,
            x: 0,
            y: window.scrollY,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scale: 1,
          });

          const dataUrl = canvas.toDataURL("image/png");
          if (photoPreviewImg) photoPreviewImg.src = dataUrl;
          if (downloadPhotoBtn) {
            downloadPhotoBtn.href = dataUrl;
            downloadPhotoBtn.download = `deep-blue-${currentDepth}m.png`;
          }
          if (photoDepthTag) {
            photoDepthTag.textContent = `Deep Blue • ${currentDepth}m`;
          }
          if (photoPreviewModal) photoPreviewModal.classList.remove("hidden");
        }
      } catch (err) {
        console.error("Erro ao capturar foto:", err);
      } finally {
        hiddenElements.forEach((el) => {
          if (el) el.style.visibility = "visible";
        });
      }
    });
  }

  // --- MINI-MAPA VERTICAL DE ZONAS ---
  function getMinimapProgress(depth) {
    const waypoints = [
      { depth: 0, percent: 0 },
      { depth: 200, percent: 20 },
      { depth: 1000, percent: 40 },
      { depth: 4000, percent: 60 },
      { depth: 6000, percent: 80 },
      { depth: 11000, percent: 100 },
    ];

    if (depth <= 0) return 0;
    if (depth >= 11000) return 100;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];
      if (depth >= wp1.depth && depth <= wp2.depth) {
        const ratio = (depth - wp1.depth) / (wp2.depth - wp1.depth);
        return wp1.percent + ratio * (wp2.percent - wp1.percent);
      }
    }
    return 100;
  }

  function updateMinimap(depth) {
    if (!minimapProgressFill) return;
    const progress = getMinimapProgress(depth);
    minimapProgressFill.style.height = `${progress}%`;

    let currentZone = ZONES[0];
    for (let i = 0; i < ZONES.length; i++) {
      if (depth >= ZONES[i].startDepth) {
        currentZone = ZONES[i];
      }
    }

    document.querySelectorAll(".minimap-node").forEach((node) => {
      const nodeZoneId = node.dataset.zoneId;
      node.classList.toggle("active", nodeZoneId === currentZone.id);
    });
  }

  document.querySelectorAll(".minimap-node").forEach((node) => {
    node.addEventListener("click", () => {
      const depth = parseInt(node.dataset.depth, 10);
      const targetY = depth * CONFIG.PIXELS_PER_METER;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    });
  });

  async function loadAllFauna() {
    console.log("Iniciando carregamento da fauna...");
    const faunaFiles = [
      { id: "zone-epipelagic", path: "./data/epipelagic-fauna.json" },
      { id: "zone-mesopelagic", path: "./data/mesopelagic-fauna.json" },
      { id: "zone-bathypelagic", path: "./data/bathypelagic-fauna.json" },
      { id: "zone-abyssopelagic", path: "./data/abyssopelagic-fauna.json" },
      { id: "zone-hadopelagic", path: "./data/hadopelagic-fauna.json" },
    ];

    await Promise.all(
      faunaFiles.map(async (file) => {
        const galleryContainer = document.querySelector(
          `#${file.id} .fauna-gallery`
        );
        if (!galleryContainer) {
          console.warn(`Container de galeria não encontrado para: ${file.id}`);
          return;
        }

        try {
          const response = await fetch(file.path);
          if (!response.ok) throw new Error(`Falha ao carregar ${file.path}`);
          const faunaData = await response.json();

          galleryContainer.innerHTML = "";

          faunaData.forEach((animal) => {
            const figure = document.createElement("figure");
            figure.dataset.animal = "true";
            figure.dataset.depth = animal.dataDepth;
            figure.dataset.type = animal.dataType;
            figure.dataset.name = animal.name;
            if (animal.articlePath) {
              figure.dataset.article = animal.articlePath;
            }
            figure.dataset.scale = animal.dataScale;

            if (animal.dataGlowColor) {
              figure.dataset.glowcolor = animal.dataGlowColor;
            }

            const img = document.createElement("img");
            let cleanPath = animal.imgPath;
            if (cleanPath.startsWith("../")) {
              cleanPath = cleanPath.replace(/\.\.\//g, "");
            }
            if (!cleanPath.startsWith("./") && !cleanPath.startsWith("http")) {
              cleanPath = "./" + cleanPath;
            }

            img.dataset.src = cleanPath;
            img.alt = animal.name;
            img.src = "";

            figure.appendChild(img);
            galleryContainer.appendChild(figure);
          });
        } catch (err) {
          console.error(`Erro ao carregar fauna para ${file.id}:`, err);
        }
      })
    );
    console.log("Carregamento da fauna completo.");
  }

  function handleWindowResize() {
    const totalHeight =
      CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER + window.innerHeight * 2;
    oceanAbyss.style.height = `${totalHeight}px`;

    ZONES.forEach((zone, index) => {
      const element = document.getElementById(zone.id);
      if (element) {
        element.style.top = `${zone.startDepth * CONFIG.PIXELS_PER_METER}px`;
        const nextZone = ZONES[index + 1];
        if (nextZone) {
          const zoneHeight =
            (nextZone.startDepth - zone.startDepth) * CONFIG.PIXELS_PER_METER;
          element.style.height = `${zoneHeight}px`;
        }
      }
    });

    setupParticles();
  }

  async function init() {
    handleWindowResize();

    await loadAllFauna();
    prepareAnimals(animals);

    const { relatedGrid } = initModal(animals);
    initHUD();
    renderBestiaryGrid();

    if (bestiaryToggleButton) {
      bestiaryToggleButton.addEventListener("click", () => {
        bestiaryPanel.classList.add("visible");
        renderBestiaryGrid();
      });
    }

    if (bestiaryCloseButton) {
      bestiaryCloseButton.addEventListener("click", () => {
        bestiaryPanel.classList.remove("visible");
      });
    }

    if (bestiaryPanel) {
      bestiaryPanel.addEventListener("click", (e) => {
        if (e.target === bestiaryPanel) {
          bestiaryPanel.classList.remove("visible");
        }
      });
    }

    if (relatedGrid) {
      relatedGrid.addEventListener("click", (e) => {
        const item = e.target.closest(".related-species-item");
        if (item && item.dataset.targetId) {
          const targetName = item.dataset.targetId;
          const animal = animals.find((a) => a.name === targetName);
          if (animal) {
            closeModal();
            animal.figure.click();
          }
        }
      });
    }

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", handleWindowResize);

    setupParticles();

    requestAnimationFrame(() => animateAnimals(animals));
    requestAnimationFrame(animateParticles);

    update();
  }

  function prepareAnimals(animalsArray) {
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
        imgPath: figure.querySelector("img").dataset.src,
        depth: animalDepthInMeters,
        homeY: homeY,
        zoneHeight: zoneHeight,
        name: figure.dataset.name || "Espécie desconhecida",
        articlePath: (() => {
          const rawPath = figure.dataset.article;
          if (!rawPath) return null;

          const articlesIndex = rawPath.indexOf("articles/");

          if (articlesIndex > -1) {
            return "./" + rawPath.substring(articlesIndex);
          }

          return rawPath;
        })(),
        type: figure.dataset.type || "peixe",
        glowColor: figure.dataset.glowcolor || null,
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

      const onAnimalClick = async (e) => {
        if (e) {
          e.stopPropagation();
        }
        document.querySelectorAll('[data-animal="true"]').forEach((f) => f.classList.remove("selected"));
        figure.classList.add("selected");
        discoverAnimal(animal.name);

        if (!animal.articlePath) {
          openAnimalModal({
            name: animal.name,
            scientificName: animal.name,
            img: animal.imgPath,
            description: `Espécie observada a ~${animal.depth}m de profundidade durante a expedição.`,
            fichaTecnica: {
              Profundidade: `${animal.depth}m`,
              Categoria: animal.type
            },
            curiosidades: [
              `Organismo marinho pertencente à fauna de ${animal.depth}m de profundidade.`
            ]
          });
          return;
        }

        try {
          const response = await fetch(animal.articlePath);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          openAnimalModal(data);
        } catch (err) {
          console.warn("Ficha detalhada indisponível ou bloqueada por CORS local, usando ficha de síntese:", err);
          openAnimalModal({
            name: animal.name,
            scientificName: animal.name,
            img: animal.imgPath,
            description: `Espécie observada durante a expedição a ~${animal.depth}m de profundidade.`,
            fichaTecnica: {
              Profundidade: `${animal.depth}m`,
              Categoria: animal.type
            },
            curiosidades: [
              `Organismo marinho registrado a ${animal.depth}m de profundidade.`
            ]
          });
        }
      };

      figure.addEventListener("click", onAnimalClick);
      animalsArray.push(animal);
    });
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
    const oceanScrollY = Math.max(0, lastScrollY - window.innerHeight);
    currentDepth = Math.min(
      Math.floor(oceanScrollY / CONFIG.PIXELS_PER_METER),
      CONFIG.MAX_DEPTH
    );

    titleSlide.style.opacity = Math.max(
      0,
      1 - lastScrollY / (window.innerHeight * 0.75)
    );

    const pressure = calculatePressure(currentDepth);
    const temperature = calculateTemperature(currentDepth);

    updateHUD(currentDepth, pressure, temperature);
    updateMinimap(currentDepth);

    // Botão de Retorno à Superfície fica visível a partir de 150px de rolagem
    if (resetButton) {
      resetButton.classList.toggle("visible", window.scrollY > 150);
    }

    updateBackgroundColor(currentDepth);
    checkAnimalActivation();
    updateOceanFloor(currentDepth);
    updateParticleVisibility(currentDepth, CONFIG.PARTICLE_START_DEPTH);
    updateVisuals(currentDepth);
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

    const brightnessFactor = 1 - (depth / CONFIG.MAX_DEPTH) * 0.8;
    oceanBackground.style.filter = `brightness(${brightnessFactor})`;
  }

  function checkAnimalActivation() {
    const range = CONFIG.ANIMAL_ACTIVATION_RANGE;
    const oceanScrollY = Math.max(0, lastScrollY - window.innerHeight);
    const viewportCenterDepth =
      (oceanScrollY + window.innerHeight / 2) / CONFIG.PIXELS_PER_METER;

    animals.forEach((animal) => {
      const isInRange =
        Math.abs(animal.depth - viewportCenterDepth) < range / 2;

      if (isInRange && !animal.isActive) {
        if (animal.img.dataset.src) {
          animal.img.onload = () => {
            animal.width = animal.img.offsetWidth;

            if (animal.glowColor) {
              animal.img.style.filter = `
              drop-shadow(0 0 15px ${animal.glowColor}) 
              drop-shadow(0 5px 15px var(--color-shadow))
            `;
            }
          };

          animal.img.src = animal.img.dataset.src;
          animal.img.removeAttribute("data-src");
        }

        animal.isActive = true;
        animal.figure.style.opacity = 1;
        animal.figure.style.pointerEvents = "auto";
      } else if (!isInRange && animal.isActive) {
        animal.isActive = false;
        animal.figure.style.opacity = 0;
        animal.figure.style.pointerEvents = "none";
        if (animal.type === "agua-viva-brilhante") {
          animal.img.style.filter = "";
        }
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

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  initVisuals();
  init();
});


