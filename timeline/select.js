document.addEventListener('DOMContentLoaded', () => {
    const bubblesContainer = document.getElementById('bubbles');
    const numBubbles = 25; // Vamos criar mais bolhas para um efeito mais denso

    // Função que cria uma única bolha com propriedades aleatórias
    const createBubble = () => {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Gera valores aleatórios para cada bolha
        const size = Math.random() * 80 + 20; // Tamanho entre 20px e 100px
        const left = Math.random() * 100; // Posição horizontal em %
        const riseDuration = Math.random() * 10 + 8; // Duração da subida entre 8s e 18s
        const wobbleDuration = Math.random() * 3 + 2; // Duração do zigue-zague entre 2s e 5s
        const delay = Math.random() * 5; // Atraso inicial de até 5s

        // Aplica os valores aleatórios como estilos inline
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;

        // Define as durações e atrasos para as duas animações
        bubble.style.animationDuration = `${riseDuration}s, ${wobbleDuration}s`;
        bubble.style.animationDelay = `${delay}s`;

        bubblesContainer.appendChild(bubble);
    };

    // Cria as 25 bolhas
    for (let i = 0; i < numBubbles; i++) {
        createBubble();
    }
});