let globalAnimalsList = [];

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
        <button class="tab-button" data-tab="tab-curiosidades">Curiosidades</button>
        <button class="tab-button" data-tab="tab-relacionados">Relacionados</button>
      </div>
      <div class="modal-body">
        <div class="tab-content active" id="tab-geral">
          <img class="modal-main-image" src="" alt="Imagem principal do animal">
          <p class="image-credit modal-main-credit"></p>
          <p class="modal-description"></p>
        </div>
        <div class="tab-content" id="tab-ficha">
          <ul class="ficha-tecnica-list"></ul>
          <!-- Gerador Automático de Comparação de Tamanho (Humano 1.80m vs Animal) -->
          <div class="info-module size-module">
            <h4>Comparativo de Tamanho Real (Humano 1.80m vs Animal)</h4>
            <div id="dynamic-size-comparison-container" class="dynamic-size-comparison"></div>
            <p class="size-comparison-description"></p>
          </div>
        </div>
        <div class="tab-content" id="tab-curiosidades">
          <ul class="curiosidades-list"></ul>
        </div>
        <div class="tab-content" id="tab-relacionados">
          <div class="related-species-grid"></div>
        </div>
      </div>
    </div>
  `;

// --- SELEÇÃO DOS ELEMENTOS DO MODAL ---
const modalCloseBtn = modal.querySelector(".modal-close");
const modalTitle = modal.querySelector(".modal-title");
const modalScientific = modal.querySelector(".modal-scientific-name");
const tabsContainer = modal.querySelector(".modal-tabs");
const relatedGrid = modal.querySelector(".related-species-grid");

function openModal() {
  document.body.style.overflow = "hidden";
  modal.classList.add("active");
}

export function closeModal() {
  document.body.style.overflow = "auto";
  modal.classList.remove("active");
}

/**
 * Extrai o tamanho em metros a partir do texto da ficha técnica ou usa estimativa segura.
 */
function parseAnimalSizeInMeters(animalData) {
  const compDesc = (animalData.comparativoTamanho && animalData.comparativoTamanho.descricao) || "";
  const ficha = animalData.fichaTecnica || {};
  const text = (compDesc + " " + (ficha.tamanhoMaximo || ficha.tamanho || ficha.comprimento || "")).toLowerCase();

  // Busca por metros (ex: "18 metros", "6.1m", "1,5 a 2 metros")
  const meterMatches = [...text.matchAll(/(\d+[\.,]?\d*)\s*(m|metro|metros)/g)];
  if (meterMatches.length > 0) {
    let maxVal = 0;
    for (const match of meterMatches) {
      const val = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(val) && val > maxVal) maxVal = val;
    }
    if (maxVal > 0) return maxVal;
  }

  // Busca por centímetros (ex: "30 cm", "50 centímetros")
  const cmMatches = [...text.matchAll(/(\d+[\.,]?\d*)\s*(cm|centímetro|centímetros)/g)];
  if (cmMatches.length > 0) {
    let maxVal = 0;
    for (const match of cmMatches) {
      const val = parseFloat(match[1].replace(',', '.')) / 100;
      if (!isNaN(val) && val > maxVal) maxVal = val;
    }
    if (maxVal > 0) return maxVal;
  }

  // Tenta extrair qualquer número isolado no texto de tamanho
  const numMatch = text.match(/(\d+[\.,]?\d*)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) return val > 50 ? val / 100 : val;
  }

  return 2.0; // Padrão 2 metros se não encontrado
}

/**
 * Constrói o visual do comparador automático de tamanho (Humano 1.80m vs Animal).
 */
function renderDynamicSizeComparison(animalData, cleanImgPath) {
  const container = modal.querySelector("#dynamic-size-comparison-container");
  const descEl = modal.querySelector(".size-comparison-description");
  if (!container) return;

  const animalMeters = parseAnimalSizeInMeters(animalData);
  const humanMeters = 1.80;
  const ratio = animalMeters / humanMeters;

  // Sistema de Escala em 3 Níveis para Coerência Visual (Pequeno, Médio, Gigante)
  let baseHumanHeightPx = 80;
  let animalVisualWidthPx = 100;
  let isSmallCreature = false;

  if (animalMeters < 0.6) {
    // Espécie pequena (< 60cm): mantém humano em 90px e garante tamanho visível para a criatura
    baseHumanHeightPx = 90;
    animalVisualWidthPx = 50;
    isSmallCreature = true;
  } else if (animalMeters <= 4.5) {
    // Espécie média (0.6m a 4.5m): escala 1:1 proporcional
    baseHumanHeightPx = 80;
    animalVisualWidthPx = Math.max(35, Math.round(baseHumanHeightPx * ratio));
  } else {
    // Gigantes (> 4.5m): reduz altura do humano para 40px para enfatizar o tamanho monumental do animal
    baseHumanHeightPx = 40;
    animalVisualWidthPx = Math.min(460, Math.round(baseHumanHeightPx * ratio));
  }

  let formattedSizeText = animalMeters >= 1
    ? `${animalMeters.toFixed(1)} metros`
    : `${Math.round(animalMeters * 100)} centímetros`;

  let ratioText = ratio >= 1
    ? `cerca de ${ratio.toFixed(1)}x o tamanho de um ser humano (1.80m)`
    : `cerca de ${(ratio * 100).toFixed(0)}% do tamanho de um ser humano (1.80m)`;

  container.innerHTML = `
    <div class="scale-stage">
      <div class="scale-ruler-grid"></div>
      
      <!-- Silhueta Vetorial de Humano Mergulhador (1.80m) -->
      <div class="scale-entity human-entity">
        <div class="human-svg-wrapper">
          <svg width="${Math.round(baseHumanHeightPx * 0.4)}" height="${baseHumanHeightPx}" viewBox="0 0 100 250" fill="#00d2ff" opacity="0.85">
            <circle cx="50" cy="30" r="22" />
            <path d="M 25 60 L 75 60 L 70 140 L 30 140 Z" />
            <path d="M 20 62 L 5 120 L 15 125 L 28 72 Z" />
            <path d="M 80 62 L 95 120 L 85 125 L 72 72 Z" />
            <path d="M 32 140 L 25 220 L 5 245 L 35 235 L 45 140 Z" />
            <path d="M 68 140 L 75 220 L 95 245 L 65 235 L 55 140 Z" />
          </svg>
        </div>
        <span class="entity-label">Humano (1.80m)</span>
      </div>

      <!-- Silhueta / Foto do Animal Escala Proporcional -->
      <div class="scale-entity animal-entity">
        <div class="animal-img-scale-wrapper" style="width: ${animalVisualWidthPx}px;">
          <img src="${cleanImgPath}" alt="${animalData.name}">
        </div>
        <span class="entity-label">${animalData.name} (~${formattedSizeText}${isSmallCreature ? ' - Ampliado' : ''})</span>
      </div>
    </div>
  `;

  descEl.textContent = `Escala Proporcional Coerente: O ${animalData.name} possui comprimento estimado de ~${formattedSizeText}, correspondendo a ${ratioText}.`;
}

/**
 * Preenche o modal com os dados do animal e o exibe.
 */
export function openAnimalModal(animalData) {
  modal.querySelector(".ficha-tecnica-list").innerHTML = "";
  modal.querySelector(".curiosidades-list").innerHTML = "";
  relatedGrid.innerHTML = "";

  modalTitle.textContent = animalData.name;
  modalScientific.textContent = animalData.scientificName;

  // Limpa caminhos relativos (../)
  let cleanImgPath = animalData.img || "";
  while (cleanImgPath.startsWith("../")) {
    cleanImgPath = cleanImgPath.substring(3);
  }
  if (!cleanImgPath.startsWith("./") && !cleanImgPath.startsWith("http")) {
    cleanImgPath = "./" + cleanImgPath;
  }

  modal.querySelector(".modal-main-image").src = cleanImgPath;

  const mainCredit = modal.querySelector(".modal-main-credit");
  mainCredit.textContent = animalData.fonte ? `Fonte: ${animalData.fonte}` : "";
  modal.querySelector(".modal-description").textContent = animalData.description || "";

  // Ficha técnica
  const fichaList = modal.querySelector(".ficha-tecnica-list");
  if (animalData.fichaTecnica) {
    for (const [key, value] of Object.entries(animalData.fichaTecnica)) {
      const li = document.createElement("li");
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      li.innerHTML = `<strong>${label}:</strong> <span>${value}</span>`;
      fichaList.appendChild(li);
    }
  }

  // Renderiza a comparação de tamanho com Humano (1.80m) de forma dinâmica
  renderDynamicSizeComparison(animalData, cleanImgPath);

  // Curiosidades
  const curiosidadesList = modal.querySelector(".curiosidades-list");
  if (animalData.curiosidades) {
    animalData.curiosidades.forEach((fact) => {
      const li = document.createElement("li");
      li.textContent = fact;
      curiosidadesList.appendChild(li);
    });
  }

  // Espécies Relacionadas com Resolução de Fotos Reais
  if (animalData.especiesRelacionadas && animalData.especiesRelacionadas.length > 0) {
    animalData.especiesRelacionadas.forEach((species) => {
      const item = document.createElement("div");
      item.className = "related-species-item";

      // Busca na lista global de animais para encontrar a foto real do animal
      let realImg = "";
      let targetAnimalName = species.nome;

      const matchedAnimal = globalAnimalsList.find((a) => {
        const nameA = a.name.toLowerCase().trim();
        const nameB = species.nome.toLowerCase().trim();
        return nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA);
      });

      if (matchedAnimal) {
        realImg = matchedAnimal.imgPath;
        targetAnimalName = matchedAnimal.name;
        item.dataset.targetId = matchedAnimal.name;
      } else {
        let relPath = species.img || "";
        while (relPath.startsWith("../")) relPath = relPath.substring(3);
        if (!relPath.startsWith("./") && !relPath.startsWith("http")) relPath = "./" + relPath;
        realImg = relPath;
        item.dataset.targetId = species.nome;
      }

      item.innerHTML = `
        <img src="${realImg}" alt="${species.nome}" onerror="this.src='./img/sky.jpg'; this.style.opacity='0.4';">
        <span>${species.nome}</span>
      `;
      relatedGrid.appendChild(item);
    });
  } else {
    relatedGrid.innerHTML =
      '<p style="text-align: center; opacity: 0.7;">Nenhuma espécie relacionada encontrada.</p>';
  }

  // Reseta para a primeira aba e abre o modal
  tabsContainer.querySelector('[data-tab="tab-geral"]').click();
  openModal();
}

/**
 * Inicializa o módulo do modal.
 * @param {Array} animalsList - A lista global de animais da fauna.
 */
export function initModal(animalsList = []) {
  globalAnimalsList = animalsList;
  document.body.appendChild(modal);

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

  return { relatedGrid };
}