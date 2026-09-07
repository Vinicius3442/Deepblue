// --- Elementos do HUD de Métricas ---
const cornerDepthHud = document.getElementById("corner-depth-hud");
const cornerDepthValue = document.getElementById("corner-depth-value");
const cornerPressureValue = document.getElementById("corner-pressure-value");
const cornerTempValue = document.getElementById("corner-temp-value");

/**
 * Stub de compatibilidade para mensagens do sistema (antigo log).
 */
export function addLogMessage(text, type = "info") {
  console.log(`[Deep Blue ${type.toUpperCase()}]: ${text}`);
}

/**
 * Atualiza os elementos visuais do HUD de métricas com base na profundidade.
 */
export function updateHUD(currentDepth, pressure, temperature) {
  if (!cornerDepthHud) return;

  cornerDepthHud.style.opacity = currentDepth > 2 ? 1 : 0;
  if (cornerDepthValue) cornerDepthValue.textContent = currentDepth.toLocaleString("pt-BR");
  if (cornerPressureValue) cornerPressureValue.textContent = pressure.toFixed(0);
  if (cornerTempValue) cornerTempValue.textContent = temperature.toFixed(1);
}

/**
 * Inicializa o módulo HUD.
 */
export function initHUD() {
  return {};
}