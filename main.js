import { CONFIG, ZONES } from "./js/config.js";
import { initModal, openAnimalModal, closeModal } from "./js/modal.js";
import { animateAnimals } from "./js/animal-behavior.js";
import {
  setupParticles,
  animateParticles,
  updateParticleVisibility,
} from "./js/particles.js";
import { initHUD, updateHUD, addLogMessage } from "./js/hud.js";

document.addEventListener("DOMContentLoaded", () => {
  const oceanAbyss = document.getElementById("ocean-abyss");
  const oceanBackground = document.querySelector(".ocean-background");
  const titleSlide = document.querySelector(".title-slide");
  const oceanFloor = document.querySelector(".ocean-floor-svg-wrapper");
  const resetButton = document.getElementById("reset-button");
  const timeTravelButton = document.getElementById("time-travel-button");
  const bestiaryToggleButton = document.getElementById(
    "bestiary-toggle-button"
  );
  const bestiaryPanel = document.getElementById("bestiary-panel");
  const bestiaryCloseButton = document.getElementById("bestiary-close-btn");
  const bestiaryListElement = bestiaryPanel.querySelector(".bestiary-list");
  const bestiaryPrevBtn = document.getElementById("bestiary-prev-btn");
  const bestiaryNextBtn = document.getElementById("bestiary-next-btn");
  const bestiaryPageCounter = document.getElementById("bestiary-page-counter");

  let bestiaryCurrentPage = 0; // Controla a página atual (índice 0, 2, 4...)
  let totalBestiaryAnimals = 0;

  let animals = [];
  let currentDepth = 0,
    lastScrollY = 0,
    isTicking = false;

  function calculatePressure(depth) {
    const pressure = 1 + depth / 10;
    return pressure;
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

  // NOVA FUNÇÃO: Atualiza a aparência de uma página (usada pela discoverAnimal)
  async function updateBestiaryPage(animalName) {
    const page = bestiaryListElement.querySelector(
      `.bestiary-page[data-animal-name="${animalName}"]`
    );
    if (!page || page.classList.contains("unlocked")) return;

    const animal = animals.find((a) => a.name === animalName);
    if (!animal) return;

    page.classList.remove("locked");
    page.classList.add("unlocked");

    page.querySelector(".bestiary-page-img").style.filter = "none";
    page.querySelector(".bestiary-page-title").textContent = animal.name;

    const descEl = page.querySelector(".bestiary-page-description");

    const stamp = document.createElement("span");
    stamp.className = "bestiary-page-stamp";
    stamp.textContent = "REGISTRADO";
    page.appendChild(stamp);

    try {
      const response = await fetch(animal.articlePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      /* --- MUDANÇA AQUI --- */
      // Se a descrição existir, usa. Se não, fica em branco.
      descEl.textContent = data.description || "";
      /* --- FIM DA MUDANÇA --- */
    } catch (err) {
      /* --- MUDANÇA AQUI --- */
      // Se FALHAR (404, JSON quebrado), também fica em branco.
      descEl.textContent = "";
      // Avisa no console (para você), mas não para o jogador.
      console.warn(
        `Bestiário: Descrição não encontrada para ${animal.name}.`,
        err.message
      );
      /* --- FIM DA MUDANÇA --- */
    }
  }

  // FUNÇÃO ATUALIZADA: Salva no localStorage e chama a atualização da UI
  function discoverAnimal(animalName) {
    const discovered = getDiscoveredAnimals();

    if (!discovered.includes(animalName)) {
      discovered.push(animalName);
      localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(discovered));

      // Atualiza a UI do Bestiário em tempo real
      updateBestiaryPage(animalName); // Chama a nova função

      addLogMessage(
        `Novo registro: ${animalName} adicionado ao Bestiário.`,
        "system"
      );
    }
  }

  // NOVA FUNÇÃO: Controla a visibilidade das páginas
  function showBestiaryPage(index) {
    bestiaryCurrentPage = index;
    const allPages = bestiaryListElement.querySelectorAll(".bestiary-page");

    // Esconde todas
    allPages.forEach((page) => page.classList.remove("visible"));

    // Mostra as duas atuais
    const pageLeft = allPages[index];
    const pageRight = allPages[index + 1];

    if (pageLeft) pageLeft.classList.add("visible");
    if (pageRight) pageRight.classList.add("visible");

    // Atualiza contador e botões
    const totalPages = Math.ceil(totalBestiaryAnimals / 2);
    const currentPageNum = index / 2 + 1;
    bestiaryPageCounter.textContent = `Página ${currentPageNum} / ${totalPages}`;

    bestiaryPrevBtn.disabled = index === 0;
    bestiaryNextBtn.disabled = index + 2 >= totalBestiaryAnimals;
  }

  // FUNÇÃO ATUALIZADA: Constrói todas as páginas na inicialização
  async function populateBestiary(allAnimals) {
    const discovered = getDiscoveredAnimals();
    bestiaryListElement.innerHTML = "";
    totalBestiaryAnimals = allAnimals.length;

    const sortedAnimals = [...allAnimals].sort((a, b) => a.depth - b.depth);

    for (const animal of sortedAnimals) {
      // ... (O código 'for' que cria as páginas continua o mesmo) ...
      const page = document.createElement("li");
      page.className = "bestiary-page";
      page.dataset.animalName = animal.name;
      page.dataset.pageIndex = sortedAnimals.indexOf(animal);

      const isUnlocked = discovered.includes(animal.name);

      let imgHTML = `<img class="bestiary-page-img" src="${animal.imgPath}">`;
      let titleHTML = `<h3 class="bestiary-page-title"></h3>`;
      let descHTML = `<p class="bestiary-page-description"></p>`;
      let stampHTML = ``;

      if (isUnlocked) {
        page.classList.add("unlocked");
        titleHTML = `<h3 class="bestiary-page-title">${animal.name}</h3>`;
        stampHTML = `<span class="bestiary-page-stamp">REGISTRADO</span>`;
      } else {
        page.classList.add("locked");
        titleHTML = `<h3 class="bestiary-page-title">??? (Não Registrado)</h3>`;
        descHTML = `<p class="bestiary-page-description">Visto por volta de ${animal.depth}m</p>`;
      }

      page.innerHTML = imgHTML + titleHTML + descHTML + stampHTML;
      bestiaryListElement.appendChild(page);
    }

    showBestiaryPage(0);

    // Loop que carrega as descrições
    for (const animalName of discovered) {
      const animal = sortedAnimals.find((a) => a.name === animalName);
      if (animal) {
        const page = bestiaryListElement.querySelector(
          `.bestiary-page[data-animal-name="${animalName}"]`
        );
        const descEl = page.querySelector(".bestiary-page-description");

        try {
          const response = await fetch(animal.articlePath);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          /* --- MUDANÇA AQUI --- */
          descEl.textContent = data.description || "";
          /* --- FIM DA MUDANÇA --- */
        } catch (err) {
          /* --- MUDANÇA AQUI --- */
          descEl.textContent = "";
          console.warn(
            `Bestiário: Descrição não encontrada para ${animal.name} na inicialização.`,
            err.message
          );
          /* --- FIM DA MUDANÇA --- */
        }
      }
    }
  }

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

  /**
   * Função principal de inicialização, agora é 'async' para esperar a fauna.
   */
  async function init() {
    const totalHeight =
      CONFIG.MAX_DEPTH * CONFIG.PIXELS_PER_METER + window.innerHeight * 2;
    oceanAbyss.style.height = `${totalHeight}px`;

    ZONES.forEach((zone) => {
      const element = document.getElementById(zone.id);
      if (element) {
        element.style.top = `${zone.startDepth * CONFIG.PIXELS_PER_METER}px`;
      }
    });

    await loadAllFauna();
    prepareAnimals(animals);

    const { relatedGrid } = initModal();
    const { faunaLogList } = initHUD();
    populateBestiary(animals);

    bestiaryPrevBtn.addEventListener("click", () => {
      showBestiaryPage(bestiaryCurrentPage - 2);
    });
    bestiaryNextBtn.addEventListener("click", () => {
      showBestiaryPage(bestiaryCurrentPage + 2);
    });

    bestiaryToggleButton.addEventListener("click", () => {
      bestiaryPanel.classList.add("visible");
    });

    bestiaryCloseButton.addEventListener("click", () => {
      bestiaryPanel.classList.remove("visible");
    });

    bestiaryPanel.addEventListener("click", (e) => {
      if (e.target === bestiaryPanel) {
        bestiaryPanel.classList.remove("visible");
      }
    });

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

    faunaLogList.addEventListener("click", (e) => {
      if (e.target.dataset.animalId) {
        const animal = animals.find(
          (a) => a.name === e.target.dataset.animalId
        );
        if (animal) {
          closeModal();
          animal.figure.click();
        }
      }
    });

    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", setupParticles);

    setupParticles();

    requestAnimationFrame(() => animateAnimals(animals));
    requestAnimationFrame(animateParticles);

    update();

    setTimeout(() => {
      addLogMessage("Sistemas online. Iniciando descida.");
    }, 1000);
  }

  /**
   * Lê o HTML (populado pelo loadAllFauna) e prepara os objetos 'animal'
   */
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

      figure.addEventListener("click", async () => {
        if (!animal.articlePath) return;
        discoverAnimal(animal.name);
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
    currentDepth = Math.min(
      Math.floor(lastScrollY / CONFIG.PIXELS_PER_METER),
      CONFIG.MAX_DEPTH
    );

    titleSlide.style.opacity = Math.max(
      0,
      1 - lastScrollY / (window.innerHeight * 0.75)
    );

    const pressure = calculatePressure(currentDepth);
    const temperature = calculateTemperature(currentDepth);
    const depthRatio = currentDepth / CONFIG.MAX_DEPTH;

    updateHUD(currentDepth, pressure, temperature, depthRatio, ZONES);

    const atTheEnd = currentDepth >= CONFIG.MAX_DEPTH;
    resetButton.classList.toggle("visible", atTheEnd);
    timeTravelButton.classList.toggle("visible", atTheEnd);

    updateBackgroundColor(currentDepth);
    checkAnimalActivation();
    updateOceanFloor(currentDepth);
    updateParticleVisibility(currentDepth, CONFIG.PARTICLE_START_DEPTH);
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
          animal.img.onload = () => {
            animal.width = animal.img.offsetWidth;

            if (animal.glowColor) {
              animal.figure.style.filter = `
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
      } else if (!isInRange && animal.isActive) {
        animal.isActive = false;
        animal.figure.style.opacity = 0;
        if (animal.type === "agua-viva-brilhante") {
          animal.figure.style.filter = "";
        }
      }
      if (animal.isActive && !animal.sighted) {
        const proximity = Math.abs(animal.depth - currentDepth);
        const sightingThreshold = 5;

        if (proximity <= sightingThreshold) {
          addLogMessage(`AVISTAMENTO: ${animal.name}.`, "sighting");
          animal.sighted = true;
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

  resetButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    addLogMessage("Retornando à superfície...", "system");

    ZONES.forEach((zone) => (zone.logged = false));
    animals.forEach((animal) => (animal.sighted = false));
  });

  timeTravelButton.addEventListener("click", () => {
    document.body.classList.add("time-travel-start");
    setTimeout(() => {
      window.location.href = "./timetravel/timetravel.html";
    }, 1500);
  });

  init();
});
