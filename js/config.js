export const CONFIG = {
  MAX_DEPTH: 11000,
  PIXELS_PER_METER: 25,
  ANIMAL_ACTIVATION_RANGE: 350,
  OCEAN_FLOOR_START_DEPTH: 7000,
  OCEAN_FLOOR_FULL_OPACITY_DEPTH: 10000,
  PARTICLE_START_DEPTH: 1000,
};

export const ZONES = [
  {
    id: "zone-epipelagic",
    name: "Epipelágica",
    startDepth: 0,
    color: [0, 119, 190],
    logged: false,
    curiosidades: [
      "Também conhecida como 'Zona da Luz Solar', pois é a única camada que recebe luz suficiente para a fotossíntese.",
      "Abriga a grande maioria da vida marinha conhecida.",
      "A temperatura pode variar muito nesta zona.",
    ],
  },
  {
    id: "zone-mesopelagic",
    name: "Mesopelágica",
    startDepth: 200,
    color: [0, 66, 104],
    logged: false,
    curiosidades: [
      "Conhecida como 'Zona do Crepúsculo', a luz solar aqui é extremamente fraca.",
      "Muitos animais desta zona são bioluminescentes.",
      "Organismos realizam a 'migração vertical diária' para se alimentar.",
    ],
  },
  {
    id: "zone-bathypelagic",
    name: "Batipelágica",
    startDepth: 1000,
    color: [2, 25, 40],
    logged: false,
    curiosidades: [
      "Conhecida como 'Zona da Meia-Noite', não há luz solar.",
      "A pressão da água aqui é esmagadora, mais de 100 vezes a da superfície.",
      "Animais aqui desenvolveram corpos moles e metabolismo lento para sobreviver.",
    ],
  },
  {
    id: "zone-abyssopelagic",
    name: "Abissopelágica",
    startDepth: 4000,
    color: [1, 8, 15],
    logged: false,
    curiosidades: [
      "O nome vem do grego e significa 'sem fundo'.",
      "As temperaturas são próximas do congelamento.",
      "A comida é escassa, consistindo principalmente de 'neve marinha' que cai das camadas superiores.",
    ],
  },
  {
    id: "zone-hadopelagic",
    name: "Hadopelágica",
    startDepth: 6000,
    color: [0, 2, 5],
    logged: false,
    curiosidades: [
      "Localizada nas fossas oceânicas mais profundas do mundo.",
      "A pressão pode exceder 1.000 vezes a da superfície.",
      "A vida aqui é surpreendente, incluindo espécies como o peixe-caracol e anfípodes gigantes.",
    ],
  },
  {
    id: "final-depth",
    name: "Fim",
    startDepth: CONFIG.MAX_DEPTH,
    color: [0, 0, 0],
    logged: false,
  },
];