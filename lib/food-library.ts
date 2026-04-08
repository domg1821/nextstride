import type { FoodCategory, ReusableFood } from "@/contexts/engine-context";

type FoodLibrarySeed = {
  name: string;
  serving: string;
  calories: number;
  category: FoodCategory;
};

const FOOD_LIBRARY: FoodLibrarySeed[] = [
  { name: "Banana", serving: "1 medium", calories: 105, category: "fruit" },
  { name: "Apple", serving: "1 medium", calories: 95, category: "fruit" },
  { name: "Orange", serving: "1 medium", calories: 62, category: "fruit" },
  { name: "Strawberries", serving: "1 cup", calories: 50, category: "fruit" },
  { name: "Blueberries", serving: "1 cup", calories: 85, category: "fruit" },
  { name: "Grapes", serving: "1 cup", calories: 100, category: "fruit" },
  { name: "Pineapple", serving: "1 cup", calories: 82, category: "fruit" },

  { name: "Bagel (plain)", serving: "1 bagel", calories: 250, category: "carb" },
  { name: "White Rice", serving: "1 cup cooked", calories: 205, category: "carb" },
  { name: "Brown Rice", serving: "1 cup cooked", calories: 216, category: "carb" },
  { name: "Pasta", serving: "1 cup cooked", calories: 200, category: "carb" },
  { name: "Oatmeal", serving: "1/2 cup dry", calories: 150, category: "carb" },
  { name: "Toast", serving: "1 slice", calories: 80, category: "carb" },
  { name: "Granola", serving: "1/2 cup", calories: 200, category: "carb" },
  { name: "Quinoa", serving: "1 cup cooked", calories: 222, category: "carb" },
  { name: "Potato", serving: "1 medium", calories: 160, category: "carb" },
  { name: "Sweet Potato", serving: "1 medium", calories: 112, category: "carb" },

  { name: "Chicken Breast", serving: "4 oz", calories: 165, category: "protein" },
  { name: "Ground Beef", serving: "4 oz", calories: 250, category: "protein" },
  { name: "Salmon", serving: "4 oz", calories: 233, category: "protein" },
  { name: "Egg", serving: "1 large", calories: 70, category: "protein" },
  { name: "Greek Yogurt", serving: "1 cup", calories: 150, category: "protein" },
  { name: "Milk", serving: "1 cup", calories: 120, category: "protein" },
  { name: "Chocolate Milk", serving: "1 cup", calories: 210, category: "protein" },
  { name: "Protein Shake", serving: "1 scoop", calories: 120, category: "protein" },
  { name: "Tofu", serving: "1/2 cup", calories: 94, category: "protein" },

  { name: "Peanut Butter", serving: "1 tbsp", calories: 95, category: "fat" },
  { name: "Almond Butter", serving: "1 tbsp", calories: 98, category: "fat" },
  { name: "Olive Oil", serving: "1 tbsp", calories: 120, category: "fat" },
  { name: "Avocado", serving: "1/2 fruit", calories: 120, category: "fat" },
  { name: "Cheese", serving: "1 slice", calories: 110, category: "fat" },

  { name: "Energy Gel", serving: "1 packet", calories: 100, category: "fuel" },
  { name: "Sports Drink", serving: "12 oz", calories: 80, category: "fuel" },
  { name: "Electrolyte Drink", serving: "12 oz", calories: 10, category: "fuel" },
  { name: "Granola Bar", serving: "1 bar", calories: 150, category: "fuel" },
  { name: "Energy Bar", serving: "1 bar", calories: 250, category: "fuel" },
  { name: "Pretzels", serving: "1 oz", calories: 110, category: "fuel" },
  { name: "Trail Mix", serving: "1/4 cup", calories: 170, category: "fuel" },

  { name: "Chicken & Rice Bowl", serving: "1 bowl", calories: 600, category: "meal" },
  { name: "Pasta with Marinara", serving: "1 plate", calories: 400, category: "meal" },
  { name: "Eggs & Toast", serving: "1 plate", calories: 350, category: "meal" },
  { name: "Oatmeal with Fruit", serving: "1 bowl", calories: 300, category: "meal" },
  { name: "Protein Smoothie", serving: "1 glass", calories: 350, category: "meal" },
  { name: "Turkey Sandwich", serving: "1 sandwich", calories: 400, category: "meal" },
  { name: "Rice & Beans", serving: "1 bowl", calories: 450, category: "meal" },
];

export const STARTER_FOOD_LIBRARY: ReusableFood[] = FOOD_LIBRARY.map((food) => ({
  id: `${food.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${food.calories}`,
  name: food.name,
  servingLabel: food.serving,
  caloriesPerServing: food.calories,
  category: food.category,
}));

export type FoodLibraryGroup = {
  title: string;
  foods: ReusableFood[];
  emptyMessage: string;
};

export function searchFoodLibrary(foods: ReusableFood[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return foods;
  }

  return foods.filter((food) => {
    const haystack = `${food.name} ${food.servingLabel} ${food.category ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getFoodLibrarySections(input: {
  query: string;
  recentFoods: ReusableFood[];
  customFoods: ReusableFood[];
}) {
  const recentFoods = searchFoodLibrary(input.recentFoods, input.query);
  const customFoods = searchFoodLibrary(input.customFoods, input.query);
  const starterFoods = searchFoodLibrary(
    STARTER_FOOD_LIBRARY.filter(
      (starterFood) => !input.customFoods.some((customFood) => customFood.id === starterFood.id)
    ),
    input.query
  );

  return [
    {
      title: "Recent foods",
      foods: recentFoods,
      emptyMessage: input.query
        ? "No recent foods match this search yet."
        : "Foods you log will show up here for quick reuse.",
    },
    {
      title: "Your foods",
      foods: customFoods,
      emptyMessage: input.query
        ? "No saved custom foods match this search."
        : "Custom foods you add will be saved here automatically.",
    },
    {
      title: "Starter library",
      foods: starterFoods,
      emptyMessage: "No starter foods match this search.",
    },
  ] satisfies FoodLibraryGroup[];
}

export function getFoodCategoryIcon(category?: FoodCategory) {
  switch (category) {
    case "fruit":
      return "fruit-cherries";
    case "carb":
      return "layers";
    case "protein":
      return "barbell";
    case "fat":
      return "water";
    case "fuel":
      return "flash";
    case "meal":
      return "restaurant";
    default:
      return "nutrition";
  }
}

export function getFoodCategoryLabel(category?: FoodCategory) {
  switch (category) {
    case "fruit":
      return "Fruit";
    case "carb":
      return "Carb";
    case "protein":
      return "Protein";
    case "fat":
      return "Fat";
    case "fuel":
      return "Fuel";
    case "meal":
      return "Meal";
    default:
      return "Custom";
  }
}
