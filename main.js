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

            const img = document.createElement("img");
            img.dataset.src = animal.imgPath;
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
    setupParticles(); 

    
    
    
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
        const animal = animals.find((a) => a.name === e.target.dataset.animalId);
        if (animal) {
          closeModal();
          animal.figure.click();
        }
      }
    });

    
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", setupParticles);

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
          animal.img.src = animal.img.dataset.src;
          animal.img.onload = () => {
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

  

  resetButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    addLogMessage("Retornando à superfície...", "system"); 
    
    
    ZONES.forEach((zone) => (zone.logged = false));
  });

  timeTravelButton.addEventListener("click", () => {
    document.body.classList.add("time-travel-start");
    setTimeout(() => {
      window.location.href = "./timetravel/timetravel.html";
    }, 1500);
  });

  
  init();
});