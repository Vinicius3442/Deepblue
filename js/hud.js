// --- Elementos do HUD e Log de Bordo ---
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
const cornerPressureValue = document.getElementById("corner-pressure-value");
const cornerTempValue = document.getElementById("corner-temp-value");

// Botão de Reset (o HUD precisa "ouvir" ele para limpar o log)
const resetButton = document.getElementById("reset-button");

// --- Estado Interno do Módulo ---
let vehicleStats = { hull: 100, energy: 100, oxygen: 100 };

/**
 * Adiciona uma nova mensagem ao Log de Bordo.
 * Exportado para main.js e outros módulos usarem.
 * @param {string} text - O texto da mensagem.
 * @param {string} type - O tipo de mensagem (info, system, sighting).
 */
export function addLogMessage(text, type = "info") {
  const li = document.createElement("li");
  li.className = `log-message ${type}`;

  if (type === "sighting") {
    // Extrai o nome do animal do texto "AVISTAMENTO: Nome do Animal."
    const animalName = text.replace("AVISTAMENTO: ", "").replace(".", "");
    // Cria um link com data-attribute que o main.js pode ouvir
    li.innerHTML = `AVISTAMENTO: <a data-animal-id="${animalName}">${animalName}</a>.`;
    
    // Adiciona o animal à aba "Fauna" do log, se ainda não estiver lá
    if (!faunaLogList.querySelector(`[data-animal-id="${animalName}"]`)) {
      const faunaLi = document.createElement("li");
      faunaLi.textContent = animalName;
      faunaLi.dataset.animalId = animalName; // O mesmo data-attribute
      faunaLogList.appendChild(faunaLi);
      faunaEmptyState.style.display = "none";
    }
  } else {
    li.textContent = text;
  }
  
  logMessagesList.appendChild(li);
  // Garante que o log sempre role para a nova mensagem
  logMessagesList.scrollTop = logMessagesList.scrollHeight;
}

/**
 * Atualiza todos os elementos visuais do HUD com base nos dados atuais.
 * Exportado para ser chamado pelo loop 'update' no main.js.
 * @param {number} currentDepth 
 * @param {number} pressure 
 * @param {number} temperature 
 * @param {number} depthRatio 
 * @param {Array} ZONES 
 */
export function updateHUD(currentDepth, pressure, temperature, depthRatio, ZONES) {

  cornerDepthHud.style.opacity = currentDepth > 2 ? 1 : 0; 

  cornerDepthValue.textContent = currentDepth.toLocaleString("pt-BR");
  cornerPressureValue.textContent = pressure.toFixed(0);
  cornerTempValue.textContent = temperature.toFixed(1);

  // 2. Atualiza o Painel de Status do Veículo
  vehicleStats.hull = Math.max(
    0,
    100 - depthRatio * 15 + Math.sin(Date.now() / 1000) * 0.5
  );
  vehicleStats.energy = Math.max(0, 100 - depthRatio * 40);
  // Oxigênio (vamos supor que não muda por enquanto)
  vehicleStats.oxygen = 100; 

  hullBar.style.width = `${vehicleStats.hull}%`;
  hullValue.textContent = `${Math.floor(vehicleStats.hull)}%`;
  energyBar.style.width = `${vehicleStats.energy}%`;
  energyValue.textContent = `${Math.floor(vehicleStats.energy)}%`;
  oxygenBar.style.width = `${vehicleStats.oxygen}%`;
  oxygenValue.textContent = `${Math.floor(vehicleStats.oxygen)}%`;

  // 3. Atualiza a Aba "Zona Atual"
  let currentZone =
    ZONES.find(
      (z) =>
        currentDepth >= z.startDepth &&
        (ZONES[ZONES.indexOf(z) + 1]
          ? currentDepth < ZONES[ZONES.indexOf(z) + 1].startDepth
          : true)
    ) || ZONES[0];
  
  // Só atualiza o HTML se a zona for diferente da atual
  if (zoneInfoTitle.dataset.current !== currentZone.id) {
    zoneInfoTitle.dataset.current = currentZone.id;
    zoneInfoTitle.textContent = `Zona ${currentZone.name}`;
    zoneInfoList.innerHTML = "";
    currentZone.curiosidades?.forEach((fact) => {
      const li = document.createElement("li");
      li.textContent = fact;
      zoneInfoList.appendChild(li);
    });
  }
}

/**
 * Configura todos os listeners de clique para o painel de Log.
 * Exportado para ser chamado pelo 'init' no main.js.
 */
export function initHUD() {
  // Listener para abrir/fechar o painel
  logToggleButton.addEventListener("click", () =>
    logPanel.classList.toggle("visible")
  );

  // Listener para as Abas
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

  // Listener para o botão de Reset
  resetButton.addEventListener("click", () => {
    // Limpa os logs
    setTimeout(() => {
      logMessagesList.innerHTML = "";
      faunaLogList.innerHTML = "";
      faunaEmptyState.style.display = "block";
      addLogMessage("Sistemas online. Iniciando descida.");
    }, 2000); // Espera a rolagem para o topo terminar
  });

  // Retorna elementos que o 'main.js' precisa "ouvir"
  return {
    faunaLogList, // main.js precisa adicionar um listener de clique aqui
  };
}