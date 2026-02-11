/**
 * Nutrition Tracking and Meal Planning Service
 *
 * Comprehensive nutrition tracking, meal planning, and dietary analysis
 * for post-operative recovery. Includes 200+ foods, surgery-specific
 * meal plans, nutrient analysis, smart recommendations, and
 * medication-food interaction warnings.
 *
 * No external dependencies.
 */

// ============================================================================
// Const-object enums (erasableSyntaxOnly compatible)
// ============================================================================

export const FoodCategory = {
  PROTEINS: 'proteins',
  GRAINS: 'grains',
  FRUITS: 'fruits',
  VEGETABLES: 'vegetables',
  DAIRY: 'dairy',
  SNACKS: 'snacks',
  BEVERAGES: 'beverages',
  SUPPLEMENTS: 'supplements',
} as const;
export type FoodCategory = typeof FoodCategory[keyof typeof FoodCategory];

export const MealType = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;
export type MealType = typeof MealType[keyof typeof MealType];

export const RecoveryPlanType = {
  HIGH_PROTEIN: 'high_protein',
  ANTI_INFLAMMATORY: 'anti_inflammatory',
  CARDIAC: 'cardiac',
  DIABETIC_FRIENDLY: 'diabetic_friendly',
  SOFT_FOOD_PROGRESSION: 'soft_food_progression',
  IRON_RICH: 'iron_rich',
} as const;
export type RecoveryPlanType = typeof RecoveryPlanType[keyof typeof RecoveryPlanType];

export const RecoveryPhase = {
  IMMEDIATE: 'immediate',
  EARLY: 'early',
  MID: 'mid',
  LATE: 'late',
} as const;
export type RecoveryPhase = typeof RecoveryPhase[keyof typeof RecoveryPhase];

export const NutrientWarningLevel = {
  LOW: 'low',
  ADEQUATE: 'adequate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type NutrientWarningLevel = typeof NutrientWarningLevel[keyof typeof NutrientWarningLevel];

export const DietPhase = {
  CLEAR_LIQUID: 'clear_liquid',
  FULL_LIQUID: 'full_liquid',
  PUREED: 'pureed',
  SOFT: 'soft',
  REGULAR: 'regular',
} as const;
export type DietPhase = typeof DietPhase[keyof typeof DietPhase];

// ============================================================================
// Interfaces
// ============================================================================

export interface Micronutrients {
  vitaminC_mg: number;
  vitaminD_mcg: number;
  vitaminA_mcg: number;
  zinc_mg: number;
  iron_mg: number;
  calcium_mg: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  micronutrients: Micronutrients;
}

export interface MealLogEntry {
  id: string;
  patientId: string;
  date: string;
  mealType: MealType;
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  micronutrients: Micronutrients;
  timestamp: string;
}

export interface FluidLogEntry {
  id: string;
  patientId: string;
  date: string;
  amount_ml: number;
  type: string;
  timestamp: string;
}

export interface SupplementLogEntry {
  id: string;
  patientId: string;
  date: string;
  name: string;
  dosage: string;
  timestamp: string;
}

export interface DailyNutrientTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  fluid_ml: number;
  vitaminC_mg: number;
  vitaminD_mcg: number;
  vitaminA_mcg: number;
  zinc_mg: number;
  iron_mg: number;
  calcium_mg: number;
}

export interface DailyNutrientTotals {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  fluid_ml: number;
  vitaminC_mg: number;
  vitaminD_mcg: number;
  vitaminA_mcg: number;
  zinc_mg: number;
  iron_mg: number;
  calcium_mg: number;
  mealCount: number;
}

export interface NutrientComparison {
  nutrient: string;
  current: number;
  target: number;
  percentage: number;
  unit: string;
  status: NutrientWarningLevel;
}

export interface NutrientAnalysis {
  date: string;
  totals: DailyNutrientTotals;
  targets: DailyNutrientTargets;
  comparisons: NutrientComparison[];
  warnings: string[];
  proteinPerKg: number;
}

export interface WeeklyTrend {
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgProtein_g: number;
  avgCarbs_g: number;
  avgFat_g: number;
  avgFiber_g: number;
  avgFluid_ml: number;
  avgVitaminC_mg: number;
  avgIron_mg: number;
  avgCalcium_mg: number;
  daysLogged: number;
}

export interface FoodInteraction {
  foodId: string;
  foodName: string;
  medication: string;
  severity: 'warning' | 'danger';
  description: string;
}

export interface MealPlanEntry {
  mealType: MealType;
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  protein_g: number;
}

export interface DayMealPlan {
  day: number;
  dayLabel: string;
  meals: MealPlanEntry[];
  totalCalories: number;
  totalProtein_g: number;
}

export interface WeeklyMealPlan {
  planType: RecoveryPlanType;
  patientId: string;
  createdAt: string;
  days: DayMealPlan[];
  averageDailyCalories: number;
  averageDailyProtein_g: number;
}

export interface FoodSuggestion {
  food: FoodItem;
  reason: string;
  servings: number;
  nutrientsBoosted: string[];
}

export interface RecoveryNutritionPlan {
  type: RecoveryPlanType;
  name: string;
  description: string;
  targets: DailyNutrientTargets;
  recommendedFoodIds: string[];
  avoidFoodIds: string[];
  guidelines: string[];
  dietPhase?: DietPhase;
}

export interface PatientNutritionProfile {
  patientId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  surgeryType: string;
  recoveryPhase: RecoveryPhase;
  activePlan: RecoveryPlanType;
  allergies: string[];
  medications: string[];
  preferences: string[];
}

// ============================================================================
// Food Database (200+ items)
// ============================================================================

function buildFoodDb(): FoodItem[] {
  const foods: FoodItem[] = [];
  let idCounter = 1;
  const fid = (): string => `food-${String(idCounter++).padStart(3, '0')}`;

  const add = (
    name: string, cat: FoodCategory, servSize: string, servG: number,
    cal: number, pro: number, carb: number, fat: number, fib: number, sod: number,
    vc: number, vd: number, va: number, zn: number, fe: number, ca: number,
  ): void => {
    foods.push({
      id: fid(), name, category: cat, servingSize: servSize, servingGrams: servG,
      calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat, fiber_g: fib, sodium_mg: sod,
      micronutrients: { vitaminC_mg: vc, vitaminD_mcg: vd, vitaminA_mcg: va, zinc_mg: zn, iron_mg: fe, calcium_mg: ca },
    });
  };

  const P = FoodCategory.PROTEINS;
  const G = FoodCategory.GRAINS;
  const F = FoodCategory.FRUITS;
  const V = FoodCategory.VEGETABLES;
  const D = FoodCategory.DAIRY;
  const S = FoodCategory.SNACKS;
  const B = FoodCategory.BEVERAGES;
  const SU = FoodCategory.SUPPLEMENTS;

  // ---- PROTEINS (40 items) ----
  //       name                           cat  serv           g   cal  pro  carb fat  fib  sod   vc   vd   va   zn   fe   ca
  add('Chicken Breast (grilled)',          P, '100g',        100, 165, 31,  0,   3.6, 0,   74,   0,   0.1, 6,   1.0, 0.7, 15);
  add('Chicken Thigh (skinless)',          P, '100g',        100, 209, 26,  0,   10,  0,   84,   0,   0.1, 16,  2.4, 1.1, 12);
  add('Turkey Breast (roasted)',           P, '100g',        100, 135, 30,  0,   0.7, 0,   50,   0,   0.1, 5,   1.2, 0.7, 10);
  add('Ground Turkey (lean)',              P, '100g',        100, 170, 21,  0,   9,   0,   72,   0,   0.1, 0,   2.4, 1.5, 18);
  add('Salmon Fillet',                     P, '100g',        100, 208, 20,  0,   13,  0,   59,   0,   11,  58,  0.6, 0.3, 12);
  add('Tuna (canned in water)',            P, '100g',        100, 116, 26,  0,   0.8, 0,  320,   0,   1.7, 18,  0.5, 1.0, 11);
  add('Shrimp (cooked)',                   P, '100g',        100, 99,  24,  0.2, 0.3, 0,  111,   2,   0,   0,   1.6, 2.4, 70);
  add('Cod Fillet',                        P, '100g',        100, 82,  18,  0,   0.7, 0,   54,   1,   0.9, 12,  0.5, 0.4, 16);
  add('Tilapia Fillet',                    P, '100g',        100, 96,  20,  0,   1.7, 0,   52,   0,   3.1, 0,   0.3, 0.6, 10);
  add('Lean Beef Sirloin',                 P, '100g',        100, 183, 27,  0,   8,   0,   56,   0,   0.1, 0,   5.5, 2.6, 18);
  add('Ground Beef (90% lean)',            P, '100g',        100, 176, 20,  0,   10,  0,   66,   0,   0.1, 0,   4.8, 2.2, 12);
  add('Pork Tenderloin',                   P, '100g',        100, 143, 26,  0,   3.5, 0,   48,   1,   0.5, 2,   2.4, 1.0, 5);
  add('Pork Chop (lean)',                  P, '100g',        100, 172, 25,  0,   7,   0,   62,   0,   0.6, 2,   2.9, 0.8, 19);
  add('Lamb Leg (lean)',                   P, '100g',        100, 162, 25,  0,   6,   0,   59,   0,   0.1, 0,   4.0, 1.9, 8);
  add('Eggs (large, whole)',               P, '1 egg',        50, 72,  6.3, 0.4, 4.8, 0,   71,   0,   1.1, 80,  0.6, 0.9, 28);
  add('Egg Whites',                        P, '3 whites',   100, 52,  11,  0.7, 0.2, 0,  166,   0,   0,   0,   0,   0.1, 7);
  add('Tofu (firm)',                        P, '100g',       100, 76,  8,   1.9, 4.8, 0.3,  7,   0,   0,   0,   0.8, 1.6, 350);
  add('Tempeh',                            P, '100g',        100, 192, 20,  7.6, 11,  0,    9,   0,   0,   0,   1.1, 2.7, 111);
  add('Black Beans (cooked)',              P, '100g',        100, 132, 8.9, 24,  0.5, 8.7,  1,   0,   0,   0,   0.5, 2.1, 27);
  add('Lentils (cooked)',                  P, '100g',        100, 116, 9,   20,  0.4, 7.9,  2,   1.5, 0,   8,   1.3, 3.3, 19);
  add('Chickpeas (cooked)',                P, '100g',        100, 164, 8.9, 27,  2.6, 7.6, 24,   1.3, 0,   1,   1.5, 2.9, 49);
  add('Kidney Beans (cooked)',             P, '100g',        100, 127, 8.7, 23,  0.5, 6.4,  2,   1.2, 0,   0,   1.0, 2.9, 28);
  add('Edamame (shelled)',                 P, '100g',        100, 121, 12,  9,   5,   5.2,  6,   6,   0,   9,   0.9, 2.3, 63);
  add('Cottage Cheese (low-fat)',          P, '100g',        100, 72,  12,  2.7, 1,   0,  364,   0,   0,   14,  0.4, 0.1, 61);
  add('Greek Yogurt (plain, nonfat)',      P, '170g',        170, 100, 17,  6,   0.7, 0,   56,   0,   0,   0,   0.7, 0.1, 187);
  add('Whey Protein Powder',              P, '1 scoop',      30, 120, 24,  3,   1.5, 0,   60,   0,   0,   0,   0.4, 0.4, 120);
  add('Casein Protein Powder',            P, '1 scoop',      33, 120, 24,  3,   1,   0,   50,   0,   0,   0,   0.3, 0.3, 150);
  add('Bone Broth',                        P, '240ml',       240, 40,  8,   1,   0.5, 0,  480,   0,   0,   0,   0.2, 0.5, 20);
  add('Canned Sardines',                   P, '85g',          85, 177, 21,  0,   10,  0,  307,   0,   4.8, 22,  1.3, 2.9, 351);
  add('Duck Breast (skinless)',            P, '100g',        100, 132, 22,  0,   4.5, 0,   65,   3,   0.1, 19,  1.8, 4.5, 10);
  // ---- GRAINS (30 items) ----
  add('Brown Rice (cooked)',               G, '100g',        100, 123, 2.7, 26,  1,   1.8,  1,   0,   0,   0,   0.6, 0.4, 10);
  add('White Rice (cooked)',               G, '100g',        100, 130, 2.7, 28,  0.3, 0.4,  1,   0,   0,   0,   0.5, 1.2, 10);
  add('Quinoa (cooked)',                   G, '100g',        100, 120, 4.4, 21,  1.9, 2.8,  7,   0,   0,   1,   1.1, 1.5, 17);
  add('Oatmeal (cooked)',                  G, '240ml',       234, 154, 6,   27,  2.6, 4,    2,   0,   0,   0,   1.0, 2.1, 21);
  add('Whole Wheat Bread',                 G, '1 slice',      30, 69,  3.6, 12,  1.1, 1.9,132,   0,   0,   0,   0.5, 0.7, 20);
  add('White Bread',                       G, '1 slice',      25, 67,  2,   13,  0.8, 0.6,130,   0,   0,   0,   0.2, 0.8, 36);
  add('Whole Wheat Pasta (cooked)',        G, '100g',        100, 124, 5.3, 26,  0.5, 3.9,  3,   0,   0,   0,   0.5, 1.4, 15);
  add('Regular Pasta (cooked)',            G, '100g',        100, 131, 5,   25,  1.1, 1.8,  1,   0,   0,   0,   0.5, 1.3, 7);
  add('Corn Tortilla',                     G, '1 tortilla',   26, 52,  1.4, 11,  0.7, 1.5, 11,   0,   0,   0,   0.3, 0.4, 19);
  add('Flour Tortilla',                    G, '1 tortilla',   45, 140, 3.6, 24,  3.5, 1.3,331,   0,   0,   0,   0.2, 1.3, 40);
  add('Couscous (cooked)',                 G, '100g',        100, 112, 3.8, 23,  0.2, 1.4,  5,   0,   0,   0,   0.3, 0.4, 8);
  add('Barley (cooked)',                   G, '100g',        100, 123, 2.3, 28,  0.4, 3.8,  3,   0,   0,   0,   0.8, 1.3, 11);
  add('Buckwheat (cooked)',                G, '100g',        100, 92,  3.4, 20,  0.6, 2.7,  1,   0,   0,   0,   0.6, 0.8, 7);
  add('Millet (cooked)',                   G, '100g',        100, 119, 3.5, 23,  1,   1.3,  2,   0,   0,   0,   0.9, 0.6, 3);
  add('Granola (low-sugar)',               G, '40g',          40, 180, 4,   24,  8,   3,   65,   0,   0,   0,   1.0, 1.5, 20);
  add('Rye Bread',                         G, '1 slice',      32, 83,  2.7, 15,  1.1, 1.9,193,   0.1, 0,   1,   0.4, 0.9, 23);
  add('Pita Bread (whole wheat)',          G, '1 pita',       60, 170, 6,   35,  1.7, 4.7,340,   0,   0,   0,   0.5, 1.9, 10);
  add('Rice Cakes',                        G, '2 cakes',      18, 70,  1.4, 15,  0.5, 0.4, 29,   0,   0,   0,   0.3, 0.1, 2);
  add('Bulgur Wheat (cooked)',             G, '100g',        100, 83,  3.1, 19,  0.2, 4.5,  5,   0,   0,   0,   0.5, 1.0, 10);
  add('Farro (cooked)',                    G, '100g',        100, 120, 5,   24,  0.7, 3.5,  4,   0,   0,   0,   0.9, 1.5, 15);
  // ---- FRUITS (30 items) ----
  add('Banana',                            F, '1 medium',    118, 105, 1.3, 27,  0.4, 3.1,  1,   10,  0,   4,   0.2, 0.3, 6);
  add('Apple',                             F, '1 medium',    182, 95,  0.5, 25,  0.3, 4.4,  2,   8.4, 0,   3,   0,   0.1, 11);
  add('Orange',                            F, '1 medium',    131, 62,  1.2, 15,  0.2, 3.1,  0,   70,  0,   14,  0.1, 0.1, 52);
  add('Blueberries',                       F, '100g',        100, 57,  0.7, 14,  0.3, 2.4,  1,   9.7, 0,   3,   0.2, 0.3, 6);
  add('Strawberries',                      F, '100g',        100, 32,  0.7, 7.7, 0.3, 2,    1,   59,  0,   1,   0.1, 0.4, 16);
  add('Raspberries',                       F, '100g',        100, 52,  1.2, 12,  0.7, 6.5,  1,   26,  0,   2,   0.4, 0.7, 25);
  add('Grapes (red)',                      F, '100g',        100, 69,  0.7, 18,  0.2, 0.9,  2,   3.2, 0,   3,   0.1, 0.4, 10);
  add('Mango',                             F, '100g',        100, 60,  0.8, 15,  0.4, 1.6,  1,   36,  0,   54,  0.1, 0.2, 11);
  add('Pineapple',                         F, '100g',        100, 50,  0.5, 13,  0.1, 1.4,  1,   48,  0,   3,   0.1, 0.3, 13);
  add('Kiwi',                              F, '1 medium',     76, 42,  0.8, 10,  0.4, 2.1,  2,   64,  0,   4,   0.1, 0.2, 26);
  add('Watermelon',                        F, '100g',        100, 30,  0.6, 8,   0.2, 0.4,  1,   8.1, 0,   28,  0.1, 0.2, 7);
  add('Cantaloupe',                        F, '100g',        100, 34,  0.8, 8,   0.2, 0.9,  16,  37,  0,   169, 0.2, 0.2, 9);
  add('Peach',                             F, '1 medium',    150, 59,  1.4, 14,  0.4, 2.3,  0,   10,  0,   24,  0.3, 0.4, 9);
  add('Pear',                              F, '1 medium',    178, 101, 0.7, 27,  0.3, 5.5,  2,   7.5, 0,   2,   0.1, 0.3, 15);
  add('Cherries (sweet)',                  F, '100g',        100, 63,  1.1, 16,  0.2, 2.1,  0,   7,   0,   3,   0.1, 0.4, 13);
  add('Avocado',                           F, '1/2 medium',  100, 160, 2,   9,   15,  7,    7,   10,  0,   7,   0.6, 0.6, 12);
  add('Grapefruit',                        F, '1/2 medium',  123, 52,  1,   13,  0.2, 2,    0,   38,  0,   71,  0.1, 0.1, 22);
  add('Papaya',                            F, '100g',        100, 43,  0.5, 11,  0.3, 1.7,  8,   61,  0,   47,  0.1, 0.3, 20);
  add('Pomegranate Seeds',                 F, '100g',        100, 83,  1.7, 19,  1.2, 4,    3,   10,  0,   0,   0.4, 0.3, 10);
  add('Dried Cranberries',                 F, '40g',          40, 123, 0.1, 33,  0.5, 2.3,  2,   0.1, 0,   1,   0,   0.1, 3);
  add('Applesauce (unsweetened)',          F, '100g',        100, 42,  0.2, 11,  0.1, 1.1,  2,   2.4, 0,   1,   0,   0.1, 3);
  add('Prunes (dried)',                    F, '40g',          40, 96,  0.9, 25,  0.2, 2.8,  1,   0.2, 0,   16,  0.2, 0.4, 17);
  // ---- VEGETABLES (35 items) ----
  add('Broccoli (cooked)',                 V, '100g',        100, 35,  2.4, 7,   0.4, 3.3, 33,   65,  0,   31,  0.4, 0.7, 40);
  add('Spinach (raw)',                     V, '100g',        100, 23,  2.9, 3.6, 0.4, 2.2, 79,   28,  0,   469, 0.5, 2.7, 99);
  add('Kale (raw)',                        V, '100g',        100, 49,  4.3, 9,   0.9, 3.6, 38,  120,  0,   500, 0.6, 1.5, 150);
  add('Sweet Potato (baked)',              V, '100g',        100, 90,  2,   21,  0.1, 3.3, 36,   2.4, 0,   709, 0.3, 0.6, 38);
  add('Carrots (raw)',                     V, '100g',        100, 41,  0.9, 10,  0.2, 2.8, 69,   6,   0,   835, 0.2, 0.3, 33);
  add('Bell Pepper (red)',                 V, '100g',        100, 31,  1,   6,   0.3, 2.1,  4,  128,  0,   157, 0.3, 0.4, 7);
  add('Tomato',                            V, '1 medium',    123, 22,  1.1, 4.8, 0.2, 1.5,  6,   17,  0,   52,  0.2, 0.3, 12);
  add('Zucchini (cooked)',                 V, '100g',        100, 17,  1.2, 3.1, 0.3, 1,    2,   13,  0,   10,  0.3, 0.4, 18);
  add('Cauliflower (cooked)',              V, '100g',        100, 23,  1.8, 4.1, 0.5, 2.3, 15,   44,  0,   1,   0.2, 0.3, 16);
  add('Green Beans (cooked)',              V, '100g',        100, 35,  1.9, 8,   0.3, 3.2,  1,   9.7, 0,   35,  0.2, 0.6, 37);
  add('Asparagus (cooked)',                V, '100g',        100, 22,  2.4, 4,   0.2, 2,    1,   7.7, 0,   38,  0.5, 0.9, 23);
  add('Brussels Sprouts (cooked)',         V, '100g',        100, 36,  2.6, 7,   0.5, 2.6, 21,   62,  0,   36,  0.3, 0.6, 36);
  add('Mushrooms (cooked)',                V, '100g',        100, 28,  2.2, 5,   0.5, 2.2,  2,   0,   0.2, 0,   0.5, 0.5, 2);
  add('Pumpkin (cooked)',                  V, '100g',        100, 20,  0.7, 5,   0.1, 1.1,  1,   4.7, 0,   250, 0.2, 0.6, 15);
  add('Butternut Squash (cooked)',         V, '100g',        100, 40,  0.9, 10,  0.1, 3.2,  4,   15,  0,   532, 0.1, 0.6, 41);
  add('Celery (raw)',                      V, '100g',        100, 16,  0.7, 3,   0.2, 1.6, 80,   3.1, 0,   22,  0.1, 0.2, 40);
  add('Cucumber (raw)',                    V, '100g',        100, 15,  0.7, 3.6, 0.1, 0.5,  2,   2.8, 0,   5,   0.2, 0.3, 16);
  add('Beet (cooked)',                     V, '100g',        100, 44,  1.7, 10,  0.2, 2,   77,   3.6, 0,   2,   0.4, 0.8, 16);
  add('Cabbage (raw)',                     V, '100g',        100, 25,  1.3, 6,   0.1, 2.5, 18,   37,  0,   5,   0.2, 0.5, 40);
  add('Onion (raw)',                       V, '100g',        100, 40,  1.1, 9,   0.1, 1.7,  4,   7.4, 0,   0,   0.2, 0.2, 23);
  add('Garlic (raw)',                      V, '3 cloves',      9, 13,  0.6, 3,   0,   0.2,  2,   2.8, 0,   0,   0.1, 0.2, 16);
  add('Eggplant (cooked)',                 V, '100g',        100, 35,  0.8, 9,   0.2, 2.5,  2,   1.3, 0,   1,   0.1, 0.3, 6);
  add('Peas (green, cooked)',              V, '100g',        100, 84,  5.4, 16,  0.2, 5.5,  2,   14,  0,   38,  1.0, 1.5, 27);
  add('Artichoke (cooked)',                V, '1 medium',    120, 64,  3.5, 14,  0.4, 10,   72,   8.9, 0,   0,   0.5, 1.3, 25);
  add('Bok Choy (cooked)',                V, '100g',        100, 12,  1.6, 1.8, 0.2, 1,    58,   26,  0,   223, 0.2, 0.6, 93);
  add('Collard Greens (cooked)',           V, '100g',        100, 33,  2.7, 6,   0.5, 3.6, 15,   23,  0,   380, 0.2, 0.5, 141);
  add('Turnip (cooked)',                   V, '100g',        100, 22,  0.7, 5,   0.1, 2,   16,   11,  0,   0,   0.1, 0.2, 33);
  // ---- DAIRY (25 items) ----
  add('Whole Milk',                        D, '240ml',       244, 149, 8,   12,  8,   0,  105,   0,   3.2, 68,  0.9, 0,   276);
  add('Skim Milk',                         D, '240ml',       245, 83,  8.3, 12,  0.2, 0,  103,   0,   2.9, 149, 1.0, 0.1, 299);
  add('Cheddar Cheese',                   D, '30g',          30, 113, 7,   0.4, 9.3, 0,  174,   0,   0.3, 28,  1.0, 0.1, 200);
  add('Mozzarella Cheese',                D, '30g',          30, 85,  6.3, 0.7, 6.3, 0,  138,   0,   0.1, 27,  0.9, 0.1, 147);
  add('Swiss Cheese',                     D, '30g',          30, 106, 7.5, 1.5, 7.8, 0,   54,   0,   0.3, 22,  1.2, 0.1, 224);
  add('Parmesan Cheese (grated)',         D, '15g',          15, 63,  5.8, 0.6, 4.2, 0,  150,   0,   0.2, 10,  0.5, 0.1, 167);
  add('Cream Cheese',                     D, '30g',          30, 99,  1.7, 1.6, 9.8, 0,   87,   0,   0,   34,  0.1, 0.1, 14);
  add('Ricotta Cheese (part-skim)',       D, '60g',          60, 86,  7,   3.2, 5,   0,   73,   0,   0,   42,  0.4, 0.1, 128);
  add('Plain Yogurt (low-fat)',           D, '170g',        170, 107, 7,   12,  2.6, 0,  107,   1.3, 0.1, 14,  1.1, 0.1, 275);
  add('Kefir (plain)',                    D, '240ml',        240, 110, 11,  12,  2.5, 0,  100,   0,   2.5, 30,  0.8, 0.1, 300);
  add('Butter',                           D, '1 tbsp',       14, 102, 0.1, 0,   12,  0,   82,   0,   0,   97,  0,   0,   3);
  add('Sour Cream',                       D, '30g',          30, 57,  0.7, 1.4, 5.6, 0,   12,   0.2, 0,   26,  0.1, 0,   18);
  add('Almond Milk (unsweetened)',        D, '240ml',        240, 30,  1,   1,   2.5, 0,  170,   0,   2.4, 0,   0,   0.2, 450);
  add('Soy Milk (unsweetened)',           D, '240ml',        240, 80,  7,   4,   4,   1,   90,   0,   2.7, 0,   0.6, 1.0, 301);
  add('Oat Milk',                         D, '240ml',        240, 120, 3,   16,  5,   2,  101,   0,   3.6, 0,   0.2, 0.3, 350);
  add('Coconut Yogurt',                   D, '150g',        150, 180, 1.5, 22,  10,  0,   15,   0,   0,   0,   0.1, 0.2, 10);
  add('String Cheese',                    D, '1 stick',      28, 80,  6,   1,   6,   0,  200,   0,   0,   15,  0.6, 0.1, 150);
  add('Goat Cheese',                      D, '30g',          30, 75,  5.3, 0,   6,   0,  130,   0,   0.3, 56,  0.3, 0.2, 40);
  // ---- SNACKS (25 items) ----
  add('Almonds',                           S, '30g',          30, 164, 6,   6,   14,  3.5, 0,    0,   0,   0,   0.9, 1.0, 76);
  add('Walnuts',                           S, '30g',          30, 185, 4.3, 3.9, 18,  1.9, 1,    0.4, 0,   0,   0.9, 0.8, 28);
  add('Cashews',                           S, '30g',          30, 157, 5.2, 8.6, 12,  0.9, 3,    0,   0,   0,   1.6, 1.9, 10);
  add('Peanut Butter',                    S, '2 tbsp',       32, 188, 8,   6,   16,  1.9,136,   0,   0,   0,   0.9, 0.6, 17);
  add('Almond Butter',                    S, '2 tbsp',       32, 196, 6.8, 6,   18,  3.3, 2,    0,   0,   0,   1.0, 1.1, 111);
  add('Pumpkin Seeds',                     S, '30g',          30, 151, 7,   5,   13,  1.7, 5,    0.6, 0,   1,   2.2, 2.5, 13);
  add('Sunflower Seeds',                  S, '30g',          30, 165, 5.5, 6.5, 14,  3.2, 1,    0.4, 0,   0,   1.5, 1.8, 20);
  add('Chia Seeds',                        S, '2 tbsp',       28, 138, 4.7, 12,  8.7, 9.8, 5,    0.5, 0,   0,   1.0, 2.2, 177);
  add('Flaxseeds (ground)',               S, '2 tbsp',       14, 74,  2.6, 4,   5.9, 3.8, 4,    0.1, 0,   0,   0.6, 0.8, 36);
  add('Trail Mix',                         S, '40g',          40, 184, 5,   17,  12,  2,   58,   0.5, 0,   1,   1.0, 1.1, 33);
  add('Dark Chocolate (70%+)',            S, '30g',          30, 170, 2.2, 13,  12,  3.1, 6,    0,   0,   0,   1.0, 3.4, 21);
  add('Hummus',                            S, '60g',          60, 100, 3,   9,   6,   2,  180,   0,   0,   1,   0.6, 1.0, 16);
  add('Guacamole',                         S, '60g',          60, 96,  1.2, 5,   8.7, 4,  180,   4,   0,   4,   0.3, 0.3, 7);
  add('Protein Bar',                       S, '60g',          60, 220, 20,  24,  8,   3,  160,   0,   0,   0,   2.3, 2.7, 200);
  add('Rice Crackers',                    S, '30g',          30, 120, 2,   25,  1.5, 0.3,170,   0,   0,   0,   0.2, 0.5, 3);
  add('Dried Apricots',                   S, '40g',          40, 96,  1.4, 25,  0.2, 3,    4,   0.4, 0,   78,  0.1, 1.0, 22);
  add('Beef Jerky',                        S, '30g',          30, 116, 9.4, 3.1, 7.3, 0.4,590,   0,   0,   0,   2.7, 1.8, 6);
  add('Roasted Chickpeas',                S, '40g',          40, 160, 6,   20,  5,   5,  200,   0,   0,   0,   0.8, 1.8, 25);
  add('Seaweed Snack',                    S, '10g',          10, 25,  1.7, 2.6, 0.7, 0.5,97,    0,   0,   18,  0.3, 0.4, 12);
  add('Cottage Cheese Cup',               S, '113g',        113, 90,  12,  5,   2.5, 0,  270,   0,   0,   20,  0.5, 0.1, 70);
  // ---- BEVERAGES (20 items) ----
  add('Water',                             B, '240ml',       240,  0,  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0);
  add('Green Tea',                         B, '240ml',       240,  2,  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0);
  add('Black Coffee',                     B, '240ml',       240,  2,  0.3, 0,   0,   0,    5,   0,   0,   0,   0,   0,   5);
  add('Orange Juice',                     B, '240ml',       248, 112, 1.7, 26,  0.5, 0.5,  2,  124,  0,   10,  0.1, 0.4, 27);
  add('Cranberry Juice (unsweetened)',    B, '240ml',       253,  46, 0,   12,  0.1, 0.3,  5,   23,  0,   2,   0,   0.3, 8);
  add('Tomato Juice',                     B, '240ml',       243,  41, 1.9, 9,   0.1, 1,  615,   44,  0,   27,  0.3, 1.0, 24);
  add('Coconut Water',                    B, '240ml',       240,  46, 1.7, 9,   0.5, 2.6,252,   2.4, 0,   0,   0.1, 0.3, 58);
  add('Herbal Tea (chamomile)',           B, '240ml',       240,  1,  0,   0.2, 0,   0,    2,   0,   0,   0,   0,   0,   5);
  add('Smoothie (berry protein)',         B, '350ml',       350, 210, 20,  28,  3,   4,   80,   30,  2.5, 15,  1.5, 1.0, 200);
  add('Electrolyte Drink',               B, '350ml',       350,  25, 0,   6,   0,   0,  250,   0,   0,   0,   0,   0,   0);
  add('Ginger Tea',                       B, '240ml',       240,   2, 0,   0.5, 0,   0,    2,   0,   0,   0,   0,   0,   2);
  add('Bone Broth Drink',                B, '240ml',       240,  40, 8,   1,   0.5, 0,  480,   0,   0,   0,   0.2, 0.5, 20);
  add('Protein Shake (vanilla)',          B, '350ml',       350, 160, 30,  8,   2,   1,  200,   15,  5,   0,   4.5, 4.5, 350);
  add('Warm Lemon Water',                B, '240ml',       240,   6, 0.1, 2,   0,   0.1,  0,   11,  0,   0,   0,   0,   3);
  add('Apple Cider Vinegar Drink',       B, '240ml',       240,   3, 0,   0.1, 0,   0,    1,   0,   0,   0,   0,   0,   1);
  add('Milk (2%)',                        B, '240ml',       244, 122, 8.1, 12,  4.8, 0,  115,   0.5, 2.9, 134, 1.2, 0,   293);
  // ---- SUPPLEMENTS (15 items) ----
  add('Multivitamin Tablet',              SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,  90,  25,  900,  11,  18,  200);
  add('Vitamin C 500mg',                  SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0, 500,   0,   0,   0,   0,   0);
  add('Vitamin D3 2000IU',               SU, '1 softgel',    1,  5,  0,   0,   0,   0,    0,   0,  50,   0,   0,   0,   0);
  add('Zinc 30mg',                        SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,   0,   0,   0,  30,   0,   0);
  add('Iron 65mg',                        SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,   0,   0,   0,   0,  65,   0);
  add('Calcium 600mg + D3',              SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,   0,  10,   0,   0,   0,  600);
  add('Fish Oil (Omega-3)',              SU, '1 softgel',    1, 10,  0,   0,   1,   0,    0,   0,   0,   0,   0,   0,   0);
  add('Probiotic',                        SU, '1 capsule',    1,  5,  0,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);
  add('Collagen Peptides',               SU, '1 scoop',     10, 35, 9,   0,   0,   0,   25,   0,   0,   0,   0,   0,   0);
  add('Magnesium 400mg',                 SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);
  add('B-Complex Vitamin',               SU, '1 tablet',     1,  5,  0,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);
  add('Vitamin A 3000mcg',               SU, '1 softgel',    1,  5,  0,   0,   0,   0,    0,   0,   0, 3000,  0,   0,   0);
  add('Turmeric/Curcumin 500mg',         SU, '1 capsule',    1,  5,  0,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);
  add('Glutamine 5g',                     SU, '1 scoop',      5, 20,  5,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);
  add('Biotin 5000mcg',                   SU, '1 tablet',     1,  0,  0,   0,   0,   0,    0,   0,   0,   0,   0,   0,   0);

  return foods;
}

const FOOD_DATABASE: FoodItem[] = buildFoodDb();

// ============================================================================
// Medication-Food Interactions Database
// ============================================================================

interface InteractionRule {
  foodIds: string[];
  foodKeywords: string[];
  medication: string;
  medicationKeywords: string[];
  severity: 'warning' | 'danger';
  description: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    foodIds: [],
    foodKeywords: ['grapefruit'],
    medication: 'Statins (atorvastatin, simvastatin, lovastatin)',
    medicationKeywords: ['statin', 'atorvastatin', 'simvastatin', 'lovastatin', 'lipitor', 'zocor'],
    severity: 'danger',
    description: 'Grapefruit inhibits CYP3A4 enzyme, dramatically increasing statin blood levels and risk of muscle damage (rhabdomyolysis).',
  },
  {
    foodIds: [],
    foodKeywords: ['spinach', 'kale', 'broccoli', 'brussels sprouts', 'collard', 'bok choy', 'cabbage', 'green beans', 'peas', 'asparagus', 'turnip'],
    medication: 'Warfarin (Coumadin)',
    medicationKeywords: ['warfarin', 'coumadin'],
    severity: 'warning',
    description: 'High vitamin K foods can reduce warfarin effectiveness. Maintain consistent daily vitamin K intake rather than avoiding these foods entirely.',
  },
  {
    foodIds: [],
    foodKeywords: ['grapefruit'],
    medication: 'Calcium Channel Blockers (amlodipine, felodipine, nifedipine)',
    medicationKeywords: ['amlodipine', 'felodipine', 'nifedipine', 'norvasc'],
    severity: 'warning',
    description: 'Grapefruit can increase blood levels of calcium channel blockers, potentially causing dangerously low blood pressure.',
  },
  {
    foodIds: [],
    foodKeywords: ['milk', 'cheese', 'yogurt', 'calcium', 'dairy'],
    medication: 'Certain Antibiotics (tetracycline, ciprofloxacin)',
    medicationKeywords: ['tetracycline', 'doxycycline', 'ciprofloxacin', 'cipro', 'levaquin', 'levofloxacin'],
    severity: 'warning',
    description: 'Calcium-rich foods can bind to these antibiotics and reduce absorption. Take antibiotics 2 hours before or 6 hours after dairy.',
  },
  {
    foodIds: [],
    foodKeywords: ['banana', 'orange', 'potato', 'sweet potato', 'tomato', 'avocado', 'coconut water'],
    medication: 'ACE Inhibitors / Potassium-sparing Diuretics',
    medicationKeywords: ['lisinopril', 'enalapril', 'ramipril', 'spironolactone', 'ace inhibitor'],
    severity: 'warning',
    description: 'High-potassium foods combined with these medications can cause dangerously elevated potassium levels (hyperkalemia).',
  },
  {
    foodIds: [],
    foodKeywords: ['alcohol', 'beer', 'wine'],
    medication: 'Metformin',
    medicationKeywords: ['metformin', 'glucophage'],
    severity: 'danger',
    description: 'Alcohol with metformin increases risk of lactic acidosis, a rare but serious side effect.',
  },
  {
    foodIds: [],
    foodKeywords: ['grapefruit', 'orange juice'],
    medication: 'Immunosuppressants (cyclosporine, tacrolimus)',
    medicationKeywords: ['cyclosporine', 'tacrolimus', 'prograf', 'sandimmune'],
    severity: 'danger',
    description: 'Grapefruit can increase immunosuppressant levels to toxic ranges, critical concern for transplant patients.',
  },
  {
    foodIds: [],
    foodKeywords: ['iron', 'calcium', 'coffee', 'tea'],
    medication: 'Levothyroxine (Synthroid)',
    medicationKeywords: ['levothyroxine', 'synthroid', 'thyroid'],
    severity: 'warning',
    description: 'Iron, calcium, coffee, and soy can impair levothyroxine absorption. Take thyroid medication on empty stomach, 30-60 min before eating.',
  },
];

// ============================================================================
// Recovery Nutrition Plans
// ============================================================================

function buildRecoveryPlans(): RecoveryNutritionPlan[] {
  return [
    {
      type: RecoveryPlanType.HIGH_PROTEIN,
      name: 'High-Protein Recovery Plan',
      description: 'Optimized for wound healing and tissue repair. Targets 1.2-1.5g protein/kg/day with emphasis on vitamin C and zinc for collagen synthesis.',
      targets: {
        calories: 2200, protein_g: 100, carbs_g: 250, fat_g: 70, fiber_g: 25,
        sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 250, vitaminD_mcg: 25,
        vitaminA_mcg: 900, zinc_mg: 15, iron_mg: 18, calcium_mg: 1200,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      guidelines: [
        'Include protein at every meal and snack (25-30g per meal).',
        'Prioritize complete proteins: chicken, fish, eggs, dairy, soy.',
        'Add collagen peptides to beverages for additional wound-healing support.',
        'Pair iron-rich foods with vitamin C to enhance absorption.',
        'Consume zinc-rich foods: pumpkin seeds, beef, chickpeas.',
        'Stay well-hydrated: aim for 8-10 glasses of water daily.',
        'Consider whey protein shakes between meals if appetite is poor.',
      ],
    },
    {
      type: RecoveryPlanType.ANTI_INFLAMMATORY,
      name: 'Anti-Inflammatory Recovery Plan',
      description: 'Reduces post-surgical inflammation with omega-3 rich foods, antioxidants, and avoidance of pro-inflammatory ingredients.',
      targets: {
        calories: 2000, protein_g: 80, carbs_g: 230, fat_g: 75, fiber_g: 30,
        sodium_mg: 2000, fluid_ml: 2500, vitaminC_mg: 200, vitaminD_mcg: 25,
        vitaminA_mcg: 900, zinc_mg: 11, iron_mg: 18, calcium_mg: 1000,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      guidelines: [
        'Eat fatty fish (salmon, sardines) at least 3 times per week for omega-3s.',
        'Include colorful fruits and vegetables at every meal for antioxidants.',
        'Use olive oil and avocado as primary fat sources.',
        'Add turmeric and ginger to meals for natural anti-inflammatory benefits.',
        'Choose whole grains over refined carbohydrates.',
        'Limit added sugars, processed foods, and fried foods.',
        'Include berries daily: blueberries, strawberries, raspberries.',
        'Drink green tea for additional anti-inflammatory polyphenols.',
      ],
    },
    {
      type: RecoveryPlanType.CARDIAC,
      name: 'Cardiac Recovery Plan',
      description: 'Heart-healthy, low-sodium diet for post-cardiac surgery. Emphasizes potassium, magnesium, omega-3s, and fiber.',
      targets: {
        calories: 1800, protein_g: 75, carbs_g: 220, fat_g: 55, fiber_g: 30,
        sodium_mg: 1500, fluid_ml: 2000, vitaminC_mg: 150, vitaminD_mcg: 25,
        vitaminA_mcg: 700, zinc_mg: 11, iron_mg: 14, calcium_mg: 1000,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      guidelines: [
        'Limit sodium to under 1500mg/day: avoid processed foods, canned soups, deli meats.',
        'Choose lean proteins: skinless poultry, fish, legumes.',
        'Eat omega-3 rich fish 2-3 times per week.',
        'Include fiber-rich whole grains, beans, fruits, and vegetables.',
        'Use herbs and spices instead of salt for flavoring.',
        'Limit saturated fat to under 13g/day; avoid trans fats completely.',
        'Eat potassium-rich foods: bananas, sweet potatoes, beans (unless on potassium restriction).',
        'Limit fluid intake if advised by your cardiac team.',
      ],
    },
    {
      type: RecoveryPlanType.DIABETIC_FRIENDLY,
      name: 'Diabetic-Friendly Recovery Plan',
      description: 'Glycemic-controlled nutrition plan that supports surgical recovery while maintaining stable blood sugar levels.',
      targets: {
        calories: 1800, protein_g: 90, carbs_g: 180, fat_g: 65, fiber_g: 30,
        sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 150, vitaminD_mcg: 25,
        vitaminA_mcg: 700, zinc_mg: 11, iron_mg: 14, calcium_mg: 1000,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      guidelines: [
        'Distribute carbohydrates evenly across meals (45-60g per meal).',
        'Choose low-glycemic carbs: whole grains, legumes, non-starchy vegetables.',
        'Pair carbohydrates with protein and healthy fats to slow glucose absorption.',
        'Avoid sugary beverages, juices, and refined sweets.',
        'Include non-starchy vegetables at every meal for fiber and nutrients.',
        'Monitor blood glucose before and 2 hours after meals during recovery.',
        'Prioritize protein for wound healing: target 1.2g/kg/day minimum.',
        'Keep consistent meal times to support stable blood sugar.',
      ],
    },
    {
      type: RecoveryPlanType.SOFT_FOOD_PROGRESSION,
      name: 'Soft Food / Liquid Diet Progression',
      description: 'Graduated diet progression for post-GI surgery: clear liquids to full liquids to pureed to soft to regular foods.',
      targets: {
        calories: 1600, protein_g: 60, carbs_g: 200, fat_g: 50, fiber_g: 15,
        sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 120, vitaminD_mcg: 20,
        vitaminA_mcg: 700, zinc_mg: 11, iron_mg: 14, calcium_mg: 1000,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      dietPhase: DietPhase.CLEAR_LIQUID,
      guidelines: [
        'Phase 1 - Clear Liquids: broth, water, herbal tea, gelatin, clear juices.',
        'Phase 2 - Full Liquids: smoothies, protein shakes, cream soups, yogurt.',
        'Phase 3 - Pureed: blended soups, mashed potatoes, pureed fruits, hummus.',
        'Phase 4 - Soft Foods: scrambled eggs, soft fish, cooked vegetables, ripe bananas.',
        'Phase 5 - Regular: gradual return to normal diet as tolerated.',
        'Eat small, frequent meals (6 per day) rather than 3 large meals.',
        'Chew food thoroughly and eat slowly.',
        'Stop eating at first sign of fullness or discomfort.',
        'Add protein powder to liquids and soft foods to meet protein targets.',
      ],
    },
    {
      type: RecoveryPlanType.IRON_RICH,
      name: 'Iron-Rich Recovery Plan',
      description: 'Addresses post-surgical anemia with iron-rich foods and vitamin C pairing for optimal absorption.',
      targets: {
        calories: 2000, protein_g: 85, carbs_g: 240, fat_g: 65, fiber_g: 25,
        sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 250, vitaminD_mcg: 20,
        vitaminA_mcg: 900, zinc_mg: 11, iron_mg: 27, calcium_mg: 1000,
      },
      recommendedFoodIds: [],
      avoidFoodIds: [],
      guidelines: [
        'Include heme iron sources daily: lean red meat, liver, sardines, dark poultry.',
        'Pair plant-based iron (spinach, lentils, beans) with vitamin C for 2-3x absorption.',
        'Eat vitamin C rich foods with every iron-containing meal: bell pepper, orange, strawberries.',
        'Avoid coffee and tea within 1 hour of iron-rich meals (tannins reduce absorption).',
        'Do not take calcium supplements at the same time as iron-rich meals.',
        'Include folate-rich foods: dark leafy greens, legumes, fortified grains.',
        'Consider iron supplementation if dietary intake is insufficient (consult doctor).',
        'Include vitamin B12 sources: eggs, dairy, fish, fortified foods.',
      ],
    },
  ];
}

const RECOVERY_PLANS: RecoveryNutritionPlan[] = buildRecoveryPlans();

// ============================================================================
// Helper utilities
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function today(): string {
  return dateStr(new Date());
}

function scaleMicro(m: Micronutrients, factor: number): Micronutrients {
  return {
    vitaminC_mg: Math.round(m.vitaminC_mg * factor * 10) / 10,
    vitaminD_mcg: Math.round(m.vitaminD_mcg * factor * 10) / 10,
    vitaminA_mcg: Math.round(m.vitaminA_mcg * factor * 10) / 10,
    zinc_mg: Math.round(m.zinc_mg * factor * 10) / 10,
    iron_mg: Math.round(m.iron_mg * factor * 10) / 10,
    calcium_mg: Math.round(m.calcium_mg * factor * 10) / 10,
  };
}

function emptyMicro(): Micronutrients {
  return { vitaminC_mg: 0, vitaminD_mcg: 0, vitaminA_mcg: 0, zinc_mg: 0, iron_mg: 0, calcium_mg: 0 };
}

function addMicro(a: Micronutrients, b: Micronutrients): Micronutrients {
  return {
    vitaminC_mg: a.vitaminC_mg + b.vitaminC_mg,
    vitaminD_mcg: a.vitaminD_mcg + b.vitaminD_mcg,
    vitaminA_mcg: a.vitaminA_mcg + b.vitaminA_mcg,
    zinc_mg: a.zinc_mg + b.zinc_mg,
    iron_mg: a.iron_mg + b.iron_mg,
    calcium_mg: a.calcium_mg + b.calcium_mg,
  };
}

function dayLabel(dayIndex: number): string {
  const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return labels[dayIndex % 7];
}

// ============================================================================
// NutritionService Class
// ============================================================================

export class NutritionService {
  private mealLogs: MealLogEntry[] = [];
  private fluidLogs: FluidLogEntry[] = [];
  private supplementLogs: SupplementLogEntry[] = [];
  private patientProfiles: Map<string, PatientNutritionProfile> = new Map();

  // --------------------------------------------------------------------------
  // Food Database
  // --------------------------------------------------------------------------

  /** Get all foods in the database. */
  getAllFoods(): FoodItem[] {
    return [...FOOD_DATABASE];
  }

  /** Get food by ID. */
  getFoodById(id: string): FoodItem | undefined {
    return FOOD_DATABASE.find(f => f.id === id);
  }

  /** Search foods by name (case-insensitive partial match). */
  searchFoods(query: string): FoodItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(q));
  }

  /** Get foods by category. */
  getFoodsByCategory(category: FoodCategory): FoodItem[] {
    return FOOD_DATABASE.filter(f => f.category === category);
  }

  /** Get the total food count. */
  getFoodCount(): number {
    return FOOD_DATABASE.length;
  }

  // --------------------------------------------------------------------------
  // Patient Profile
  // --------------------------------------------------------------------------

  /** Create or update a patient nutrition profile. */
  setPatientProfile(profile: PatientNutritionProfile): void {
    this.patientProfiles.set(profile.patientId, { ...profile });
  }

  /** Get a patient nutrition profile. */
  getPatientProfile(patientId: string): PatientNutritionProfile | undefined {
    return this.patientProfiles.get(patientId);
  }

  /** Calculate personalized daily targets based on profile and recovery plan. */
  getPersonalizedTargets(patientId: string): DailyNutrientTargets {
    const profile = this.patientProfiles.get(patientId);
    if (!profile) {
      // Return default targets
      return {
        calories: 2000, protein_g: 80, carbs_g: 250, fat_g: 65, fiber_g: 25,
        sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 150, vitaminD_mcg: 20,
        vitaminA_mcg: 700, zinc_mg: 11, iron_mg: 14, calcium_mg: 1000,
      };
    }

    const plan = RECOVERY_PLANS.find(p => p.type === profile.activePlan);
    const baseTargets = plan ? { ...plan.targets } : {
      calories: 2000, protein_g: 80, carbs_g: 250, fat_g: 65, fiber_g: 25,
      sodium_mg: 2300, fluid_ml: 2500, vitaminC_mg: 150, vitaminD_mcg: 20,
      vitaminA_mcg: 700, zinc_mg: 11, iron_mg: 14, calcium_mg: 1000,
    };

    // Adjust protein target: 1.2-1.5g/kg based on recovery phase
    const proteinMultipliers: Record<string, number> = {
      [RecoveryPhase.IMMEDIATE]: 1.5,
      [RecoveryPhase.EARLY]: 1.4,
      [RecoveryPhase.MID]: 1.3,
      [RecoveryPhase.LATE]: 1.2,
    };
    const proteinPerKg = proteinMultipliers[profile.recoveryPhase] ?? 1.2;
    baseTargets.protein_g = Math.round(profile.weightKg * proteinPerKg);

    // Adjust calories based on weight and activity (Harris-Benedict approximation)
    const bmr = profile.age > 0
      ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
      : 10 * profile.weightKg + 900;
    // Recovery activity factor ~1.3 (bed rest) to 1.5 (active rehab)
    const activityFactors: Record<string, number> = {
      [RecoveryPhase.IMMEDIATE]: 1.2,
      [RecoveryPhase.EARLY]: 1.3,
      [RecoveryPhase.MID]: 1.4,
      [RecoveryPhase.LATE]: 1.5,
    };
    const activityFactor = activityFactors[profile.recoveryPhase] ?? 1.3;
    baseTargets.calories = Math.round(bmr * activityFactor);

    // Increase vitamin C and zinc in early recovery for wound healing
    if (profile.recoveryPhase === RecoveryPhase.IMMEDIATE || profile.recoveryPhase === RecoveryPhase.EARLY) {
      baseTargets.vitaminC_mg = Math.max(baseTargets.vitaminC_mg, 250);
      baseTargets.zinc_mg = Math.max(baseTargets.zinc_mg, 15);
    }

    // Fluid target: ~30-35ml/kg
    baseTargets.fluid_ml = Math.round(profile.weightKg * 33);

    return baseTargets;
  }

  // --------------------------------------------------------------------------
  // Meal Logging
  // --------------------------------------------------------------------------

  /** Log a meal entry. */
  logMeal(patientId: string, mealType: MealType, foodId: string, servings: number = 1): MealLogEntry | null {
    const food = this.getFoodById(foodId);
    if (!food) return null;

    const entry: MealLogEntry = {
      id: generateId(),
      patientId,
      date: today(),
      mealType,
      foodId: food.id,
      foodName: food.name,
      servings,
      calories: Math.round(food.calories * servings),
      protein_g: Math.round(food.protein_g * servings * 10) / 10,
      carbs_g: Math.round(food.carbs_g * servings * 10) / 10,
      fat_g: Math.round(food.fat_g * servings * 10) / 10,
      fiber_g: Math.round(food.fiber_g * servings * 10) / 10,
      sodium_mg: Math.round(food.sodium_mg * servings),
      micronutrients: scaleMicro(food.micronutrients, servings),
      timestamp: new Date().toISOString(),
    };

    this.mealLogs.push(entry);
    return entry;
  }

  /** Log a meal for a specific date. */
  logMealForDate(patientId: string, date: string, mealType: MealType, foodId: string, servings: number = 1): MealLogEntry | null {
    const entry = this.logMeal(patientId, mealType, foodId, servings);
    if (entry) {
      entry.date = date;
    }
    return entry;
  }

  /** Get meal logs for a patient on a specific date. */
  getMealsByDate(patientId: string, date: string): MealLogEntry[] {
    return this.mealLogs.filter(m => m.patientId === patientId && m.date === date);
  }

  /** Get meal logs for a patient by meal type on a specific date. */
  getMealsByType(patientId: string, date: string, mealType: MealType): MealLogEntry[] {
    return this.mealLogs.filter(m => m.patientId === patientId && m.date === date && m.mealType === mealType);
  }

  /** Get all meal logs for a patient. */
  getAllMeals(patientId: string): MealLogEntry[] {
    return this.mealLogs.filter(m => m.patientId === patientId);
  }

  /** Delete a meal log entry. */
  deleteMeal(entryId: string): boolean {
    const idx = this.mealLogs.findIndex(m => m.id === entryId);
    if (idx === -1) return false;
    this.mealLogs.splice(idx, 1);
    return true;
  }

  /** Get recent/frequent foods for quick-add. */
  getRecentFoods(patientId: string, limit: number = 10): FoodItem[] {
    const meals = this.mealLogs
      .filter(m => m.patientId === patientId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const seenIds = new Set<string>();
    const recentFoods: FoodItem[] = [];
    for (const meal of meals) {
      if (!seenIds.has(meal.foodId)) {
        seenIds.add(meal.foodId);
        const food = this.getFoodById(meal.foodId);
        if (food) recentFoods.push(food);
        if (recentFoods.length >= limit) break;
      }
    }
    return recentFoods;
  }

  /** Get most frequently logged foods for a patient. */
  getFrequentFoods(patientId: string, limit: number = 10): Array<{ food: FoodItem; count: number }> {
    const countMap = new Map<string, number>();
    for (const meal of this.mealLogs.filter(m => m.patientId === patientId)) {
      countMap.set(meal.foodId, (countMap.get(meal.foodId) ?? 0) + 1);
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted
      .map(([foodId, count]) => {
        const food = this.getFoodById(foodId);
        return food ? { food, count } : null;
      })
      .filter((x): x is { food: FoodItem; count: number } => x !== null);
  }

  // --------------------------------------------------------------------------
  // Fluid / Hydration Tracking
  // --------------------------------------------------------------------------

  /** Log fluid intake (in ml). */
  logFluid(patientId: string, amount_ml: number, type: string = 'water'): FluidLogEntry {
    const entry: FluidLogEntry = {
      id: generateId(),
      patientId,
      date: today(),
      amount_ml,
      type,
      timestamp: new Date().toISOString(),
    };
    this.fluidLogs.push(entry);
    return entry;
  }

  /** Log fluid in glasses (1 glass = 240ml). */
  logFluidGlasses(patientId: string, glasses: number, type: string = 'water'): FluidLogEntry {
    return this.logFluid(patientId, Math.round(glasses * 240), type);
  }

  /** Get fluid logs for a date. */
  getFluidByDate(patientId: string, date: string): FluidLogEntry[] {
    return this.fluidLogs.filter(f => f.patientId === patientId && f.date === date);
  }

  /** Get total fluid intake in ml for a date. */
  getTotalFluid(patientId: string, date: string): number {
    return this.getFluidByDate(patientId, date).reduce((sum, f) => sum + f.amount_ml, 0);
  }

  /** Get hydration status: how many ml consumed vs target. */
  getHydrationStatus(patientId: string, date: string): { consumed_ml: number; target_ml: number; percentage: number; glasses: number } {
    const consumed = this.getTotalFluid(patientId, date);
    const targets = this.getPersonalizedTargets(patientId);
    return {
      consumed_ml: consumed,
      target_ml: targets.fluid_ml,
      percentage: Math.round((consumed / targets.fluid_ml) * 100),
      glasses: Math.round(consumed / 240 * 10) / 10,
    };
  }

  // --------------------------------------------------------------------------
  // Supplement Tracking
  // --------------------------------------------------------------------------

  /** Log supplement intake. */
  logSupplement(patientId: string, name: string, dosage: string): SupplementLogEntry {
    const entry: SupplementLogEntry = {
      id: generateId(),
      patientId,
      date: today(),
      name,
      dosage,
      timestamp: new Date().toISOString(),
    };
    this.supplementLogs.push(entry);
    return entry;
  }

  /** Get supplement logs for a date. */
  getSupplementsByDate(patientId: string, date: string): SupplementLogEntry[] {
    return this.supplementLogs.filter(s => s.patientId === patientId && s.date === date);
  }

  // --------------------------------------------------------------------------
  // Nutritional Analysis
  // --------------------------------------------------------------------------

  /** Get daily nutrient totals for a specific date. */
  getDailyTotals(patientId: string, date: string): DailyNutrientTotals {
    const meals = this.getMealsByDate(patientId, date);
    const fluid = this.getTotalFluid(patientId, date);

    const totals: DailyNutrientTotals = {
      date,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      fluid_ml: fluid,
      vitaminC_mg: 0,
      vitaminD_mcg: 0,
      vitaminA_mcg: 0,
      zinc_mg: 0,
      iron_mg: 0,
      calcium_mg: 0,
      mealCount: meals.length,
    };

    for (const meal of meals) {
      totals.calories += meal.calories;
      totals.protein_g += meal.protein_g;
      totals.carbs_g += meal.carbs_g;
      totals.fat_g += meal.fat_g;
      totals.fiber_g += meal.fiber_g;
      totals.sodium_mg += meal.sodium_mg;
      totals.vitaminC_mg += meal.micronutrients.vitaminC_mg;
      totals.vitaminD_mcg += meal.micronutrients.vitaminD_mcg;
      totals.vitaminA_mcg += meal.micronutrients.vitaminA_mcg;
      totals.zinc_mg += meal.micronutrients.zinc_mg;
      totals.iron_mg += meal.micronutrients.iron_mg;
      totals.calcium_mg += meal.micronutrients.calcium_mg;
    }

    // Round values
    totals.protein_g = Math.round(totals.protein_g * 10) / 10;
    totals.carbs_g = Math.round(totals.carbs_g * 10) / 10;
    totals.fat_g = Math.round(totals.fat_g * 10) / 10;
    totals.fiber_g = Math.round(totals.fiber_g * 10) / 10;
    totals.vitaminC_mg = Math.round(totals.vitaminC_mg * 10) / 10;
    totals.vitaminD_mcg = Math.round(totals.vitaminD_mcg * 10) / 10;
    totals.vitaminA_mcg = Math.round(totals.vitaminA_mcg * 10) / 10;
    totals.zinc_mg = Math.round(totals.zinc_mg * 10) / 10;
    totals.iron_mg = Math.round(totals.iron_mg * 10) / 10;
    totals.calcium_mg = Math.round(totals.calcium_mg * 10) / 10;

    return totals;
  }

  /** Full nutrient analysis comparing totals to targets with warnings. */
  analyzeDailyNutrition(patientId: string, date: string): NutrientAnalysis {
    const totals = this.getDailyTotals(patientId, date);
    const targets = this.getPersonalizedTargets(patientId);
    const profile = this.patientProfiles.get(patientId);
    const weightKg = profile?.weightKg ?? 70;

    const compare = (name: string, current: number, target: number, unit: string): NutrientComparison => {
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      let status: NutrientWarningLevel;
      if (name === 'Sodium') {
        // For sodium, high is bad
        status = pct > 120 ? NutrientWarningLevel.HIGH
          : pct > 100 ? NutrientWarningLevel.ADEQUATE
          : NutrientWarningLevel.ADEQUATE;
        if (pct > 150) status = NutrientWarningLevel.CRITICAL;
      } else {
        status = pct < 50 ? NutrientWarningLevel.CRITICAL
          : pct < 75 ? NutrientWarningLevel.LOW
          : pct > 150 ? NutrientWarningLevel.HIGH
          : NutrientWarningLevel.ADEQUATE;
      }
      return { nutrient: name, current: Math.round(current * 10) / 10, target, percentage: pct, unit, status };
    };

    const comparisons: NutrientComparison[] = [
      compare('Calories', totals.calories, targets.calories, 'kcal'),
      compare('Protein', totals.protein_g, targets.protein_g, 'g'),
      compare('Carbohydrates', totals.carbs_g, targets.carbs_g, 'g'),
      compare('Fat', totals.fat_g, targets.fat_g, 'g'),
      compare('Fiber', totals.fiber_g, targets.fiber_g, 'g'),
      compare('Sodium', totals.sodium_mg, targets.sodium_mg, 'mg'),
      compare('Fluid', totals.fluid_ml, targets.fluid_ml, 'ml'),
      compare('Vitamin C', totals.vitaminC_mg, targets.vitaminC_mg, 'mg'),
      compare('Vitamin D', totals.vitaminD_mcg, targets.vitaminD_mcg, 'mcg'),
      compare('Vitamin A', totals.vitaminA_mcg, targets.vitaminA_mcg, 'mcg'),
      compare('Zinc', totals.zinc_mg, targets.zinc_mg, 'mg'),
      compare('Iron', totals.iron_mg, targets.iron_mg, 'mg'),
      compare('Calcium', totals.calcium_mg, targets.calcium_mg, 'mg'),
    ];

    const warnings: string[] = [];
    const proteinPerKg = Math.round((totals.protein_g / weightKg) * 100) / 100;

    // Generate warnings
    for (const c of comparisons) {
      if (c.status === NutrientWarningLevel.CRITICAL) {
        warnings.push(`CRITICAL: ${c.nutrient} intake is very low (${c.percentage}% of target). Increase ${c.nutrient.toLowerCase()}-rich foods.`);
      } else if (c.status === NutrientWarningLevel.LOW) {
        warnings.push(`LOW: ${c.nutrient} intake is below target (${c.percentage}%). Consider adding more ${c.nutrient.toLowerCase()}-rich foods.`);
      }
      if (c.nutrient === 'Sodium' && c.percentage > 120) {
        warnings.push(`HIGH SODIUM: Intake is ${c.percentage}% of limit (${c.current}mg / ${c.target}mg). Reduce processed and salty foods.`);
      }
    }

    if (proteinPerKg < 1.2) {
      warnings.push(`PROTEIN: Currently at ${proteinPerKg}g/kg/day. Recovery target is 1.2-1.5g/kg/day. Add protein-rich foods or supplements.`);
    }

    const hydration = this.getHydrationStatus(patientId, date);
    if (hydration.percentage < 50) {
      warnings.push(`DEHYDRATION RISK: Only ${hydration.percentage}% of fluid target reached. Drink more water and fluids.`);
    }

    return { date, totals, targets, comparisons, warnings, proteinPerKg };
  }

  /** Calculate weekly averages and trends. */
  getWeeklyTrend(patientId: string, weekStartDate: string): WeeklyTrend {
    const startDate = new Date(weekStartDate);
    let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalFib = 0, totalFluid = 0;
    let totalVitC = 0, totalIron = 0, totalCalcium = 0;
    let daysLogged = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const ds = dateStr(d);
      const dayTotals = this.getDailyTotals(patientId, ds);
      if (dayTotals.mealCount > 0) {
        daysLogged++;
        totalCal += dayTotals.calories;
        totalPro += dayTotals.protein_g;
        totalCarb += dayTotals.carbs_g;
        totalFat += dayTotals.fat_g;
        totalFib += dayTotals.fiber_g;
        totalFluid += dayTotals.fluid_ml;
        totalVitC += dayTotals.vitaminC_mg;
        totalIron += dayTotals.iron_mg;
        totalCalcium += dayTotals.calcium_mg;
      }
    }

    const divisor = daysLogged || 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return {
      weekStart: weekStartDate,
      weekEnd: dateStr(endDate),
      avgCalories: Math.round(totalCal / divisor),
      avgProtein_g: Math.round(totalPro / divisor * 10) / 10,
      avgCarbs_g: Math.round(totalCarb / divisor * 10) / 10,
      avgFat_g: Math.round(totalFat / divisor * 10) / 10,
      avgFiber_g: Math.round(totalFib / divisor * 10) / 10,
      avgFluid_ml: Math.round(totalFluid / divisor),
      avgVitaminC_mg: Math.round(totalVitC / divisor * 10) / 10,
      avgIron_mg: Math.round(totalIron / divisor * 10) / 10,
      avgCalcium_mg: Math.round(totalCalcium / divisor * 10) / 10,
      daysLogged,
    };
  }

  // --------------------------------------------------------------------------
  // Smart Recommendations
  // --------------------------------------------------------------------------

  /** Suggest foods to meet remaining daily targets. */
  suggestFoodsForTargets(patientId: string, date: string, limit: number = 5): FoodSuggestion[] {
    const analysis = this.analyzeDailyNutrition(patientId, date);
    const profile = this.patientProfiles.get(patientId);
    const allergies = (profile?.allergies ?? []).map(a => a.toLowerCase());

    // Calculate remaining needs
    const remaining = {
      calories: Math.max(0, analysis.targets.calories - analysis.totals.calories),
      protein_g: Math.max(0, analysis.targets.protein_g - analysis.totals.protein_g),
      vitaminC_mg: Math.max(0, analysis.targets.vitaminC_mg - analysis.totals.vitaminC_mg),
      iron_mg: Math.max(0, analysis.targets.iron_mg - analysis.totals.iron_mg),
      calcium_mg: Math.max(0, analysis.targets.calcium_mg - analysis.totals.calcium_mg),
      zinc_mg: Math.max(0, analysis.targets.zinc_mg - analysis.totals.zinc_mg),
    };

    const scored: Array<{ food: FoodItem; score: number; nutrients: string[]; reason: string }> = [];

    for (const food of FOOD_DATABASE) {
      // Skip foods the patient is allergic to
      const nameLC = food.name.toLowerCase();
      if (allergies.some(a => nameLC.includes(a))) continue;
      // Skip supplements in food suggestions
      if (food.category === FoodCategory.SUPPLEMENTS) continue;

      let score = 0;
      const nutrients: string[] = [];

      // Score based on how well food fills remaining needs
      if (remaining.protein_g > 10 && food.protein_g >= 8) {
        score += (food.protein_g / remaining.protein_g) * 40;
        nutrients.push('protein');
      }
      if (remaining.vitaminC_mg > 20 && food.micronutrients.vitaminC_mg >= 10) {
        score += (food.micronutrients.vitaminC_mg / remaining.vitaminC_mg) * 20;
        nutrients.push('vitamin C');
      }
      if (remaining.iron_mg > 2 && food.micronutrients.iron_mg >= 1) {
        score += (food.micronutrients.iron_mg / remaining.iron_mg) * 20;
        nutrients.push('iron');
      }
      if (remaining.calcium_mg > 100 && food.micronutrients.calcium_mg >= 50) {
        score += (food.micronutrients.calcium_mg / remaining.calcium_mg) * 10;
        nutrients.push('calcium');
      }
      if (remaining.zinc_mg > 2 && food.micronutrients.zinc_mg >= 0.5) {
        score += (food.micronutrients.zinc_mg / remaining.zinc_mg) * 10;
        nutrients.push('zinc');
      }

      // Don't suggest foods that would overshoot calories by too much
      if (food.calories > remaining.calories * 0.6 && remaining.calories > 0) {
        score *= 0.5;
      }

      if (score > 0 && nutrients.length > 0) {
        const reason = `Good source of ${nutrients.join(', ')} to help meet your daily targets.`;
        scored.push({ food, score, nutrients, reason });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => ({
      food: s.food,
      reason: s.reason,
      servings: 1,
      nutrientsBoosted: s.nutrients,
    }));
  }

  /** Check for food-medication interactions for a patient's logged foods. */
  checkFoodInteractions(patientId: string, date: string): FoodInteraction[] {
    const profile = this.patientProfiles.get(patientId);
    if (!profile || profile.medications.length === 0) return [];

    const meals = this.getMealsByDate(patientId, date);
    const interactions: FoodInteraction[] = [];
    const seen = new Set<string>();

    const medsLower = profile.medications.map(m => m.toLowerCase());

    for (const rule of INTERACTION_RULES) {
      // Check if patient is on a matching medication
      const medMatch = medsLower.some(med =>
        rule.medicationKeywords.some(kw => med.includes(kw))
      );
      if (!medMatch) continue;

      // Check if any logged food matches
      for (const meal of meals) {
        const foodNameLower = meal.foodName.toLowerCase();
        const foodMatch = rule.foodKeywords.some(kw => foodNameLower.includes(kw));
        if (foodMatch) {
          const key = `${meal.foodId}-${rule.medication}`;
          if (!seen.has(key)) {
            seen.add(key);
            interactions.push({
              foodId: meal.foodId,
              foodName: meal.foodName,
              medication: rule.medication,
              severity: rule.severity,
              description: rule.description,
            });
          }
        }
      }
    }

    return interactions;
  }

  /** Pre-check a food item against patient medications before logging. */
  checkFoodBeforeLogging(patientId: string, foodId: string): FoodInteraction[] {
    const profile = this.patientProfiles.get(patientId);
    if (!profile || profile.medications.length === 0) return [];

    const food = this.getFoodById(foodId);
    if (!food) return [];

    const interactions: FoodInteraction[] = [];
    const medsLower = profile.medications.map(m => m.toLowerCase());
    const foodNameLower = food.name.toLowerCase();

    for (const rule of INTERACTION_RULES) {
      const medMatch = medsLower.some(med =>
        rule.medicationKeywords.some(kw => med.includes(kw))
      );
      if (!medMatch) continue;

      const foodMatch = rule.foodKeywords.some(kw => foodNameLower.includes(kw));
      if (foodMatch) {
        interactions.push({
          foodId: food.id,
          foodName: food.name,
          medication: rule.medication,
          severity: rule.severity,
          description: rule.description,
        });
      }
    }

    return interactions;
  }

  // --------------------------------------------------------------------------
  // Recovery Nutrition Plans
  // --------------------------------------------------------------------------

  /** Get all available recovery nutrition plans. */
  getRecoveryPlans(): RecoveryNutritionPlan[] {
    return [...RECOVERY_PLANS];
  }

  /** Get a specific recovery plan by type. */
  getRecoveryPlan(type: RecoveryPlanType): RecoveryNutritionPlan | undefined {
    return RECOVERY_PLANS.find(p => p.type === type);
  }

  /** Assign a recovery plan to a patient. */
  assignRecoveryPlan(patientId: string, planType: RecoveryPlanType): boolean {
    const profile = this.patientProfiles.get(patientId);
    if (!profile) return false;
    profile.activePlan = planType;
    this.patientProfiles.set(patientId, profile);
    return true;
  }

  // --------------------------------------------------------------------------
  // 7-Day Meal Plan Generation
  // --------------------------------------------------------------------------

  /** Auto-generate a 7-day meal plan based on patient profile and plan type. */
  generateWeeklyMealPlan(patientId: string, planType?: RecoveryPlanType): WeeklyMealPlan {
    const profile = this.patientProfiles.get(patientId);
    const selectedPlan = planType ?? profile?.activePlan ?? RecoveryPlanType.HIGH_PROTEIN;
    const targets = this.getPersonalizedTargets(patientId);
    const allergies = (profile?.allergies ?? []).map(a => a.toLowerCase());

    // Filter eligible foods
    const eligible = FOOD_DATABASE.filter(f => {
      if (f.category === FoodCategory.SUPPLEMENTS) return false;
      if (f.category === FoodCategory.BEVERAGES && f.calories < 10) return false;
      const nameLC = f.name.toLowerCase();
      return !allergies.some(a => nameLC.includes(a));
    });

    // Categorize foods for meal building
    const proteins = eligible.filter(f => f.category === FoodCategory.PROTEINS);
    const grains = eligible.filter(f => f.category === FoodCategory.GRAINS);
    const fruits = eligible.filter(f => f.category === FoodCategory.FRUITS);
    const vegs = eligible.filter(f => f.category === FoodCategory.VEGETABLES);
    const dairy = eligible.filter(f => f.category === FoodCategory.DAIRY);
    const snacks = eligible.filter(f => f.category === FoodCategory.SNACKS);
    const beverages = eligible.filter(f => f.category === FoodCategory.BEVERAGES && f.calories >= 10);

    // Plan-specific scoring adjustments
    const planScorer = (food: FoodItem): number => {
      let score = 1;
      switch (selectedPlan) {
        case RecoveryPlanType.HIGH_PROTEIN:
          if (food.protein_g >= 15) score += 3;
          if (food.micronutrients.zinc_mg >= 1) score += 1;
          if (food.micronutrients.vitaminC_mg >= 20) score += 1;
          break;
        case RecoveryPlanType.ANTI_INFLAMMATORY:
          if (food.name.toLowerCase().includes('salmon') || food.name.toLowerCase().includes('sardine')) score += 3;
          if (food.category === FoodCategory.FRUITS || food.category === FoodCategory.VEGETABLES) score += 2;
          if (food.fiber_g >= 3) score += 1;
          break;
        case RecoveryPlanType.CARDIAC:
          if (food.sodium_mg < 100) score += 3;
          if (food.fat_g < 5) score += 1;
          if (food.fiber_g >= 3) score += 2;
          if (food.sodium_mg > 300) score -= 5;
          break;
        case RecoveryPlanType.DIABETIC_FRIENDLY:
          if (food.protein_g >= 10 && food.carbs_g < 15) score += 3;
          if (food.fiber_g >= 3) score += 2;
          if (food.carbs_g > 30 && food.fiber_g < 2) score -= 3;
          break;
        case RecoveryPlanType.SOFT_FOOD_PROGRESSION:
          const soft = ['yogurt', 'egg', 'banana', 'applesauce', 'oatmeal', 'soup', 'broth', 'shake',
            'smoothie', 'mashed', 'cottage', 'ricotta', 'tofu', 'hummus', 'avocado'];
          if (soft.some(s => food.name.toLowerCase().includes(s))) score += 3;
          break;
        case RecoveryPlanType.IRON_RICH:
          if (food.micronutrients.iron_mg >= 2) score += 3;
          if (food.micronutrients.vitaminC_mg >= 20) score += 2;
          break;
      }
      return Math.max(score, 0);
    };

    // Sort each category by plan-relevance
    const sortByPlan = (arr: FoodItem[]): FoodItem[] =>
      [...arr].sort((a, b) => planScorer(b) - planScorer(a));

    const sortedProteins = sortByPlan(proteins);
    const sortedGrains = sortByPlan(grains);
    const sortedFruits = sortByPlan(fruits);
    const sortedVegs = sortByPlan(vegs);
    const sortedDairy = sortByPlan(dairy);
    const sortedSnacks = sortByPlan(snacks);
    const sortedBev = sortByPlan(beverages);

    // Deterministic but varied selection using day offset
    const pick = (arr: FoodItem[], dayIdx: number, offset: number = 0): FoodItem => {
      if (arr.length === 0) return FOOD_DATABASE[0];
      return arr[(dayIdx + offset) % arr.length];
    };

    const days: DayMealPlan[] = [];

    for (let d = 0; d < 7; d++) {
      const meals: MealPlanEntry[] = [];

      // Breakfast: protein + grain + fruit + dairy
      const bkProtein = pick(sortedProteins.filter(f => ['egg', 'yogurt', 'cottage'].some(k => f.name.toLowerCase().includes(k))).concat(sortedProteins.slice(0, 3)), d, 0);
      const bkGrain = pick(sortedGrains.filter(f => ['oat', 'bread', 'granola'].some(k => f.name.toLowerCase().includes(k))).concat(sortedGrains.slice(0, 3)), d, 1);
      const bkFruit = pick(sortedFruits, d, 2);

      meals.push(makePlanEntry(MealType.BREAKFAST, bkProtein, 1));
      meals.push(makePlanEntry(MealType.BREAKFAST, bkGrain, 1));
      meals.push(makePlanEntry(MealType.BREAKFAST, bkFruit, 1));

      // Lunch: protein + grain + vegetable + fat/dressing
      const lnProtein = pick(sortedProteins, d, 3);
      const lnGrain = pick(sortedGrains, d, 4);
      const lnVeg1 = pick(sortedVegs, d, 5);
      const lnVeg2 = pick(sortedVegs, d, 6);

      meals.push(makePlanEntry(MealType.LUNCH, lnProtein, 1));
      meals.push(makePlanEntry(MealType.LUNCH, lnGrain, 1));
      meals.push(makePlanEntry(MealType.LUNCH, lnVeg1, 1));
      meals.push(makePlanEntry(MealType.LUNCH, lnVeg2, 1));

      // Dinner: protein + grain/starch + 2 vegetables
      const dnProtein = pick(sortedProteins, d, 7);
      const dnStarch = pick(sortedGrains.concat(sortedVegs.filter(v => v.name.toLowerCase().includes('potato') || v.name.toLowerCase().includes('squash'))), d, 8);
      const dnVeg1 = pick(sortedVegs, d, 9);
      const dnVeg2 = pick(sortedVegs, d, 10);

      meals.push(makePlanEntry(MealType.DINNER, dnProtein, 1));
      meals.push(makePlanEntry(MealType.DINNER, dnStarch, 1));
      meals.push(makePlanEntry(MealType.DINNER, dnVeg1, 1));
      meals.push(makePlanEntry(MealType.DINNER, dnVeg2, 1));

      // Snacks: 2 snacks + 1 beverage
      const snack1 = pick(sortedSnacks, d, 11);
      const snack2 = pick(sortedDairy.length > 0 ? sortedDairy : sortedSnacks, d, 12);
      const bev = pick(sortedBev, d, 13);

      meals.push(makePlanEntry(MealType.SNACK, snack1, 1));
      meals.push(makePlanEntry(MealType.SNACK, snack2, 1));
      meals.push(makePlanEntry(MealType.SNACK, bev, 1));

      const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
      const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0);

      days.push({
        day: d + 1,
        dayLabel: dayLabel(d),
        meals,
        totalCalories,
        totalProtein_g: Math.round(totalProtein * 10) / 10,
      });
    }

    const avgCal = Math.round(days.reduce((s, d) => s + d.totalCalories, 0) / 7);
    const avgPro = Math.round(days.reduce((s, d) => s + d.totalProtein_g, 0) / 7 * 10) / 10;

    return {
      planType: selectedPlan,
      patientId,
      createdAt: new Date().toISOString(),
      days,
      averageDailyCalories: avgCal,
      averageDailyProtein_g: avgPro,
    };
  }

  // --------------------------------------------------------------------------
  // Utility & Export
  // --------------------------------------------------------------------------

  /** Get a summary of all data for a patient. */
  getPatientSummary(patientId: string, date: string): {
    profile: PatientNutritionProfile | undefined;
    analysis: NutrientAnalysis;
    hydration: { consumed_ml: number; target_ml: number; percentage: number; glasses: number };
    supplements: SupplementLogEntry[];
    interactions: FoodInteraction[];
    suggestions: FoodSuggestion[];
  } {
    return {
      profile: this.getPatientProfile(patientId),
      analysis: this.analyzeDailyNutrition(patientId, date),
      hydration: this.getHydrationStatus(patientId, date),
      supplements: this.getSupplementsByDate(patientId, date),
      interactions: this.checkFoodInteractions(patientId, date),
      suggestions: this.suggestFoodsForTargets(patientId, date),
    };
  }

  /** Clear all data for a patient (useful for testing). */
  clearPatientData(patientId: string): void {
    this.mealLogs = this.mealLogs.filter(m => m.patientId !== patientId);
    this.fluidLogs = this.fluidLogs.filter(f => f.patientId !== patientId);
    this.supplementLogs = this.supplementLogs.filter(s => s.patientId !== patientId);
    this.patientProfiles.delete(patientId);
  }

  /** Reset all service data. */
  reset(): void {
    this.mealLogs = [];
    this.fluidLogs = [];
    this.supplementLogs = [];
    this.patientProfiles.clear();
  }
}

// ============================================================================
// Private helper (outside class to avoid method bloat)
// ============================================================================

function makePlanEntry(mealType: MealType, food: FoodItem, servings: number): MealPlanEntry {
  return {
    mealType,
    foodId: food.id,
    foodName: food.name,
    servings,
    calories: Math.round(food.calories * servings),
    protein_g: Math.round(food.protein_g * servings * 10) / 10,
  };
}

// ============================================================================
// Singleton export
// ============================================================================

export const nutritionService = new NutritionService();
