// Pool of Dutch names for AI opponents, split by gender.
window.DUTCH_AI_NAMES_MALE = [
  "Daan", "Sem", "Lucas", "Finn", "Levi", "Noah", "Milan", "Sam", "Bram", "Liam",
  "Luuk", "Thijs", "Julian", "Noud", "Gijs", "Teun", "Stijn", "Sven", "Lars", "Ruben",
  "Mark", "Joris", "Tim", "Niels", "Tom", "Jeroen", "Pepijn", "Roel", "Floris", "Hugo",
  "Bas", "Vince", "Pieter", "Jan", "Kees", "Jairo", "Dimitri", "Kevin", "Sergio", "Rashid",
  "Patrick", "Gregory", "Miguel", "Max"
];

window.DUTCH_AI_NAMES_FEMALE = [
  "Emma", "Julia", "Mila", "Tess", "Sophie", "Zoë", "Anna", "Eva", "Saar", "Lieke",
  "Fenna", "Sanne", "Noor", "Lynn", "Roos", "Evi", "Yara", "Fleur", "Lotte", "Hannah",
  "Lisa", "Sanne", "Anne", "Sofie", "Maria", "Femke", "Wendy", "Inge", "Ilse", "Mirthe",
  "Puck", "Fenne", "Maud", "Britt", "Bo", "Jade", "Veerle", "Noortje", "Sara", "Nina",
  "Ella", "Liv", "Suze", "Cato", "Kiki", "Maya"
];

// Combined pool (used when gender doesn't matter)
window.DUTCH_AI_NAMES = window.DUTCH_AI_NAMES_MALE.concat(window.DUTCH_AI_NAMES_FEMALE);

// Pick a random AI name; optionally bias toward a gender
window.randomAiName = function(gender) {
  if (gender === 'm') return window.DUTCH_AI_NAMES_MALE[Math.floor(Math.random() * window.DUTCH_AI_NAMES_MALE.length)];
  if (gender === 'f') return window.DUTCH_AI_NAMES_FEMALE[Math.floor(Math.random() * window.DUTCH_AI_NAMES_FEMALE.length)];
  return window.DUTCH_AI_NAMES[Math.floor(Math.random() * window.DUTCH_AI_NAMES.length)];
};
