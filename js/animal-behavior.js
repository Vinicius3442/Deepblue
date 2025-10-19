/**
 * Loop principal de animação para todos os animais.
 * Exportado para ser chamado pelo 'main.js'.
 * @param {Array} animals - O array principal de objetos de animais.
 */
export function animateAnimals(animals) {
  animals.forEach((animal) => {
    if (!animal.isActive) return;
    if (animal.x === -9999) {
      const gallery = animal.figure.parentElement;
      if (gallery && gallery.offsetWidth > 0) {
        const animalWidth = animal.width || animal.scale * 100;
        const spawnableWidth = gallery.offsetWidth - animalWidth;
        animal.x = Math.random() * Math.max(0, spawnableWidth);
      } else {
        return;
      }
    }

    // Decide qual comportamento aplicar com base no tipo do animal
    switch (animal.type) {
      case "lula":
        applyLulaPhysics(animal);
        break;
      case "agua-viva":
      case "agua-viva-brilhante":
        applyAguaVivaPhysics(animal);
        break;
      case "peixe-pequeno":
        applyPequenoPeixePhysics(animal); // <-- FUNÇÃO ATUALIZADA
        break;
      case "reptil":
        applyReptilPhysics(animal);
        break;
      default:
        applyPeixePhysics(animal);
        break;
    }

    const flipThreshold = 0.1;
    if (animal.vx > flipThreshold) {
      animal.flip = 1;
    } else if (animal.vx < -flipThreshold) {
      animal.flip = -1;
    }

    animal.figure.style.transform = `translate(${animal.x}px, ${animal.y}px) scale(${animal.scale}) scaleX(${animal.flip})`;
  });

  // Solicita o próximo frame de animação
  requestAnimationFrame(() => animateAnimals(animals));
}

// --- FUNÇÕES DE FÍSICA INTERNAS (Não precisam ser exportadas) ---

function applyReptilPhysics(animal) {
  if (animal.spookTimer > 0) animal.spookTimer--;

  const gallery = animal.figure.parentElement;
  if (!gallery || gallery.offsetWidth === 0) return;

  const galleryWidth = gallery.offsetWidth;
  const galleryHeight = animal.zoneHeight;
  const imgWidth = animal.width || animal.scale * 100;

  animal.wanderAngle += (Math.random() - 0.5) * 0.2;
  const wanderForce = {
    x: Math.cos(animal.wanderAngle) * 0.05,
    y: Math.sin(animal.wanderAngle) * 0.05,
  };
  const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.005 };
  const avoidanceForce = { x: 0, y: 0 };
  const margin = 200;
  let progress;

  if (animal.x < margin) {
    progress = (margin - animal.x) / margin;
    avoidanceForce.x = progress * 0.5;
  } else if (animal.x > galleryWidth - imgWidth - margin) {
    progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
    avoidanceForce.x = -progress * 0.5;
  }
  if (animal.y < margin) {
    progress = (margin - animal.y) / margin;
    avoidanceForce.y = progress * 0.5;
  } else if (animal.y > galleryHeight - imgWidth - margin) {
    progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
    avoidanceForce.y = -progress * 0.5;
  }

  animal.vx += wanderForce.x + homeForce.x + avoidanceForce.x;
  animal.vy += wanderForce.y + homeForce.y + avoidanceForce.y;

  animal.vx *= 0.98;
  animal.vy *= 0.98;
  const maxSpeed = 0.8;
  const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
  if (speed > maxSpeed) {
    animal.vx = (animal.vx / speed) * maxSpeed;
    animal.vy = (animal.vy / speed) * maxSpeed;
  }

  animal.x += animal.vx;
  animal.y += animal.vy;

  if (galleryWidth > imgWidth) {
    animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
  }
}

//
// ******** FUNÇÃO ATUALIZADA ********
//
function applyPequenoPeixePhysics(animal) {
  if (animal.spookTimer > 0) animal.spookTimer--;

  const gallery = animal.figure.parentElement;
  if (!gallery || gallery.offsetWidth === 0) return;

  const galleryWidth = gallery.offsetWidth;
  const galleryHeight = animal.zoneHeight;
  const imgWidth = animal.width || animal.scale * 100;

  animal.wanderAngle += (Math.random() - 0.5) * 0.8;
  const wanderForce = {
    x: Math.cos(animal.wanderAngle) * 0.15,
    y: Math.sin(animal.wanderAngle) * 0.15,
  };
  const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.01 };
  const avoidanceForce = { x: 0, y: 0 };
  const margin = 200;
  let progress;

  if (animal.x < margin) {
    progress = (margin - animal.x) / margin;
    avoidanceForce.x = progress * 0.5;
  } else if (animal.x > galleryWidth - imgWidth - margin) {
    progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
    avoidanceForce.x = -progress * 0.5;
  }
  if (animal.y < margin) {
    progress = (margin - animal.y) / margin;
    avoidanceForce.y = progress * 0.4;
  } else if (animal.y > galleryHeight - imgWidth - margin) {
    progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
    avoidanceForce.y = -progress * 0.4;
  }

  animal.vx += wanderForce.x + homeForce.x + avoidanceForce.x;
  animal.vy += wanderForce.y + homeForce.y + avoidanceForce.y;

  animal.vx *= 0.95;
  animal.vy *= 0.95;

  const maxSpeed = 1.0;
  const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
  if (speed > maxSpeed) {
    animal.vx = (animal.vx / speed) * maxSpeed;
    animal.vy = (animal.vy / speed) * maxSpeed;
  }

  animal.x += animal.vx;
  animal.y += animal.vy;

  if (galleryWidth > imgWidth) {
    animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
  }
}

function applyPeixePhysics(animal) {
  if (animal.spookTimer > 0) animal.spookTimer--;

  const gallery = animal.figure.parentElement;
  if (!gallery || gallery.offsetWidth === 0) return;

  const galleryWidth = gallery.offsetWidth;
  const galleryHeight = animal.zoneHeight;
  const imgWidth = animal.width || animal.scale * 100;

  animal.wanderAngle += (Math.random() - 0.5) * 0.4;
  const wanderForce = {
    x: Math.cos(animal.wanderAngle) * 0.1,
    y: Math.sin(animal.wanderAngle) * 0.1,
  };
  const homeForce = { x: 0, y: (animal.homeY - animal.y) * 0.005 };
  const avoidanceForce = { x: 0, y: 0 };
  const margin = 200;
  let progress;

  if (animal.x < margin) {
    progress = (margin - animal.x) / margin;
    avoidanceForce.x = progress * 0.5;
  } else if (animal.x > galleryWidth - imgWidth - margin) {
    progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
    avoidanceForce.x = -progress * 0.5;
  }
  if (animal.y < margin) {
    progress = (margin - animal.y) / margin;
    avoidanceForce.y = progress * 0.5;
  } else if (animal.y > galleryHeight - imgWidth - margin) {
    progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
    avoidanceForce.y = -progress * 0.5;
  }

  const accelerationX = wanderForce.x + homeForce.x + avoidanceForce.x * 1.0;
  const accelerationY = wanderForce.y + homeForce.y + avoidanceForce.y * 1.0;
  animal.vx += accelerationX;
  animal.vy += accelerationY;

  animal.vx *= 0.96;
  animal.vy *= 0.96;
  const maxSpeed = 1.2;
  const speed = Math.sqrt(animal.vx * animal.vx + animal.vy * animal.vy);
  if (speed > maxSpeed) {
    animal.vx = (animal.vx / speed) * maxSpeed;
    animal.vy = (animal.vy / speed) * maxSpeed;
  }

  animal.x += animal.vx;
  animal.y += animal.vy;

  if (galleryWidth > imgWidth) {
    animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
  }
}

function applyLulaPhysics(animal) {
  if (animal.spookTimer > 0) animal.spookTimer--;

  // Lógica de propulsão
  animal.propulsionTimer = (animal.propulsionTimer || 0) - 1;
  if (animal.propulsionTimer <= 0) {
    animal.propulsionTimer = 60 + Math.random() * 120;
    const angle = (Math.random() - 0.5) * 0.8;
    const thrust = 4 + Math.random() * 4; // Impulso forte
    animal.vx += animal.flip * Math.cos(angle) * thrust;
    animal.vy += Math.sin(angle) * thrust * 0.5;
  }

  const gallery = animal.figure.parentElement;
  const avoidanceForce = { x: 0, y: 0 };

  if (gallery && gallery.offsetWidth > 0) {
    const galleryWidth = gallery.offsetWidth;
    const galleryHeight = animal.zoneHeight;
    const imgWidth = animal.width || animal.scale * 100;
    const margin = 200;

    let progress;
    if (animal.x < margin) {
      progress = (margin - animal.x) / margin;
      avoidanceForce.x = progress * 1.0;
    } else if (animal.x > galleryWidth - imgWidth - margin) {
      progress = (animal.x - (galleryWidth - imgWidth - margin)) / margin;
      avoidanceForce.x = -progress * 1.0;
    }

    if (animal.y < margin) {
      progress = (margin - animal.y) / margin;
      avoidanceForce.y = progress * 1.0;
    } else if (animal.y > galleryHeight - imgWidth - margin) {
      progress = (animal.y - (galleryHeight - imgWidth - margin)) / margin;
      avoidanceForce.y = -progress * 1.0;
    }
  }

  animal.vx += avoidanceForce.x;
  animal.vy += avoidanceForce.y;

  animal.vx *= 0.94;
  animal.vy *= 0.94;
  animal.vy += (animal.homeY - animal.y) * 0.002;

  animal.x += animal.vx;
  animal.y += animal.vy;

  if (gallery && gallery.offsetWidth > 0) {
    const galleryWidth = gallery.offsetWidth;
    const imgWidth = animal.width || animal.scale * 100;
    if (galleryWidth > imgWidth) {
      animal.x = Math.max(0, Math.min(animal.x, galleryWidth - imgWidth));
    }
  }
}

function applyAguaVivaPhysics(animal) {
  if (animal.spookTimer > 0) animal.spookTimer--;
  animal.pulseTimer = (animal.pulseTimer || Math.random() * 100) + 0.05;

  const pulseForce = Math.sin(animal.pulseTimer) * 0.1;
  animal.vy += pulseForce;
  animal.vx += (Math.random() - 0.5) * 0.01;
  animal.vx *= 0.9;
  animal.vy *= 0.9;
  animal.vy += (animal.homeY - animal.y) * 0.005;

  animal.x += animal.vx;
  animal.y += animal.vy;
}