// --- Elementos do Canvas e Estado ---
const particleCanvas = document.getElementById("particle-canvas");
const ctx = particleCanvas.getContext("2d");
let particles = [];
let lastScrollY = 0; // Este módulo precisa de sua própria cópia para calcular o delta

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
  const currentDepth = Math.floor(newScrollY / 25); // Assume PIXELS_PER_METER = 25
  const PARTICLE_START_DEPTH = 1000; // Dependência local

  particles.forEach((p) => {
    // --- LÓGICA PARA CRIATURAS BIOLUMINESCENTES ---
    if (p.isBioluminescent && currentDepth > PARTICLE_START_DEPTH) {
      let color = "100, 255, 200"; // Cor padrão (verde)

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

      ctx.beginPath();
      ctx.shadowColor = `rgba(${color}, 0.9)`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.bioType === "nadador_verde") {
        const tailX = p.x - p.vx * 4;
        const tailY = p.y - p.vy * 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = p.radius * 0.8;
        ctx.strokeStyle = `rgba(${color}, ${p.opacity * 0.5})`;
        ctx.stroke();
      }
    } else {
      // --- LÓGICA PARA PARTÍCULAS NORMAIS (NEVE MARINHA) ---
      p.y += deltaY * p.z * 0.1;
      ctx.beginPath();
      ctx.shadowBlur = 0;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
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

  lastScrollY = newScrollY; // Atualiza o lastScrollY para o próximo frame
  requestAnimationFrame(animateParticles);
}

/**
 * Controla a opacidade (fade-in) do canvas de partículas.
 * Exportado para ser chamado pelo 'main.js' no loop de update.
 * @param {number} depth - A profundidade atual.
 * @param {number} PARTICLE_START_DEPTH - A profundidade em que as partículas aparecem.
 */
export function updateParticleVisibility(depth, PARTICLE_START_DEPTH) {
  const fadeInStart = PARTICLE_START_DEPTH - 200;
  const fadeInEnd = PARTICLE_START_DEPTH + 300;
  if (depth > fadeInStart) {
    const progress = Math.min(
      1,
      (depth - fadeInStart) / (fadeInEnd - fadeInStart)
    );
    particleCanvas.style.opacity = progress;
  } else {
    particleCanvas.style.opacity = 0;
  }
}