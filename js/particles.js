// --- Elementos do Canvas e Estado ---
const particleCanvas = document.getElementById("particle-canvas");
const ctx = particleCanvas.getContext("2d");
let particles = [];
let ripples = [];
let touchBubbles = [];
let lastScrollY = 0; // Este módulo precisa de sua própria cópia para calcular o delta
let globalParticleAlpha = 0;

/**
 * Cria uma ondulação de água e bolhas bioluminescentes no ponto de toque/clique.
 */
export function createWaterRipple(x, y) {
  ripples.push({
    x,
    y,
    radius: 4,
    maxRadius: 60,
    alpha: 0.85,
  });

  const bubbleCount = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < bubbleCount; i++) {
    touchBubbles.push({
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 24,
      radius: Math.random() * 2.5 + 1.0,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -(Math.random() * 1.4 + 0.6),
      alpha: 1.0,
      color: Math.random() > 0.4 ? "0, 210, 255" : "255, 203, 143",
    });
  }
}

// Listeners globais para toque/clique no oceano
window.addEventListener("click", (e) => {
  if (
    e.target.closest("button") ||
    e.target.closest(".bestiary-card") ||
    e.target.closest(".modal-content") ||
    e.target.closest("aside")
  ) {
    return;
  }
  createWaterRipple(e.clientX, e.clientY);
});

window.addEventListener("touchstart", (e) => {
  if (!e.touches[0]) return;
  const touch = e.touches[0];
  if (
    e.target.closest("button") ||
    e.target.closest(".bestiary-card") ||
    e.target.closest(".modal-content") ||
    e.target.closest("aside")
  ) {
    return;
  }
  createWaterRipple(touch.clientX, touch.clientY);
}, { passive: true });

/**
 * Prepara o canvas e cria todas as partículas iniciais.
 * Exportado para ser chamado pelo 'main.js' na inicialização.
 */
export function setupParticles() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
  particles = [];
  const particleCount = (particleCanvas.width * particleCanvas.height) / 8000;

  for (let i = 0; i < particleCount; i++) {
    const isBioluminescent = Math.random() < 0.1;
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
      vx: 0,
      vy: 0,
      wanderAngle: 0,
      bioType: "none",
    };

    if (isBioluminescent) {
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = (Math.random() - 0.5) * 0.5;
      particle.wanderAngle = Math.random() * Math.PI * 2;

      const bioRoll = Math.random();
      if (bioRoll < 0.6) {
        particle.bioType = "nadador_verde";
      } else if (bioRoll < 0.9) {
        particle.bioType = "pulsante_azul";
      } else {
        particle.bioType = "estatico_amarelo";
      }
    }
    particles.push(particle);
  }
}

/**
 * O loop de animação do canvas que desenha todas as partículas.
 * Exportado para ser chamado pelo 'main.js'.
 */
export function animateParticles() {
  ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  
  // Calcula o delta da rolagem
  const newScrollY = window.scrollY;
  const deltaY = newScrollY - lastScrollY;
  const currentDepth = Math.floor(newScrollY / 25);
  const PARTICLE_START_DEPTH = 1000;

  // --- RENDERING DAS ONDULAÇÕES (RIPPLES) ---
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 210, 255, ${r.alpha})`;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(0, 210, 255, 0.8)";
    ctx.shadowBlur = 8;
    ctx.stroke();

    r.radius += 2.2;
    r.alpha -= 0.03;

    if (r.alpha <= 0 || r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
    }
  }

  // --- RENDERING DAS BOLHAS DE TOQUE ---
  for (let i = touchBubbles.length - 1; i >= 0; i--) {
    const b = touchBubbles[i];
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${b.color}, ${b.alpha})`;
    ctx.shadowColor = `rgba(${b.color}, 0.9)`;
    ctx.shadowBlur = 10;
    ctx.fill();

    b.x += b.vx;
    b.y += b.vy;
    b.alpha -= 0.02;

    if (b.alpha <= 0) {
      touchBubbles.splice(i, 1);
    }
  }

  particles.forEach((p) => {
    if (globalParticleAlpha <= 0) return;

    // --- LÓGICA PARA CRIATURAS BIOLUMINESCENTES ---
    if (p.isBioluminescent && currentDepth > PARTICLE_START_DEPTH) {
      let color = "100, 255, 200";

      switch (p.bioType) {
        case "nadador_verde":
          p.wanderAngle += (Math.random() - 0.5) * 0.3;
          p.vx += Math.cos(p.wanderAngle) * 0.03;
          p.vy += Math.sin(p.wanderAngle) * 0.03;
          break;
        case "pulsante_azul":
          color = "100, 180, 255";
          p.opacity = 0.5 + Math.sin(p.wanderAngle) * 0.3;
          p.wanderAngle += 0.02;
          p.vx *= 0.9;
          p.vy *= 0.9;
          break;
        case "estatico_amarelo":
          color = "255, 220, 100";
          p.vx *= 0.8;
          p.vy *= 0.8;
          break;
      }

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 0.4;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.y += deltaY * p.z * 0.1;

      const drawOpacity = p.opacity * globalParticleAlpha;
      ctx.beginPath();
      ctx.shadowColor = `rgba(${color}, 0.9)`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(${color}, ${drawOpacity})`;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.bioType === "nadador_verde") {
        const tailX = p.x - p.vx * 4;
        const tailY = p.y - p.vy * 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = p.radius * 0.8;
        ctx.strokeStyle = `rgba(${color}, ${drawOpacity * 0.5})`;
        ctx.stroke();
      }
    } else {
      // --- LÓGICA PARA PARTÍCULAS NORMAIS (NEVE MARINHA) ---
      p.y += deltaY * p.z * 0.1;
      const drawOpacity = p.opacity * globalParticleAlpha;
      ctx.beginPath();
      ctx.shadowBlur = 0;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${drawOpacity})`;
      ctx.fill();
    }

    // --- Reciclagem de Partículas ---
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

  lastScrollY = newScrollY;
  requestAnimationFrame(animateParticles);
}

export function updateParticleVisibility(depth, PARTICLE_START_DEPTH) {
  const fadeInStart = PARTICLE_START_DEPTH - 200;
  const fadeInEnd = PARTICLE_START_DEPTH + 300;
  if (depth > fadeInStart) {
    globalParticleAlpha = Math.min(
      1,
      (depth - fadeInStart) / (fadeInEnd - fadeInStart)
    );
  } else {
    globalParticleAlpha = 0;
  }
  particleCanvas.style.opacity = "1";
}