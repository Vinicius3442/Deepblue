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

// --- SELEÇÃO DOS ELEMENTOS DO MODAL ---
const modalCloseBtn = modal.querySelector(".modal-close");
const modalTitle = modal.querySelector(".modal-title");
const modalScientific = modal.querySelector(".modal-scientific-name");
const tabsContainer = modal.querySelector(".modal-tabs");
const expandedMediaViewer = modal.querySelector(".expanded-media-viewer");
const closeExpandedMediaBtn = modal.querySelector(".close-expanded-media");
const expandedMediaContent = modal.querySelector(".expanded-media-content");
const relatedGrid = modal.querySelector(".related-species-grid");

// --- FUNÇÕES DE CONTROLE DO MODAL (INTERNAS) ---

function openModal() {
  document.body.style.overflow = "hidden";
  modal.classList.add("active");
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

  expandedMediaViewer.querySelector(".expanded-media-caption").textContent =
    item.legenda || "";
  expandedMediaViewer.querySelector(".expanded-media-credit").textContent =
    item.fonte ? `Fonte: ${item.fonte}` : "";
  expandedMediaViewer.classList.add("active");
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
  modal.querySelector(".gallery-grid").innerHTML = "";
  modal.querySelector(".curiosidades-list").innerHTML = "";
  relatedGrid.innerHTML = "";

  modalTitle.textContent = animalData.name;
  modalScientific.textContent = animalData.scientificName;
  modal.querySelector(".modal-main-image").src = animalData.img;

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

  // Galeria
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
      mediaElement = document.createElement("img");
      mediaElement.src = `https://img.youtube.com/vi/${item.src}/mqdefault.jpg`;
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

  // Espécies Relacionadas
  if (
    animalData.especiesRelacionadas &&
    animalData.especiesRelacionadas.length > 0
  ) {
    animalData.especiesRelacionadas.forEach((species) => {
      const item = document.createElement("div");
      item.className = "related-species-item";
      item.dataset.targetId = species.targetId; // main.js vai usar isso
      item.innerHTML = `<img src="${species.img}" alt="${species.nome}"><span>${species.nome}</span>`;
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

  closeExpandedMediaBtn.addEventListener("click", () => {
    expandedMediaViewer.classList.remove("active");
    const currentVideo = expandedMediaContent.querySelector("video");
    if (currentVideo) currentVideo.pause();
    const currentIframe = expandedMediaContent.querySelector("iframe");
    if (currentIframe) currentIframe.src = "";
  });

  // Retorna os elementos que o main.js precisa para interagir
  return { relatedGrid };
}