const adjectives = [
  "Silent",
  "Hidden",
  "Shadow",
  "Crimson",
  "Golden",
  "Cosmic",
  "Blue",
  "Mystic",
  "Frozen",
  "Lucky",
  "Brave",
  "Royal",
  "Swift",
  "Dark",
  "Gentle",
  "Electric",
];

const nouns = [
  "Raven",
  "Fox",
  "Wolf",
  "Falcon",
  "Phoenix",
  "Tiger",
  "Dragon",
  "Panther",
  "Storm",
  "Lotus",
  "Knight",
  "Wizard",
  "Hermione",
  "Harry",
  "Sherlock",
  "Batman",
  "Luffy",
  "Zoro",
  "Naruto",
  "Gojo",
  "Itachi",
];

export function generateAnonymousName() {
  const adjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];

  const noun =
    nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}