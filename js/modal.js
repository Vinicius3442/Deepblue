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
          <p class="image-credit modal-main-credit"></p> <p class="modal-description"></p>
        </div>
        <div class="tab-content" id="tab-ficha">
          <ul class="ficha-tecnica-list"></ul>
          <div class="info-module map-module"> <h4>Mapa de Distribuição</h4> <img src="" alt=""> <p class="image-credit map-credit"></p> </div> <div class="info-module size-module"> <h4>Comparativo de Tamanho</h4> <img src="" alt=""> <p class="image-credit size-credit"></p> <p></p> </div> </div>
        <div class="tab-content" id="tab-curiosidades"> <ul class="curiosidades-list"></ul> </div>
        <div class="tab-content" id="tab-relacionados"> <div class="related-species-grid"></div> </div>
      </div>
    </div>
  `;

// --- SELEÇÃO DOS ELEMENTOS DO MODAL ---
const modalCloseBtn = modal.querySelector(".modal-close");
const modalTitle = modal.querySelector(".modal-title");
const modalScientific = modal.querySelector(".modal-scientific-name");
const tabsContainer = modal.querySelector(".modal-tabs");
const relatedGrid = modal.querySelector(".related-species-grid");

// --- FUNÇÕES DE CONTROLE DO MODAL (INTERNAS) ---

function openModal() {
  document.body.style.overflow = "hidden";
  modal.classList.add("active");
}

/**
 * Fecha o modal.
 */
export function closeModal() {
  document.body.style.overflow = "auto";
  modal.classList.remove("active");
}

/**
 * Preenche o modal com os dados do animal e o exibe.
 * Exportada para ser chamada pelo main.js.
 * @param {object} animalData
 */
export function openAnimalModal(animalData) {
  modal.querySelector(".ficha-tecnica-list").innerHTML = "";
  modal.querySelector(".curiosidades-list").innerHTML = "";
  relatedGrid.innerHTML = "";

  modalTitle.textContent = animalData.name;
  modalScientific.textContent = animalData.scientificName;

  // FIX: Limpar caminhos relativos (../) que quebram no index.html
  let cleanImgPath = animalData.img;
  while (cleanImgPath.startsWith("../")) {
    cleanImgPath = cleanImgPath.substring(3);
  }
  // Se não começar com ./ e não for http, adiciona ./
  if (!cleanImgPath.startsWith("./") && !cleanImgPath.startsWith("http")) {
    cleanImgPath = "./" + cleanImgPath;
  }

  modal.querySelector(".modal-main-image").src = cleanImgPath;

  const mainCredit = modal.querySelector(".modal-main-credit");
  mainCredit.textContent = animalData.fonte
    ? `Fonte: ${animalData.fonte}`
    : "";

  modal.querySelector(".modal-description").textContent =
    animalData.description;

  const fichaList = modal.querySelector(".ficha-tecnica-list");
  for (const [key, value] of Object.entries(animalData.fichaTecnica)) {
    const li = document.createElement("li");
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
    li.innerHTML = `<strong>${label}:</strong> <span>${value}</span>`;
    fichaList.appendChild(li);
  }

  const mapModule = modal.querySelector(".map-module");
  if (animalData.mapaDistribuicao && animalData.mapaDistribuicao.img) {
    mapModule.style.display = "block";

    // FIX também para imagem do mapa
    let mapPath = animalData.mapaDistribuicao.img;
    while (mapPath.startsWith("../")) mapPath = mapPath.substring(3);
    if (!mapPath.startsWith("./") && !mapPath.startsWith("http")) mapPath = "./" + mapPath;

    mapModule.querySelector("img").src = mapPath;
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

    // FIX também para imagem de tamanho
    let sizePath = animalData.comparativoTamanho.img;
    while (sizePath.startsWith("../")) sizePath = sizePath.substring(3);
    if (!sizePath.startsWith("./") && !sizePath.startsWith("http")) sizePath = "./" + sizePath;

    sizeModule.querySelector("img").src = sizePath;
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

  // Galeria REMOVIDA

  // Curiosidades
  const curiosidadesList = modal.querySelector(".curiosidades-list");
  animalData.curiosidades.forEach((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    curiosidadesList.appendChild(li);
  });

  // Espécies Relacionadas
  if (
    animalData.especiesRelacionadas &&
    animalData.especiesRelacionadas.length > 0
  ) {
    animalData.especiesRelacionadas.forEach((species) => {
      const item = document.createElement("div");
      item.className = "related-species-item";
      item.dataset.targetId = species.targetId; // main.js vai usar isso

      // FIX para imagens relacionadas
      let relPath = species.img;
      while (relPath.startsWith("../")) relPath = relPath.substring(3);
      if (!relPath.startsWith("./") && !relPath.startsWith("http")) relPath = "./" + relPath;

      item.innerHTML = `<img src="${relPath}" alt="${species.nome}"><span>${species.nome}</span>`;
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
 * Inicializa o módulo do modal. Adiciona o modal ao DOM e
 * configura os listeners internos.
 * Exportada para ser chamada pelo main.js.
 */
export function initModal() {
  // Adiciona o modal ao <body>
  document.body.appendChild(modal);

  // Configura listeners internos do modal
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

  // Retorna os elementos que o main.js precisa para interagir
  return { relatedGrid };
}