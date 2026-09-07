// --- SINTETIZADOR WEB AUDIO API PARA AMBIENTAÇÃO MARINHA & BALEIAS ---
let audioCtx = null;
let masterGain = null;
let isAudioEnabled = false;
let isMuted = true;

// Nódulos de áudio do ambiente
let noiseNode = null;
let filterNode = null;
let ambientGain = null;

// Cronômetro do Cântico de Baleias
let whaleTimer = null;
let currentDepthMeters = 0;

/**
 * Inicializa o AudioContext no primeiro clique/gesto do usuário.
 */
export function initAudio() {
  if (audioCtx) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.warn("Web Audio API não é suportada neste navegador.");
    return;
  }

  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  createUnderwaterAmbient();
}

/**
 * Cria o som contínuo de ruído subaquático e ressonância de pressão.
 */
function createUnderwaterAmbient() {
  if (!audioCtx) return;

  // Tamanho do buffer de ruído (2 segundos)
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  // Geração de Ruído Marrom (Brownian Noise - som profundo e aveludado de água)
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Ganho relativo
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  // Filtro de Pressão da Água (Lowpass Filter)
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.setValueAtTime(300, audioCtx.currentTime);
  filterNode.Q.setValueAtTime(2.5, audioCtx.currentTime);

  ambientGain = audioCtx.createGain();
  ambientGain.gain.setValueAtTime(0.15, audioCtx.currentTime);

  noiseNode.connect(filterNode);
  filterNode.connect(ambientGain);
  ambientGain.connect(masterGain);

  noiseNode.start();
}

/**
 * Sintetizador Procedural de Cântico de Baleias (Baleia-Jubarte / Baleia-Azul)
 * Utiliza osciladores com envelope de pitch e filtro ressonante com eco.
 */
export function triggerWhaleCall() {
  if (!audioCtx || isMuted || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime;
  const duration = 2.5 + Math.random() * 2.0; // 2.5s a 4.5s de canto

  // Oscilador Principal (Onda senoidal/triangular para tom vocal orgânico)
  const osc = audioCtx.createOscillator();
  const oscType = Math.random() > 0.5 ? "sine" : "triangle";
  osc.type = oscType;

  // Frequência de partida da baleia (entre 120Hz e 380Hz)
  const startFreq = 140 + Math.random() * 200;
  const endFreq = Math.random() > 0.5 ? startFreq * (1.3 + Math.random() * 0.4) : startFreq * (0.6 + Math.random() * 0.3);

  osc.frequency.setValueAtTime(startFreq, now);
  // Curva exponencial de variação de tom (o lamento típico das baleias)
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, endFreq), now + duration * 0.7);
  osc.frequency.exponentialRampToValueAtTime(startFreq * 0.9, now + duration);

  // Filtro de Forma Vocal (Formant Filter)
  const whaleFilter = audioCtx.createBiquadFilter();
  whaleFilter.type = "bandpass";
  whaleFilter.frequency.setValueAtTime(startFreq * 1.5, now);
  whaleFilter.Q.setValueAtTime(4.0, now);

  // Envelope de Ganho (Suave entrada e saída)
  const whaleGain = audioCtx.createGain();
  whaleGain.gain.setValueAtTime(0.001, now);
  whaleGain.gain.linearRampToValueAtTime(0.25, now + 0.6);
  whaleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Efeito de Eco / Reverb Subaquático Simulado
  const delay = audioCtx.createDelay();
  delay.delayTime.setValueAtTime(0.35, now);
  const feedback = audioCtx.createGain();
  feedback.gain.setValueAtTime(0.4, now);

  osc.connect(whaleFilter);
  whaleFilter.connect(whaleGain);
  whaleGain.connect(masterGain);

  // Conecta ao eco
  whaleGain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(masterGain);

  osc.start(now);
  osc.stop(now + duration + 1.0);
}

/**
 * Gerencia o agendamento de baleias na Zona Mesopelágica (200m a 1000m)
 */
function scheduleWhaleCalls() {
  if (whaleTimer) clearTimeout(whaleTimer);

  const checkAndPlay = () => {
    if (!isMuted && currentDepthMeters >= 200 && currentDepthMeters <= 1000) {
      triggerWhaleCall();
    }
    // Próximo canto entre 8 e 20 segundos
    const nextInterval = 8000 + Math.random() * 12000;
    whaleTimer = setTimeout(checkAndPlay, nextInterval);
  };

  whaleTimer = setTimeout(checkAndPlay, 4000);
}

/**
 * Atualiza os parâmetros de áudio com base na profundidade atual (0m - 11.000m)
 */
export function updateAudioDepth(depthMeters) {
  currentDepthMeters = depthMeters;
  if (!audioCtx || !filterNode) return;

  const now = audioCtx.currentTime;

  // Ajusta a frequência de corte do ruído subaquático de acordo com a profundidade
  // Superfície (0m): 450Hz (mais claro) -> Profundo (11000m): 80Hz (sub-grave denso)
  const depthFactor = Math.min(1, depthMeters / 11000);
  const targetCutoff = 450 - depthFactor * 370;
  filterNode.frequency.setTargetAtTime(targetCutoff, now, 0.5);

  // Se o usuário entrou na Zona Mesopelágica (200m a 1000m), agenda cântico de baleias
  if (depthMeters >= 200 && depthMeters <= 1000 && !whaleTimer) {
    scheduleWhaleCalls();
  }
}

/**
 * Alterna entre Mudo / Tocando (Mute / Unmute).
 * @returns {boolean} Retorna true se estiver ativado (com som), false se mutado.
 */
export function toggleAudio() {
  initAudio();

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  isMuted = !isMuted;
  const now = audioCtx ? audioCtx.currentTime : 0;

  if (masterGain) {
    if (isMuted) {
      masterGain.gain.setTargetAtTime(0, now, 0.2);
    } else {
      masterGain.gain.setTargetAtTime(0.5, now, 0.2);
      // Dispara um cântico imediato se estiver na Zona Mesopelágica
      if (currentDepthMeters >= 200 && currentDepthMeters <= 1000) {
        triggerWhaleCall();
      }
    }
  }

  if (!isMuted && !whaleTimer) {
    scheduleWhaleCalls();
  }

  return !isMuted;
}
