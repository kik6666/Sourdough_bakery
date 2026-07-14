import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const categoriesData = [
  {
    name: "Sourdough Bread",
    description: "Naturally leavened loaves with deep flavor and crisp crust.",
    image_url: "https://picsum.photos/seed/category-sourdough/1200/800",
  },
  {
    name: "Pastries",
    description: "Buttery laminated pastries for breakfast and coffee breaks.",
    image_url: "https://picsum.photos/seed/category-pastries/1200/800",
  },
  {
    name: "Croissants",
    description: "Classic and filled croissants with flaky golden layers.",
    image_url: "https://picsum.photos/seed/category-croissants/1200/800",
  },
  {
    name: "Sweet Bakery",
    description: "Comforting sweet bakes from rolls to tea cakes.",
    image_url: "https://picsum.photos/seed/category-sweet/1200/800",
  },
  {
    name: "Seasonal Specials",
    description: "Limited artisan creations inspired by the season.",
    image_url: "https://picsum.photos/seed/category-seasonal/1200/800",
  },
];

const productsData = [
  {
    category: "Sourdough Bread",
    name: "Country Sourdough",
    slug: "country-sourdough",
    short_description: "Rustic round loaf with mild tang and open crumb.",
    description:
      "A daily hearth loaf with naturally fermented dough, crisp crust, and a creamy interior.",
    ingredients: "Wheat flour, water, sea salt, sourdough starter",
    weight: 850,
    price: 6.9,
    image_url: "https://picsum.photos/seed/product-country-sourdough/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sourdough Bread",
    name: "Whole Wheat Sourdough",
    slug: "whole-wheat-sourdough",
    short_description: "Nutty whole-grain loaf with balanced acidity.",
    description:
      "A wholesome whole wheat sourdough with deep aroma and long fermentation for better digestibility.",
    ingredients: "Whole wheat flour, bread flour, water, sea salt, sourdough starter",
    weight: 900,
    price: 7.5,
    image_url: "https://picsum.photos/seed/product-whole-wheat/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sourdough Bread",
    name: "Olive Sourdough",
    slug: "olive-sourdough",
    short_description: "Mediterranean loaf with Kalamata olives and herbs.",
    description:
      "Savory sourdough packed with olives and aromatic herbs, ideal for cheese boards.",
    ingredients: "Bread flour, water, sea salt, olives, herbs, sourdough starter",
    weight: 820,
    price: 8.2,
    image_url: "https://picsum.photos/seed/product-olive-sourdough/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sourdough Bread",
    name: "Rye Bread",
    slug: "rye-bread",
    short_description: "Dense aromatic rye loaf for hearty meals.",
    description:
      "A traditional rye-style loaf with earthy flavor and moist crumb, perfect for open sandwiches.",
    ingredients: "Rye flour, bread flour, water, sea salt, sourdough starter",
    weight: 780,
    price: 7.8,
    image_url: "https://picsum.photos/seed/product-rye-bread/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sourdough Bread",
    name: "Multigrain Bread",
    slug: "multigrain-bread",
    short_description: "Seeded loaf with rich texture and aroma.",
    description:
      "Naturally leavened bread with mixed grains and seeds for a robust bite and toasted flavor.",
    ingredients: "Bread flour, whole wheat flour, oats, flax, sunflower seeds, water, salt",
    weight: 900,
    price: 8.4,
    image_url: "https://picsum.photos/seed/product-multigrain/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Pastries",
    name: "Butter Croissant",
    slug: "butter-croissant",
    short_description: "Flaky croissant with pure butter layers.",
    description:
      "Classic French-style croissant laminated with high-fat butter for crisp exterior and tender interior.",
    ingredients: "Flour, butter, milk, yeast, sugar, salt",
    weight: 85,
    price: 2.8,
    image_url: "https://picsum.photos/seed/product-butter-croissant/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Croissants",
    name: "Chocolate Croissant",
    slug: "chocolate-croissant",
    short_description: "Laminated pastry with rich dark chocolate baton.",
    description:
      "A buttery pain au chocolat style pastry baked golden and filled with premium dark chocolate.",
    ingredients: "Flour, butter, milk, yeast, sugar, salt, dark chocolate",
    weight: 95,
    price: 3.4,
    image_url: "https://picsum.photos/seed/product-chocolate-croissant/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sweet Bakery",
    name: "Cinnamon Roll",
    slug: "cinnamon-roll",
    short_description: "Soft roll with cinnamon swirl and glaze.",
    description:
      "Tender enriched dough layered with cinnamon sugar and finished with a light vanilla glaze.",
    ingredients: "Flour, milk, butter, yeast, cinnamon, sugar, vanilla",
    weight: 120,
    price: 3.2,
    image_url: "https://picsum.photos/seed/product-cinnamon-roll/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sweet Bakery",
    name: "Brioche",
    slug: "brioche",
    short_description: "Rich buttery loaf with delicate crumb.",
    description:
      "Classic French brioche with eggs and butter, ideal for breakfast toast and desserts.",
    ingredients: "Flour, eggs, butter, milk, yeast, sugar, salt",
    weight: 450,
    price: 5.9,
    image_url: "https://picsum.photos/seed/product-brioche/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sweet Bakery",
    name: "Kozunak",
    slug: "kozunak",
    short_description: "Traditional braided sweet bread.",
    description:
      "Soft aromatic Balkan-style sweet bread with citrus zest and vanilla notes.",
    ingredients: "Flour, eggs, butter, milk, sugar, yeast, lemon zest, vanilla",
    weight: 600,
    price: 7.2,
    image_url: "https://picsum.photos/seed/product-kozunak/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sweet Bakery",
    name: "Blueberry Muffin",
    slug: "blueberry-muffin",
    short_description: "Moist muffin packed with blueberries.",
    description:
      "Tender vanilla muffin with juicy blueberries and a crisp sugar top.",
    ingredients: "Flour, eggs, milk, butter, sugar, blueberries, baking powder",
    weight: 100,
    price: 2.9,
    image_url: "https://picsum.photos/seed/product-blueberry-muffin/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sweet Bakery",
    name: "Banana Bread",
    slug: "banana-bread",
    short_description: "Comfort loaf with ripe bananas and warm spice.",
    description:
      "House banana bread baked with ripe fruit and a hint of cinnamon.",
    ingredients: "Flour, bananas, eggs, butter, sugar, cinnamon, baking soda",
    weight: 520,
    price: 6.1,
    image_url: "https://picsum.photos/seed/product-banana-bread/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Sourdough Bread",
    name: "Rustic Baguette",
    slug: "rustic-baguette",
    short_description: "Slim crisp baguette with airy crumb.",
    description:
      "A long-fermented baguette with crackling crust and sweet wheaty flavor.",
    ingredients: "Bread flour, water, sea salt, sourdough starter",
    weight: 280,
    price: 3.1,
    image_url: "https://picsum.photos/seed/product-rustic-baguette/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Pastries",
    name: "Cheese Twist",
    slug: "cheese-twist",
    short_description: "Savory twisted pastry with aged cheese.",
    description:
      "Flaky twisted pastry dusted with grated cheese and black pepper.",
    ingredients: "Flour, butter, cheese, milk, yeast, salt, pepper",
    weight: 110,
    price: 3.0,
    image_url: "https://picsum.photos/seed/product-cheese-twist/1200/800",
    is_featured: false,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Seasonal Specials",
    name: "Fresh Mekitsa",
    slug: "fresh-mekitsa",
    short_description: "Golden fried dough served warm.",
    description:
      "Traditional soft fried dough, lightly crisp outside and fluffy inside, served fresh.",
    ingredients: "Flour, yogurt, eggs, baking soda, salt, oil",
    weight: 140,
    price: 2.6,
    image_url: "https://picsum.photos/seed/product-fresh-mekitsa/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
  {
    category: "Seasonal Specials",
    name: "Pumpkin Spice Loaf",
    slug: "pumpkin-spice-loaf",
    short_description: "Seasonal loaf with pumpkin and warming spices.",
    description:
      "Autumn-inspired artisan loaf with roasted pumpkin puree, cinnamon, nutmeg, and clove.",
    ingredients: "Bread flour, pumpkin puree, water, salt, cinnamon, nutmeg, sourdough starter",
    weight: 760,
    price: 7.9,
    image_url: "https://picsum.photos/seed/product-pumpkin-spice-loaf/1200/800",
    is_featured: true,
    in_stock: true,
    is_active: true,
  },
];

const recipesData = [
  {
    title: "How to Build a Strong Sourdough Starter in 7 Days",
    slug: "build-sourdough-starter-7-days",
    description: "A practical beginner guide to creating an active starter.",
    content:
      "Day-by-day feeding schedule, hydration tips, and readiness checks for a reliable starter. Includes troubleshooting for weak rise, over-acidity, and temperature changes.",
    image_url: "https://picsum.photos/seed/recipe-starter/1200/800",
  },
  {
    title: "Country Sourdough for Home Ovens",
    slug: "country-sourdough-home-oven",
    description: "Bake bakery-style sourdough at home without special equipment.",
    content:
      "Mixing, stretch-and-fold routine, bulk fermentation timing, shaping, and steam strategy for crisp crust and open crumb in standard home ovens.",
    image_url: "https://picsum.photos/seed/recipe-country-loaf/1200/800",
  },
  {
    title: "Whole Wheat Sourdough with Better Oven Spring",
    slug: "whole-wheat-sourdough-oven-spring",
    description: "Use hydration and fermentation control for loftier whole wheat loaves.",
    content:
      "Covers autolyse, hydration adjustments, and scoring angles to improve height and structure when using high whole-grain percentages.",
    image_url: "https://picsum.photos/seed/recipe-whole-wheat/1200/800",
  },
  {
    title: "Laminated Butter Croissants Step by Step",
    slug: "laminated-butter-croissants-step-by-step",
    description: "Master lamination with clean butter layers and precise proofing.",
    content:
      "Detailed lamination workflow with resting times, folding sequence, rolling thickness, and proofing cues for consistent flaky croissants.",
    image_url: "https://picsum.photos/seed/recipe-croissant/1200/800",
  },
  {
    title: "Cinnamon Rolls with Overnight Proof",
    slug: "cinnamon-rolls-overnight-proof",
    description: "Make soft aromatic cinnamon rolls with morning bake convenience.",
    content:
      "Prepare dough and shape rolls at night, then cold-proof and bake fresh in the morning with a balanced cream glaze.",
    image_url: "https://picsum.photos/seed/recipe-cinnamon-roll/1200/800",
  },
  {
    title: "Rustic Baguette with Poolish",
    slug: "rustic-baguette-with-poolish",
    description: "Develop flavor and crust using a simple pre-ferment.",
    content:
      "Poolish timing, dough handling, shaping technique, and high-heat steam baking for thin crispy crust and translucent crumb walls.",
    image_url: "https://picsum.photos/seed/recipe-baguette/1200/800",
  },
  {
    title: "Banana Bread with Sourdough Discard",
    slug: "banana-bread-with-sourdough-discard",
    description: "Reduce waste and add depth using discard in quick breads.",
    content:
      "Combines ripe bananas and sourdough discard for moist crumb and caramelized notes. Includes optional nut and chocolate variations.",
    image_url: "https://picsum.photos/seed/recipe-banana-bread/1200/800",
  },
  {
    title: "Savory Cheese Twists for Weekend Brunch",
    slug: "savory-cheese-twists-weekend-brunch",
    description: "Crisp savory pastries perfect for sharing.",
    content:
      "Cheese blend selection, dough resting, and shaping tips for flaky twists with balanced salt and aromatic herbs.",
    image_url: "https://picsum.photos/seed/recipe-cheese-twist/1200/800",
  },
];

const articlesData = [
  {
    title: "What Makes Sourdough Different from Commercial Yeast Bread",
    slug: "what-makes-sourdough-different",
    summary: "A clear comparison of fermentation, flavor, and texture.",
    content:
      "Explains natural fermentation, acid development, and why sourdough often has a longer shelf life and richer flavor profile.",
    image_url: "https://picsum.photos/seed/article-sourdough-vs-yeast/1200/800",
  },
  {
    title: "Understanding Hydration in Bread Dough",
    slug: "understanding-hydration-in-bread-dough",
    summary: "How water percentage changes crumb, crust, and handling.",
    content:
      "Practical hydration ranges for home bakers, with guidance on dough strength, extensibility, and fermentation pace.",
    image_url: "https://picsum.photos/seed/article-hydration/1200/800",
  },
  {
    title: "How to Read Fermentation Signs Like a Pro",
    slug: "how-to-read-fermentation-signs",
    summary: "Visual cues that matter more than the clock.",
    content:
      "Shows how to evaluate dough by volume increase, gas retention, jiggle, aroma, and finger-poke response to avoid overproofing.",
    image_url: "https://picsum.photos/seed/article-fermentation-signs/1200/800",
  },
  {
    title: "Flour Types and When to Use Them",
    slug: "flour-types-and-when-to-use-them",
    summary: "Bread flour, whole wheat, rye, and pastry flour explained.",
    content:
      "Protein levels, ash content, and milling style impact dough behavior. Includes pairing ideas for loaf and pastry recipes.",
    image_url: "https://picsum.photos/seed/article-flour-types/1200/800",
  },
  {
    title: "Why Steam Is Crucial in Artisan Baking",
    slug: "why-steam-is-crucial-artisan-baking",
    summary: "Steam improves oven spring and crust finish.",
    content:
      "Covers steam timing, safe home-oven methods, and common mistakes that lead to dull crust and weak expansion.",
    image_url: "https://picsum.photos/seed/article-steam/1200/800",
  },
  {
    title: "Troubleshooting Dense Loaves",
    slug: "troubleshooting-dense-loaves",
    summary: "Fix the top causes of heavy, tight crumb bread.",
    content:
      "Addresses starter strength, underproofing, shaping tension, and baking temperature with corrective actions.",
    image_url: "https://picsum.photos/seed/article-dense-loaves/1200/800",
  },
  {
    title: "How to Store Bread for Maximum Freshness",
    slug: "how-to-store-bread-for-freshness",
    summary: "Simple storage rules for crust and crumb quality.",
    content:
      "Best practices for same-day serving, overnight storage, slicing strategy, and freezing to preserve artisan loaves.",
    image_url: "https://picsum.photos/seed/article-storage/1200/800",
  },
  {
    title: "Seasonal Baking Calendar for Home Bakers",
    slug: "seasonal-baking-calendar-home-bakers",
    summary: "What to bake through spring, summer, autumn, and winter.",
    content:
      "Pairs ingredients and techniques with seasonality, from lighter summer pastries to winter enriched breads and festive loaves.",
    image_url: "https://picsum.photos/seed/article-seasonal-calendar/1200/800",
  },
];

function formatSupabaseError(error) {
  if (!error) {
    return "Unknown error";
  }

  const code = error.code ? `code=${error.code}` : null;
  const details = error.details ? `details=${error.details}` : null;
  const hint = error.hint ? `hint=${error.hint}` : null;

  return [error.message, code, details, hint].filter(Boolean).join(" | ");
}

async function getSafeTableStats() {
  const tables = ["categories", "products", "recipes", "articles"];
  const stats = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("id").limit(2000);
    if (error) {
      stats[table] = "unavailable";
      continue;
    }

    stats[table] = Array.isArray(data) ? data.length : 0;
  }

  return stats;
}

async function seedCategories() {
  const { error } = await supabase.from("categories").upsert(categoriesData, {
    onConflict: "name",
  });

  if (error) {
    throw new Error(`Failed to seed categories: ${formatSupabaseError(error)}`);
  }

  const { data, error: fetchError } = await supabase
    .from("categories")
    .select("id, name");

  if (fetchError) {
    throw new Error(`Failed to fetch categories: ${formatSupabaseError(fetchError)}`);
  }

  return new Map(data.map((item) => [item.name, item.id]));
}

function prepareProducts(categoryByName) {
  return productsData.map((product) => {
    const categoryId = categoryByName.get(product.category);

    if (!categoryId) {
      throw new Error(`Category not found for product: ${product.name}`);
    }

    return {
      category_id: categoryId,
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      description: product.description,
      ingredients: product.ingredients,
      weight: product.weight,
      price: product.price,
      image_url: product.image_url,
      is_featured: product.is_featured,
      in_stock: product.in_stock,
      is_active: product.is_active,
    };
  });
}

async function getAdminIdOrNull() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "administrator")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch admin profile: ${formatSupabaseError(error)}`);
  }

  return data?.id ?? null;
}

async function seedProducts(categoryByName) {
  const rows = prepareProducts(categoryByName);

  const { error } = await supabase.from("products").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw new Error(`Failed to seed products: ${formatSupabaseError(error)}`);
  }
}

async function seedRecipes(adminId) {
  const rows = recipesData.map((recipe) => ({
    created_by: adminId,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    content: recipe.content,
    image_url: recipe.image_url,
  }));

  const { error } = await supabase.from("recipes").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw new Error(`Failed to seed recipes: ${formatSupabaseError(error)}`);
  }
}

async function seedArticles(adminId) {
  const rows = articlesData.map((article) => ({
    created_by: adminId,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    image_url: article.image_url,
  }));

  const { error } = await supabase.from("articles").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw new Error(`Failed to seed articles: ${formatSupabaseError(error)}`);
  }
}

async function seedOrders(adminId) {
  if (!adminId) {
    console.log("No admin profile found — skipping order seed.");
    return;
  }

  const { data: existing } = await supabase.from("orders").select("id").limit(1);
  if (existing?.length > 0) {
    console.log("Orders already exist — skipping order seed.");
    return;
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, name")
    .eq("is_active", true)
    .limit(10);

  if (productsError || !products?.length) {
    console.log("No products found — skipping order seed.");
    return;
  }

  const now = Date.now();
  const h = (n) => new Date(now - n * 60 * 60 * 1000).toISOString();
  const d = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

  const ordersData = [
    { user_id: adminId, status: "pending",   total_price: 34.50, delivery_method: "pickup",   notes: null,                             created_at: h(2)  },
    { user_id: adminId, status: "confirmed",  total_price: 21.90, delivery_method: "delivery", notes: "Please ring doorbell twice.",     created_at: h(5)  },
    { user_id: adminId, status: "preparing",  total_price: 58.00, delivery_method: "delivery", notes: null,                             created_at: h(18) },
    { user_id: adminId, status: "confirmed",  total_price: 44.30, delivery_method: "pickup",   notes: "Gluten-free bag if possible.",   created_at: h(9)  },
    { user_id: adminId, status: "delivered",  total_price: 17.20, delivery_method: "pickup",   notes: null,                             created_at: d(2)  },
    { user_id: adminId, status: "delivered",  total_price: 63.80, delivery_method: "delivery", notes: "Leave at the door.",             created_at: d(3)  },
    { user_id: adminId, status: "cancelled",  total_price: 12.50, delivery_method: "delivery", notes: "Changed my mind.",               created_at: d(4)  },
    { user_id: adminId, status: "pending",    total_price: 29.70, delivery_method: "delivery", notes: null,                             created_at: h(1)  },
  ];

  const { data: insertedOrders, error: ordersError } = await supabase
    .from("orders")
    .insert(ordersData)
    .select("id");

  if (ordersError) {
    throw new Error(`Failed to seed orders: ${formatSupabaseError(ordersError)}`);
  }

  const itemsData = [];
  insertedOrders.forEach((order, i) => {
    const itemCount = (i % 3) + 1;
    for (let j = 0; j < itemCount; j++) {
      const product = products[(i * 2 + j) % products.length];
      itemsData.push({
        order_id: order.id,
        product_id: product.id,
        quantity: j === 0 ? 2 : 1,
        unit_price: product.price,
      });
    }
  });

  const { error: itemsError } = await supabase.from("order_items").insert(itemsData);
  if (itemsError) {
    throw new Error(`Failed to seed order items: ${formatSupabaseError(itemsError)}`);
  }

  console.log(`Seeded ${insertedOrders.length} orders with ${itemsData.length} items.`);
}

async function main() {
  console.log("Starting seed...");

  const categoryByName = await seedCategories();
  await seedProducts(categoryByName);

  const adminId = await getAdminIdOrNull();
  await seedRecipes(adminId);
  await seedArticles(adminId);
  await seedOrders(adminId);

  const afterCounts = await getSafeTableStats();
  console.log("Seeding completed.");
  console.log("Approximate row stats:", afterCounts);
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
