/**
 * NutritionTracker - Nutrition logging component for recovery patients
 *
 * Features:
 * - Meal type selector (breakfast, lunch, dinner, snack)
 * - Food search input with dropdown results
 * - Recent/frequent foods quick-add buttons
 * - Water intake tracker (glass icons to tap)
 * - Daily macro summary bars (protein, carbs, fat vs targets)
 * - Protein target highlight (critical for wound healing)
 * - Calorie summary
 *
 * Uses Tailwind CSS, Lucide icons, and Framer Motion for animations.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Search,
  Plus,
  X,
  Droplets,
  GlassWater,
  Flame,
  Beef,
  Wheat,
  Egg,
  Clock,
  CheckCircle2,
  Star,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  servingSize: string;
}

interface LoggedFood {
  food: FoodItem;
  mealType: MealType;
  servings: number;
}

// ---------------------------------------------------------------------------
// Constants / Mock Data
// ---------------------------------------------------------------------------

const MEAL_TYPES: { id: MealType; label: string; icon: typeof UtensilsCrossed; time: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: Egg, time: 'Morning' },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed, time: 'Midday' },
  { id: 'dinner', label: 'Dinner', icon: UtensilsCrossed, time: 'Evening' },
  { id: 'snack', label: 'Snack', icon: Star, time: 'Anytime' },
];

const FOOD_DATABASE: FoodItem[] = [
  { id: 'chicken-breast', name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
  { id: 'salmon', name: 'Salmon (baked)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
  { id: 'eggs', name: 'Eggs (scrambled, 2 large)', calories: 182, protein: 12, carbs: 2, fat: 14, servingSize: '2 eggs' },
  { id: 'greek-yogurt', name: 'Greek Yogurt (plain)', calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: '170g' },
  { id: 'brown-rice', name: 'Brown Rice (cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: '1 cup' },
  { id: 'sweet-potato', name: 'Sweet Potato (baked)', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: '1 medium' },
  { id: 'broccoli', name: 'Broccoli (steamed)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: '1 cup' },
  { id: 'banana', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: '1 medium' },
  { id: 'oatmeal', name: 'Oatmeal (cooked)', calories: 154, protein: 5, carbs: 27, fat: 2.6, servingSize: '1 cup' },
  { id: 'almonds', name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: '1 oz (23 almonds)' },
  { id: 'cottage-cheese', name: 'Cottage Cheese (low-fat)', calories: 163, protein: 28, carbs: 6, fat: 2.3, servingSize: '1 cup' },
  { id: 'whole-wheat-toast', name: 'Whole Wheat Toast', calories: 69, protein: 3.6, carbs: 12, fat: 1, servingSize: '1 slice' },
  { id: 'protein-shake', name: 'Protein Shake', calories: 120, protein: 24, carbs: 3, fat: 1, servingSize: '1 scoop + water' },
  { id: 'avocado', name: 'Avocado', calories: 240, protein: 3, carbs: 13, fat: 22, servingSize: '1 medium' },
  { id: 'spinach-salad', name: 'Spinach Salad', calories: 40, protein: 3, carbs: 4, fat: 1, servingSize: '2 cups' },
  { id: 'turkey-sandwich', name: 'Turkey Sandwich', calories: 320, protein: 22, carbs: 34, fat: 10, servingSize: '1 sandwich' },
  { id: 'bone-broth', name: 'Bone Broth', calories: 40, protein: 8, carbs: 1, fat: 0.5, servingSize: '1 cup' },
  { id: 'lentil-soup', name: 'Lentil Soup', calories: 230, protein: 18, carbs: 40, fat: 1, servingSize: '1 cup' },
];

const RECENT_FOOD_IDS = ['chicken-breast', 'greek-yogurt', 'brown-rice', 'protein-shake', 'bone-broth'];
const FREQUENT_FOOD_IDS = ['eggs', 'oatmeal', 'banana', 'salmon', 'cottage-cheese'];

// Daily targets (recovery-oriented, high protein)
const DAILY_TARGETS = {
  calories: 2000,
  protein: 100, // grams - highlighted as critical for wound healing
  carbs: 250, // grams
  fat: 65, // grams
};

const WATER_TARGET = 8; // glasses

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMealTypeColor(mealType: MealType): string {
  const colors: Record<MealType, string> = {
    breakfast: 'bg-amber-100 text-amber-700 border-amber-200',
    lunch: 'bg-green-100 text-green-700 border-green-200',
    dinner: 'bg-blue-100 text-blue-700 border-blue-200',
    snack: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return colors[mealType];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MacroBar({
  label,
  current,
  target,
  color,
  icon: Icon,
  highlight,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  icon: typeof Beef;
  highlight?: boolean;
}) {
  const percentage = Math.min(100, (current / target) * 100);
  const isOver = current > target;

  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${highlight ? 'text-amber-600' : 'text-gray-500'}`} />
          <span className={`text-xs font-semibold ${highlight ? 'text-amber-700' : 'text-medical-text'}`}>
            {label}
          </span>
          {highlight && (
            <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
              Recovery Priority
            </span>
          )}
        </div>
        <span className={`text-xs font-mono font-bold ${isOver ? 'text-red-500' : 'text-medical-text'}`}>
          {Math.round(current)}
          <span className="text-gray-400 font-normal">/{target}g</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isOver ? 'bg-red-400' : color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function WaterGlass({
  index,
  filled,
  onClick,
}: {
  index: number;
  filled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className={`relative w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
        filled
          ? 'bg-sky-100 border-sky-400 text-sky-500'
          : 'bg-gray-50 border-gray-200 text-gray-300 hover:border-sky-300'
      }`}
      aria-label={`Glass ${index + 1}${filled ? ' (filled)' : ''}`}
    >
      <GlassWater className="w-5 h-5" />
      {filled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full"
        />
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NutritionTracker() {
  // State
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([]);
  const [waterCount, setWaterCount] = useState(3);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return FOOD_DATABASE.filter((food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ).slice(0, 6);
  }, [searchQuery]);

  // Computed totals
  const totals = useMemo(() => {
    return loggedFoods.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.food.calories * entry.servings,
        protein: acc.protein + entry.food.protein * entry.servings,
        carbs: acc.carbs + entry.food.carbs * entry.servings,
        fat: acc.fat + entry.food.fat * entry.servings,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [loggedFoods]);

  // Handlers
  const addFood = useCallback(
    (food: FoodItem) => {
      setLoggedFoods((prev) => [...prev, { food, mealType: selectedMeal, servings: 1 }]);
      setSearchQuery('');
      setIsSearchFocused(false);
    },
    [selectedMeal],
  );

  const removeFood = useCallback((index: number) => {
    setLoggedFoods((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleWater = useCallback((index: number) => {
    setWaterCount((prev) => (index + 1 <= prev ? index : index + 1));
  }, []);

  // Recent/frequent food items
  const recentFoods = FOOD_DATABASE.filter((f) => RECENT_FOOD_IDS.includes(f.id));
  const frequentFoods = FOOD_DATABASE.filter((f) => FREQUENT_FOOD_IDS.includes(f.id));

  const proteinPercentage = (totals.protein / DAILY_TARGETS.protein) * 100;
  const isProteinLow = proteinPercentage < 50;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-medical-text">Nutrition Tracker</h2>
            <p className="text-sm text-gray-500">Log your meals and track your recovery nutrition</p>
          </div>
        </div>
      </div>

      {/* Calorie Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-medical-text">Daily Summary</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-medical-text">
              {Math.round(totals.calories)}
            </span>
            <span className="text-sm text-gray-400 ml-1">/ {DAILY_TARGETS.calories} kcal</span>
          </div>
        </div>

        {/* Calorie progress */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              totals.calories > DAILY_TARGETS.calories ? 'bg-red-400' : 'bg-orange-400'
            }`}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (totals.calories / DAILY_TARGETS.calories) * 100)}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Protein alert */}
        <AnimatePresence>
          {isProteinLow && loggedFoods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Protein is critical for wound healing</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You've had {Math.round(totals.protein)}g of your {DAILY_TARGETS.protein}g target.
                  Consider adding high-protein foods like chicken, fish, or Greek yogurt.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Macro bars */}
        <div className="space-y-2">
          <MacroBar
            label="Protein"
            current={totals.protein}
            target={DAILY_TARGETS.protein}
            color="bg-rose-400"
            icon={Beef}
            highlight
          />
          <MacroBar
            label="Carbs"
            current={totals.carbs}
            target={DAILY_TARGETS.carbs}
            color="bg-amber-400"
            icon={Wheat}
          />
          <MacroBar
            label="Fat"
            current={totals.fat}
            target={DAILY_TARGETS.fat}
            color="bg-yellow-400"
            icon={Egg}
          />
        </div>
      </div>

      {/* Meal Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-medical-text mb-3">Meal Type</h3>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((meal) => {
            const isSelected = selectedMeal === meal.id;
            const Icon = meal.icon;
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => setSelectedMeal(meal.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-medical-primary/10 border-medical-primary text-medical-primary'
                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-medical-primary' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{meal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-medical-text mb-3">Add Food</h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for food..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />

          {/* Search dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
              >
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addFood(food)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-medical-text">{food.name}</p>
                      <p className="text-xs text-gray-400">{food.servingSize}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xs font-mono text-gray-600">{food.calories} kcal</p>
                        <p className="text-xs text-gray-400">{food.protein}g protein</p>
                      </div>
                      <Plus className="w-4 h-4 text-medical-primary" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick-add sections */}
        <div className="mt-4 space-y-3">
          {/* Recent */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Recent</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addFood(food)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-xs text-medical-text rounded-full border border-gray-100 hover:border-medical-primary/30 hover:bg-medical-primary/5 transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                  {food.name}
                </button>
              ))}
            </div>
          </div>

          {/* Frequent */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Frequently Logged</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {frequentFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addFood(food)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-xs text-medical-text rounded-full border border-gray-100 hover:border-medical-primary/30 hover:bg-medical-primary/5 transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                  {food.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logged Foods */}
      <AnimatePresence>
        {loggedFoods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-medical-text">
                Today's Food Log ({loggedFoods.length} items)
              </h3>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {loggedFoods.map((entry, index) => (
                <motion.div
                  key={`${entry.food.id}-${index}`}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getMealTypeColor(entry.mealType)}`}>
                    {entry.mealType}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-medical-text truncate">
                      {entry.food.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.food.calories} kcal | P: {entry.food.protein}g | C: {entry.food.carbs}g | F: {entry.food.fat}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFood(index)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    aria-label={`Remove ${entry.food.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Water Intake */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-semibold text-medical-text">Water Intake</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold font-mono text-sky-600">{waterCount}</span>
            <span className="text-sm text-gray-400">/ {WATER_TARGET} glasses</span>
            {waterCount >= WATER_TARGET && (
              <CheckCircle2 className="w-4 h-4 text-gamification-success ml-1" />
            )}
          </div>
        </div>

        {/* Water glasses */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: WATER_TARGET }, (_, i) => (
            <WaterGlass
              key={i}
              index={i}
              filled={i < waterCount}
              onClick={() => toggleWater(i)}
            />
          ))}
        </div>

        {/* Hydration encouragement */}
        <p className="text-xs text-center text-gray-400 mt-3">
          {waterCount < WATER_TARGET
            ? `${WATER_TARGET - waterCount} more glass${WATER_TARGET - waterCount === 1 ? '' : 'es'} to reach your goal. Hydration aids recovery!`
            : 'Great job staying hydrated today!'}
        </p>
      </div>
    </div>
  );
}
