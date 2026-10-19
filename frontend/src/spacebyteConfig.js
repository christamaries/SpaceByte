// spacebyteConfig.js
// Mission-level settings the backend doesn't provide yet.
// Move these into Firestore / the backend later if you want them dynamic.

export const CREW = {
  size: 4,
  missionDay: 112,
  members: [
    { initials: "CR", color: "#6c63ff" },
    { initials: "AK", color: "#ee5fa7" },
    { initials: "JL", color: "#5ad1b0" },
    { initials: "MO", color: "#f9d56e" },
  ],
};

// Daily targets PER CREW MEMBER.
// calories matches CALORIE_TARGET in dashboardService.js.
export const TARGETS = {
  calories: 2800,
  protein: 120, // grams (placeholder - adjust)
  carbs: 350, // grams (placeholder - adjust)
  fat: 90, // grams (placeholder - adjust)
};

// Pick an emoji for a food based on its name.
const ICONS = [
  ["tortilla", "🌮"], ["taco", "🌮"], ["wrap", "🌯"],
  ["shrimp", "🍤"], ["seafood", "🦐"], ["fish", "🐟"],
  ["coffee", "☕"], ["tea", "🍵"],
  ["mac", "🧀"], ["cheese", "🧀"], ["pizza", "🍕"],
  ["egg", "🍳"], ["omelet", "🍳"],
  ["granola", "🥣"], ["oatmeal", "🥣"], ["cereal", "🥣"],
  ["fruit", "🍎"], ["apple", "🍎"], ["berr", "🍓"],
  ["toast", "🍞"], ["bread", "🍞"], ["sandwich", "🥪"],
  ["noodle", "🍜"], ["soup", "🥣"], ["rice", "🍚"],
  ["chicken", "🍗"], ["teriyaki", "🍗"], ["beef", "🥩"],
  ["stew", "🍲"], ["curry", "🍛"], ["veg", "🥦"],
  ["water", "💧"], ["bar", "🍫"], ["nut", "🥜"],
];

export function foodIcon(name = "") {
  const n = name.toLowerCase();
  const hit = ICONS.find(([key]) => n.includes(key));
  return hit ? hit[1] : "🍽️";
}