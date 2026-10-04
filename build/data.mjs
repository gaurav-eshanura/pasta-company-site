/**
 * Content model for The Pasta Company site.
 *
 * Everything a page needs is declared here so the HTML generator stays a pure
 * function of this file. Copy is lifted from the brand's reference design;
 * `price` values are PLACEHOLDERS pending the final rate card from Eshanura
 * Enterprises, exactly as flagged in build/README notes.
 */

export const brand = {
  name: "The Pasta Company",
  legal: "Eshanura Enterprises Private Limited",
  legalShort: "Eshanura Enterprises Pvt. Ltd.",
  tagline: "Roz ka Khaana, Thoda Italian, Thoda Desi.",
  domain: "pasta.eshanura.com",
  url: "https://pasta.eshanura.com",
  phone: "+91 9839436346",
  phoneHref: "+919839436346",
  email: "care@eshanura.com",
  // Registered address, shared across the Eshanura brand family and already
  // published on the Easycare site. Gives Google a verified business location.
  address: {
    streetAddress: "908, Hathipur Uttari, Seth Ghat Road",
    addressLocality: "Lakhimpur Kheri",
    postalCode: "262701",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
  social: [
    { label: "Instagram", href: "https://instagram.com/thepastacompany", icon: "instagram" },
    { label: "Facebook", href: "https://facebook.com/thepastacompany", icon: "facebook" },
    { label: "YouTube", href: "https://youtube.com/@thepastacompany", icon: "youtube" },
  ],
};

/** Prices are placeholders pending the final rate card from Eshanura. */
export const priceNote =
  "All prices are MRP and inclusive of applicable taxes. Prices shown are placeholders pending the final rate card.";

export const products = [
  {
    slug: "desi-penne",
    filter: "penne",
    name: "Desi Penne",
    blurb: "Sauce ho ya tadka, har andaaz mein fit.",
    long:
      "Slanted tubes with just enough ridge to hold a masala tadka. This is the shape most Indian kitchens reach for first, and the one that survives a last-minute dinner.",
    shape: "assets/img/pasta/penne-shape.png",
    tags: ["Tadka friendly", "Bakes well", "Vegetarian"],
    cook: { time: 9, salt: "1 tbsp per litre", tip: "Hold back 1 cup of the starchy water before draining." },
    claims: ["100% Durum Wheat", "No Maida", "No Artificial Colours"],
    price: { 100: 30, 200: 55, 500: 125 },
  },
  {
    slug: "masala-fusilli",
    filter: "fusilli",
    name: "Masala Fusilli",
    blurb: "Ghoomti shape, mazedaar bites.",
    long:
      "A corkscrew that catches masala in every groove. Fusilli is the shape that makes a simple onion-tomato tadka taste like it was planned.",
    shape: "assets/img/pasta/fusilli-shape.png",
    tags: ["Masala friendly", "Kid favourite", "Vegetarian"],
    cook: { time: 10, salt: "1 tbsp per litre", tip: "Fusilli traps more sauce than penne - go a touch heavier on the gravy." },
    claims: ["100% Durum Wheat", "No Maida", "No Artificial Colours"],
    price: { 100: 35, 200: 65, 500: 145 },
  },
  {
    slug: "classic-macaroni",
    filter: "macaroni",
    name: "Classic Macaroni",
    blurb: "Bacchon ka favourite, har din ka saathi.",
    long:
      "The short, curved tube that has been on Indian school tiffins for two generations. Thick, sturdy and forgiving - it never turns to mush.",
    shape: "assets/img/pasta/macaroni-shape.png",
    tags: ["Bakes well", "Lunch box", "Vegetarian"],
    cook: { time: 8, salt: "1 tbsp per litre", tip: "Undercook by a minute for a bakesafe macaroni that keeps its shape in the oven." },
    claims: ["100% Durum Wheat", "No Maida", "No Artificial Colours"],
    price: { 100: 30, 200: 55, 500: 125 },
  },
  {
    slug: "spaghetti",
    filter: "spaghetti",
    name: "Spaghetti",
    blurb: "Lambi soch, bade swaad.",
    long:
      "Long, slow-sauced strands built for a Sunday aglio e olio or a bright arrabbiata. Our durum wheat gives it the bite that holds through the whole bowl.",
    shape: "assets/img/pasta/spaghetti-shape.png",
    tags: ["Sauced", "Date night", "Vegetarian"],
    cook: { time: 9, salt: "1 tbsp per litre", tip: "Toss in the pan with the sauce - never plate dry spaghetti and pour over." },
    claims: ["100% Durum Wheat", "No Maida", "No Artificial Colours"],
    price: { 100: 32, 200: 58, 500: 135 },
  },
  {
    slug: "pasta-mix",
    filter: "mix",
    name: "Pasta Mix",
    blurb: "Har shape ka maza ek saath.",
    long:
      "Penne, fusilli and macaroni in one pack - a whole pasta parivaar for anyone cooking for a crowd without a second opinion.",
    shape: "assets/img/pasta/mix-shape.png",
    tags: ["Value pack", "Party", "Vegetarian"],
    cook: { time: 9, salt: "1 tbsp per litre", tip: "Shapes cook within a minute of each other - add the short shapes first." },
    claims: ["100% Durum Wheat", "No Maida", "No Artificial Colours"],
    price: { 100: 45, 200: 85, 500: 195 },
  },
];

export const sizes = [100, 200, 500];

export const sizeNote = {
  100: "Try & taste",
  200: "Everyday",
  500: "Family & gifting",
};

export const recipes = [
  {
    slug: "masala-pasta-tadka",
    seo: "Masala Pasta Tadka recipe with Fusilli: onion, tomato and ginger-garlic masala finished with butter. 25 minutes, serves 2-3.",
    title: "Masala Pasta Tadka",
    kicker: "Roz ka khaana",
    img: "assets/img/recipes/recipe-1.webp",
    product: "masala-fusilli",
    time: 25,
    serves: "2-3",
    level: "Easy",
    intro:
      "The dish this brand was built on. Onion, tomato and a whole lot of patience, finished with butter and pasta water until the sauce clings.",
    ingredients: [
      ["200 g", "Masala Fusilli"],
      ["2 tbsp", "Butter"],
      ["1", "Onion, finely chopped"],
      ["3", "Tomatoes, crushed or blitzed"],
      ["1 tbsp", "Ginger-garlic paste"],
      ["1 tsp", "Red chilli powder"],
      ["1 tsp", "Garam masala"],
      ["1/2 tsp", "Turmeric"],
      ["1 tsp", "Sugar, optional"],
      ["Handful", "Fresh coriander"],
    ],
    method: [
      "Melt the butter in a heavy pan over medium heat. Add the onion and cook until soft and just beginning to colour, about 6 minutes.",
      "Stir in the ginger-garlic paste and let it sizzle for 30 seconds, until the raw smell is gone.",
      "Add the tomato and the dry spices. Simmer 8 to 10 minutes, stirring often, until the masala thickens and the oil separates at the edges.",
      "Boil the pasta in well-salted water until just shy of al dente. Before draining, reserve a cup of the water.",
      "Add the pasta and a splash of the water to the masala. Toss hard over medium heat for two minutes so the sauce grips every twist.",
      "Finish with butter, coriander and a crack of black pepper. Serve hot.",
    ],
    tips: [
      "The sauce should be a shade looser than you think - it tightens in the last minute of tossing.",
      "A spoon of grated cheese off the heat turns it into a kid's dinner without changing the recipe.",
    ],
  },
  {
    slug: "penne-arrabbiata-desi-style",
    seo: "Penne Arrabbiata Desi Style: garlic, chilli and tomato with a spoon of honey. A 20-minute desi take on an Italian classic.",
    title: "Penne Arrabbiata Desi Style",
    kicker: "Teen rang ka taak",
    img: "assets/img/recipes/recipe-2.webp",
    product: "desi-penne",
    time: 20,
    serves: "2",
    level: "Easy",
    intro:
      "Garlic, chilli and tomato, sharpened with a spoon of honey instead of the Italian sugar. Penne holds the heat of arrabbiata better than anything.",
    ingredients: [
      ["200 g", "Desi Penne"],
      ["4", "Garlic cloves, thinly sliced"],
      ["3 tbsp", "Olive oil"],
      ["1 tsp", "Chilli flakes"],
      ["400 g", "Tomatoes, crushed"],
      ["1 tsp", "Honey"],
      ["1/2 tsp", "Sugar"],
      ["Handful", "Basil or coriander"],
    ],
    method: [
      "Warm the olive oil over low-medium heat and gently fry the garlic until it is pale gold, not brown. This takes about 3 minutes and should smell sweet rather than sharp.",
      "Add the chilli flakes and stir for 20 seconds.",
      "Pour in the crushed tomato, honey and sugar. Simmer 10 minutes until it darkens and thickens.",
      "Boil the penne until al dente, reserving a cup of the cooking water.",
      "Toss the pasta through the sauce with a splash of pasta water until every tube is coated.",
      "Scatter over herbs and serve with a hard grating of cheese.",
    ],
    tips: [
      "Never let the garlic catch colour - arrabbiata turns bitter fast.",
      "Add a teaspoon of butter at the end if you want the sauce to sit glossier on the pasta.",
    ],
  },
  {
    slug: "macaroni-desi-veggies",
    seo: "Macaroni with Desi Veggies: crisp mixed vegetables, sweet corn and peas tossed through buttery macaroni. Ready in 30 minutes.",
    title: "Macaroni with Desi Veggies",
    kicker: "Colourful & light",
    img: "assets/img/recipes/recipe-3.webp",
    product: "classic-macaroni",
    time: 30,
    serves: "3",
    level: "Easy",
    intro:
      "Every vegetable in the fridge, briefly cooked so it still crunches, folded through buttered macaroni. A lunchbox dish that works hot or cold.",
    ingredients: [
      ["200 g", "Classic Macaroni"],
      ["2 tbsp", "Olive oil or butter"],
      ["1 cup", "Mixed vegetables, chopped"],
      ["1", "Carrot, diced"],
      ["1/2 cup", "Peas"],
      ["1/2 cup", "Sweet corn"],
      ["1 tsp", "Black pepper"],
      ["1 tsp", "Mixed herbs"],
      ["Salt", "To taste"],
    ],
    method: [
      "Cook the macaroni until just tender, then drain and rinse under cool water so it stops cooking.",
      "Heat the oil in a wide pan and stir-fry the carrot, peas and corn for 3 minutes. Add the mixed vegetables and cook 2 minutes more - they should stay bright.",
      "Add the macaroni with a splash of the cooking water and toss to combine.",
      "Season with pepper, herbs and salt, and finish off the heat.",
    ],
    tips: [
      "Frozen peas and corn go straight from the freezer - no thawing needed.",
      "Add a spoon of mayo or a splash of cream at the end to turn it into pasta salad.",
    ],
  },
  {
    slug: "pasta-salad-chaat-style",
    seo: "Pasta Salad Chaat Style: cold pasta with onion, tomato, cucumber and tamarind. A 20-minute party and potluck favourite.",
    title: "Pasta Salad Chaat Style",
    kicker: "Party favourite",
    img: "assets/img/recipes/recipe-4.webp",
    product: "pasta-mix",
    time: 20,
    serves: "4",
    level: "Easy",
    intro:
      "Cold pasta dressed chaat-style with lemon, tamarind and a masala punch. Made for potlucks, picnics and the five minutes before guests arrive.",
    ingredients: [
      ["250 g", "Pasta Mix, cooked and cooled"],
      ["1", "Onion, finely chopped"],
      ["1", "Tomato, chopped"],
      ["1", "Cucumber, chopped"],
      ["1/2 cup", "Sweet corn"],
      ["1 tbsp", "Lemon juice"],
      ["1 tsp", "Chaat masala"],
      ["1/2 tsp", "Roasted cumin powder"],
      ["2 tbsp", "Coriander leaves"],
      ["1 tbsp", "Tamarind chutney"],
    ],
    method: [
      "Cook the pasta, drain, and rinse under cold water until completely cool. Drain again and spread out so it does not clump.",
      "Combine the onion, tomato, cucumber and corn in a large bowl.",
      "Add the cooled pasta, lemon juice, chaat masala, cumin, tamarind chutney and coriander.",
      "Toss well, taste for salt and lemon, and chill for 10 minutes before serving.",
    ],
    tips: [
      "Chilling the pasta first keeps the salad from going soggy in the bowl.",
      "A teaspoon of olive oil in the dressing keeps the lemon bright and the pasta glossy.",
    ],
  },
];

export const retailerBenefits = [
  "Fast moving category",
  "Attractive margin",
  "Eye-catching packs",
  "Regular supply",
  "POS support available",
];

export const distributorBenefits = [
  { text: "Wide product range", detail: "(100 g, 200 g, 500 g)" },
  { text: "High repeat purchase", detail: "" },
  { text: "PAN India potential", detail: "" },
  { text: "Marketing support", detail: "" },
  { text: "Consistent quality & supply", detail: "" },
];

export const trustPoints = [
  {
    icon: "wheat",
    title: "100% Durum Wheat",
    text: "Real durum, never maida. The firm bite is the whole point.",
  },
  {
    icon: "bowl",
    title: "Har recipe mein fit",
    text: "Penne for sauce, fusilli for tadka, spaghetti for a long Sunday.",
  },
  {
    icon: "heart",
    title: "Roz ke khaane ka naya dost",
    text: "Fast, filling and something the whole table actually asks for.",
  },
];

export const nav = [
  { href: "index.html", label: "Home" },
  { href: "pasta.html", label: "Our Pasta" },
  { href: "recipes.html", label: "Recipes" },
  { href: "retailers.html", label: "For Retailers" },
  { href: "distributors.html", label: "For Distributors" },
  { href: "about.html", label: "About" },
];
