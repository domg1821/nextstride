import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { GlowBackground, RunningSurfaceAccent, TrackLinesBackdrop } from "@/components/running-visuals";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import {
  AnimatedNumber,
  AnimatedProgressBar,
  AnimatedScoreRing,
  AnimatedTextField,
  BottomSheetModal,
  ExpandablePanel,
  InteractivePressable,
  SuccessBadge,
} from "@/components/ui-polish";
import { ScreenScroll, SectionTitle } from "@/components/ui-shell";
import { type FatigueLevel, type MealSlot, type ReusableFood, useEngine } from "@/contexts/engine-context";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useWorkouts } from "@/contexts/workout-context";
import { getEngineCards, getEngineDetailCopy, getSleepScoreValue } from "@/lib/engine-insights";
import { getFoodCategoryIcon, getFoodCategoryLabel, getFoodLibrarySections } from "@/lib/food-library";
import {
  getDailyFuelingSummary,
  getFoodEntriesForDate,
  type DailyFuelingSummary,
  type TrainingLoad,
} from "@/lib/fueling-tracker";
import { getUnifiedRecoveryState, type RecoveryMetric, type RecoveryState } from "@/lib/recovery-engine";

const CATEGORY_ORDER = ["sleep", "heart-rate", "fueling", "recovery"] as const;
const MEAL_ORDER: MealSlot[] = ["breakfast", "lunch", "dinner", "snacks"];

export default function EngineDetailScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const normalizedCategory = CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])
    ? (category as (typeof CATEGORY_ORDER)[number])
    : "sleep";
  const { colors } = useThemeColors();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();
  const { engine, updateEngine, addFoodLog, removeFoodLog } = useEngine();
  const [activeMeal, setActiveMeal] = useState<MealSlot | null>(null);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<ReusableFood | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [servingLabel, setServingLabel] = useState("");
  const [servings, setServings] = useState("1");
  const [foodNotes, setFoodNotes] = useState("");
  const [showMealSaved, setShowMealSaved] = useState(false);
  const card = getEngineCards(engine, workouts, profile).find((entry) => entry.key === normalizedCategory)!;
  const detail = getEngineDetailCopy(normalizedCategory, engine, workouts);
  const recovery = getUnifiedRecoveryState(engine, workouts);
  const todayDateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayFueling = useMemo(
    () => getDailyFuelingSummary(engine, workouts, todayDateKey),
    [engine, todayDateKey, workouts]
  );
  const dayEntries = useMemo(
    () =>
      [...getFoodEntriesForDate(engine, todayDateKey)].sort((left, right) => {
        const mealOrderDifference = MEAL_ORDER.indexOf(left.meal) - MEAL_ORDER.indexOf(right.meal);

        if (mealOrderDifference !== 0) {
          return mealOrderDifference;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [engine, todayDateKey]
  );
  const foodSections = useMemo(
    () =>
      getFoodLibrarySections({
        query: foodSearch,
        recentFoods: engine.recentFoods,
        customFoods: engine.customFoods,
      }),
    [engine.customFoods, engine.recentFoods, foodSearch]
  );
  const servingCount = Number.parseFloat(servings);
  const selectedCaloriesPerServing = manualMode
    ? Number.parseFloat(foodCalories)
    : selectedFood?.caloriesPerServing ?? 0;
  const selectedServingLabel = manualMode ? servingLabel.trim() || "1 serving" : selectedFood?.servingLabel || "1 serving";
  const totalCaloriesPreview =
    Number.isFinite(servingCount) && servingCount > 0 && Number.isFinite(selectedCaloriesPerServing) && selectedCaloriesPerServing > 0
      ? Math.round(servingCount * selectedCaloriesPerServing)
      : 0;
  const servingPresets = [0.5, 1, 2];
  const calorieGoal = useMemo(
    () => getFuelingCalorieGoal(profile.mileage, profile.runnerLevel, todayFueling.trainingLoad),
    [profile.mileage, profile.runnerLevel, todayFueling.trainingLoad]
  );
  const progressRatio = Math.min(todayFueling.eatenCalories / calorieGoal, 1);
  const completionPercent = Math.round(progressRatio * 100);
  const caloriesRemaining = Math.max(calorieGoal - todayFueling.eatenCalories, 0);
  const overGoalCalories = Math.max(todayFueling.eatenCalories - calorieGoal, 0);

  const openFoodComposer = (meal: MealSlot = "breakfast") => {
    setActiveMeal(meal);
    setSelectedFood(null);
    setManualMode(false);
    setFoodSearch("");
    setFoodName("");
    setFoodCalories("");
    setServingLabel("");
    setServings("1");
    setFoodNotes("");
  };

  const submitFoodLog = () => {
    if (!activeMeal) {
      return;
    }

    const calories = totalCaloriesPreview;
    const finalName = manualMode ? foodName.trim() : selectedFood?.name?.trim() || "";
    const caloriesPerServing = manualMode ? Number.parseFloat(foodCalories) : selectedFood?.caloriesPerServing ?? 0;

    if (!finalName || !Number.isFinite(calories) || calories <= 0) {
      return;
    }

    addFoodLog(todayDateKey, {
      meal: activeMeal,
      name: finalName,
      calories,
      servings: Number.isFinite(servingCount) && servingCount > 0 ? servingCount : 1,
      servingLabel: selectedServingLabel,
      caloriesPerServing,
      notes: foodNotes,
      saveToCustomFoods: manualMode,
    });
    setShowMealSaved(true);
    resetFoodComposer();
  };

  const resetFoodComposer = () => {
    setFoodSearch("");
    setSelectedFood(null);
    setManualMode(false);
    setFoodName("");
    setFoodCalories("");
    setServingLabel("");
    setServings("1");
    setFoodNotes("");
    setActiveMeal(null);
  };

  return (
    <ScreenScroll colors={colors}>
      {normalizedCategory === "fueling" ? (
        <TrackLinesBackdrop variant="race" style={{ top: 78, height: 760 }} />
      ) : null}
      {normalizedCategory === "recovery" ? (
        <TrackLinesBackdrop variant="road" style={{ top: 78, height: 720 }} />
      ) : null}
      <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <PageHeader
        eyebrow={normalizedCategory === "fueling" ? "Daily Dashboard" : "Engine Detail"}
        title={card.title}
        subtitle={
          normalizedCategory === "fueling"
            ? "Track intake, close the calorie goal, and keep meal logging fast."
            : detail.subtitle
        }
      />

      {showMealSaved ? (
        <SuccessBadge
          label="Meal added"
          detail="Fueling totals and recovery guidance have been updated."
          onHidden={() => setShowMealSaved(false)}
        />
      ) : null}

      {normalizedCategory === "recovery" ? (
        <View style={{ gap: 14 }}>
          <RecoveryHeroCard colors={colors} recovery={recovery} />

          <RecoverySummaryCard
            colors={colors}
            title="TODAY'S ADJUSTMENT"
            content={
              <View style={{ gap: 8 }}>
                <Text style={{ color: getRecoveryAccent(recovery.status), fontSize: 22, fontWeight: "800" }}>
                  {recovery.adjustment.title}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
                  {recovery.adjustment.explanation}
                </Text>
              </View>
            }
          />

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <ExpandablePanel
              title="Why this score"
              subtitle="Open the signal breakdown, quick metrics, and 7-day trend."
            >
              <View style={{ gap: 14 }}>
                <View style={{ gap: 10 }}>
                  {recovery.factors.map((factor) => (
                    <RecoveryBreakdownRow key={factor} colors={colors} text={factor} />
                  ))}
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                    MICRO METRICS
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {recovery.metrics.map((metric) => (
                      <RecoveryMetricCard
                        key={metric.key}
                        colors={colors}
                        metric={metric}
                        onPress={
                          metric.key === "fatigue"
                            ? undefined
                            : () => router.push(`/engine/${metric.key}` as never)
                        }
                      />
                    ))}
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  <RecoveryTrendCard colors={colors} trend={recovery.trend} />
                  <RecoveryFatigueCard
                    colors={colors}
                    value={engine.fatigueLevel}
                    onChange={(value) => updateEngine({ fatigueLevel: value })}
                  />
                </View>
              </View>
            </ExpandablePanel>
          </View>
        </View>
      ) : normalizedCategory === "fueling" ? (
        <View style={{ gap: 16 }}>
          <FuelingProgressCard
            colors={colors}
            summary={todayFueling}
            calorieGoal={calorieGoal}
            completionPercent={completionPercent}
            progressRatio={progressRatio}
            caloriesRemaining={caloriesRemaining}
            overGoalCalories={overGoalCalories}
          />

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <ExpandablePanel
              title="Daily totals"
              subtitle="Open the intake-versus-training breakdown when you want more detail."
              headerRight={<Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{todayFueling.workoutLabel}</Text>}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <FuelStatChip label="Eaten" value={`${todayFueling.eatenCalories} cal`} />
                <FuelStatChip label="Burned" value={`${todayFueling.burnedCalories} cal`} />
                <FuelStatChip label="Net" value={`${todayFueling.netCalories} cal`} highlight />
              </View>
            </ExpandablePanel>
          </View>

          <View style={{ gap: 12 }}>
            <SectionTitle
              colors={colors}
              title="Food log"
              subtitle="Use one fast add flow, then scan everything logged for the day in one place."
            />
            <Pressable
              onPress={() => openFoodComposer("breakfast")}
              style={({ pressed }) => ({
                backgroundColor: "#11243a",
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "rgba(103, 232, 249, 0.26)",
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                opacity: pressed ? 0.96 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                shadowColor: "#67e8f9",
                shadowOpacity: pressed ? 0.16 : 0.24,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(103, 232, 249, 0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(103, 232, 249, 0.28)",
                  }}
                >
                  <Ionicons name="add" size={20} color="#67e8f9" />
                </View>
                <View style={{ gap: 4, flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>Add Food</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18 }}>
                    Search, pick a serving, choose a meal, and add it to the day.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
            </Pressable>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>Logged today</Text>
                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                  {dayEntries.length} item{dayEntries.length === 1 ? "" : "s"}
                </Text>
              </View>

              {dayEntries.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 18,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Nothing logged yet</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                    Start with one food entry and the calorie progress will update right away.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {dayEntries.map((entry) => (
                    <FoodLogRow
                      key={entry.id}
                      colors={colors}
                      entry={entry}
                      onRemove={() => removeFoodLog(todayDateKey, entry.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#0f1b2d",
              borderRadius: 30,
              borderWidth: 1,
              borderColor: "rgba(103, 232, 249, 0.14)",
              padding: 20,
              gap: 10,
              overflow: "hidden",
            }}
          >
            <RunningSurfaceAccent variant={normalizedCategory === "heart-rate" ? "track" : normalizedCategory === "fueling" ? "race" : "road"} />
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CURRENT READ</Text>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>{card.value}</Text>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{card.label}</Text>
            {card.secondaryValue ? (
              <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{card.secondaryValue}</Text>
            ) : null}
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{card.impact}</Text>
          </View>

          <View style={{ gap: 12 }}>
            <SectionTitle
              colors={colors}
              title="Update this signal"
              subtitle="Keep this light. The point is to sharpen training decisions, not to create another tracking chore."
            />
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                gap: 16,
              }}
            >
          {normalizedCategory === "sleep" ? (
            <>
              <EngineField
                colors={colors}
                label="Last sleep duration"
                value={engine.sleepHours}
                onChangeText={(value) =>
                  updateEngine({
                    sleepHours: value,
                    sleepScore: buildSleepScore(value, engine.sleepQuality),
                  })
                }
                placeholder="7.5"
              />
              <SleepScorePanel score={getSleepScoreValue(engine)} quality={engine.sleepQuality} />
              <ChoiceRow
                colors={colors}
                title="Sleep quality"
                selected={engine.sleepQuality}
                onSelect={(value) =>
                  updateEngine({
                    sleepQuality: value,
                    sleepScore: buildSleepScore(engine.sleepHours, value),
                  })
                }
                options={[
                  { value: "solid", label: "Great" },
                  { value: "mixed", label: "Okay" },
                  { value: "poor", label: "Poor" },
                ]}
              />
            </>
          ) : null}

          {normalizedCategory === "heart-rate" ? (
            <>
              <EngineField
                colors={colors}
                label="Resting HR"
                value={engine.restingHr}
                onChangeText={(value) => updateEngine({ restingHr: value })}
                placeholder="52"
              />
              <EngineField
                colors={colors}
                label="Average active HR"
                value={engine.activeHr}
                onChangeText={(value) => updateEngine({ activeHr: value })}
                placeholder="Optional"
                helper="Don't know your active HR? You can skip this."
              />
              <ChoiceRow
                colors={colors}
                title="Trend"
                selected={engine.heartRateTrend}
                onSelect={(value) => updateEngine({ heartRateTrend: value })}
                options={[
                  { value: "stable", label: "Stable" },
                  { value: "slightly_up", label: "Slightly up" },
                  { value: "elevated", label: "Elevated" },
                ]}
              />
            </>
          ) : null}

            </View>
          </View>
        </>
      )}

      {normalizedCategory !== "fueling" && normalizedCategory !== "recovery" ? (
        <View
          style={{
            backgroundColor: "#101f34",
            borderRadius: 26,
            borderWidth: 1,
            borderColor: "rgba(103, 232, 249, 0.14)",
            padding: 18,
            gap: 10,
          }}
        >
          <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>COACHING TIP</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{detail.title}</Text>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", lineHeight: 19 }}>{detail.insight}</Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{detail.coachTip}</Text>
        </View>
      ) : null}

      <BottomSheetModal
        visible={Boolean(activeMeal)}
        onClose={resetFoodComposer}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
              QUICK FOOD LOG
            </Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
              Add food
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
              Search recent or starter foods first, then confirm servings and meal in one more step.
            </Text>
          </View>

          {!selectedFood && !manualMode ? (
            <>
              <AnimatedTextField
                colors={colors}
                value={foodSearch}
                onChangeText={setFoodSearch}
                placeholder="Search foods"
                containerStyle={{ gap: 0 }}
              />

              {foodSections.map((section) => (
                <View key={section.title} style={{ gap: 10 }}>
                  <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                    {section.title.toUpperCase()}
                  </Text>
                  {section.foods.length === 0 ? (
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 14,
                      }}
                    >
                      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>{section.emptyMessage}</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {section.foods.slice(0, 6).map((food) => (
                        <Pressable
                          key={`${section.title}-${food.id}`}
                          onPress={() => {
                            setSelectedFood(food);
                            setServings("1");
                            setFoodNotes("");
                          }}
                          style={({ pressed }) => ({
                            backgroundColor: colors.card,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 14,
                            gap: 8,
                            opacity: pressed ? 0.95 : 1,
                            transform: [{ scale: pressed ? 0.985 : 1 }],
                          })}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(103, 232, 249, 0.1)",
                                borderWidth: 1,
                                borderColor: "rgba(103, 232, 249, 0.16)",
                              }}
                            >
                              <Ionicons name={getFoodCategoryIcon(food.category)} size={16} color="#67e8f9" />
                            </View>
                            <View style={{ flex: 1, gap: 3 }}>
                              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{food.name}</Text>
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                            {food.caloriesPerServing} cal • {food.servingLabel}
                          </Text>
                              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: "700" }}>
                                {getFoodCategoryLabel(food.category)}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  gap: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Need something else?</Text>
                <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                  Add a custom food manually and it will be saved to your personal food library for next time.
                </Text>
                <SecondaryButton
                  label="Add custom food"
                  onPress={() => {
                    setManualMode(true);
                    setFoodName("");
                    setFoodCalories("");
                    setServingLabel("1 serving");
                    setServings("1");
                  }}
                />
              </View>
            </>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: "#0d1827",
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: "rgba(103, 232, 249, 0.14)",
                  padding: 16,
                  gap: 14,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                    FOOD DETAILS
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                    Confirm the serving and choose where this belongs in the day.
                  </Text>
                </View>

                {manualMode ? (
                  <View style={{ gap: 12 }}>
                  <AnimatedTextField
                    colors={colors}
                    value={foodName}
                    onChangeText={setFoodName}
                    placeholder="Food name"
                    containerStyle={{ gap: 0 }}
                  />
                  <AnimatedTextField
                    colors={colors}
                    value={servingLabel}
                    onChangeText={setServingLabel}
                    placeholder="Serving label"
                    containerStyle={{ gap: 0 }}
                  />
                  <AnimatedTextField
                    colors={colors}
                    value={foodCalories}
                    onChangeText={setFoodCalories}
                    placeholder="Calories per serving"
                    keyboardType="numeric"
                    containerStyle={{ gap: 0 }}
                  />
                  </View>
                ) : selectedFood ? (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{selectedFood.name}</Text>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                      {selectedFood.caloriesPerServing} cal per {selectedFood.servingLabel}
                    </Text>
                    <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>
                      {getFoodCategoryLabel(selectedFood.category)}
                    </Text>
                  </View>
                ) : null}

                <View style={{ gap: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Serving quantity</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {servingPresets.map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => setServings(String(preset))}
                      style={({ pressed }) => ({
                        backgroundColor: servings === String(preset) ? colors.primarySoft : colors.card,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: servings === String(preset) ? colors.primary : colors.border,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        opacity: pressed ? 0.94 : 1,
                        transform: [{ scale: pressed ? 0.985 : 1 }],
                      })}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{preset}</Text>
                    </Pressable>
                  ))}
                  </View>
                  <AnimatedTextField
                    colors={colors}
                    value={servings}
                    onChangeText={setServings}
                    placeholder="Custom servings"
                    keyboardType="numeric"
                    helper={`Calories update automatically from ${selectedServingLabel}.`}
                    containerStyle={{ gap: 0 }}
                  />
                </View>

                <View style={{ gap: 10 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Meal</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {MEAL_ORDER.map((meal) => (
                      <Pressable
                        key={meal}
                        onPress={() => setActiveMeal(meal)}
                        style={({ pressed }) => ({
                          backgroundColor: activeMeal === meal ? colors.primarySoft : colors.card,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: activeMeal === meal ? colors.primary : colors.border,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          opacity: pressed ? 0.94 : 1,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        })}
                      >
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
                          {getMealTagLabel(meal)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <AnimatedTextField
                  colors={colors}
                  value={foodNotes}
                  onChangeText={setFoodNotes}
                  placeholder="Optional note"
                  containerStyle={{ gap: 0 }}
                />

                <View
                  style={{
                    backgroundColor: "#101f34",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(103, 232, 249, 0.14)",
                    padding: 14,
                    gap: 6,
                  }}
                >
                  <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>
                    CALORIE PREVIEW
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
                    {totalCaloriesPreview > 0 ? `${totalCaloriesPreview} cal` : "Add servings to calculate"}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
                    {Number.isFinite(servingCount) && servingCount > 0
                      ? `${servingCount} x ${selectedServingLabel} • ${getMealTagLabel(activeMeal ?? "breakfast")}`
                      : "Try 0.5, 1, or 2 servings depending on what you ate."}
                  </Text>
                </View>
              </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                  <PrimaryButton label="Add to Day" onPress={submitFoodLog} emphasis />
                  </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    label="Back"
                    onPress={() => {
                      setSelectedFood(null);
                      setManualMode(false);
                      setFoodName("");
                      setFoodCalories("");
                      setServingLabel("");
                      setServings("1");
                      setFoodNotes("");
                    }}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </BottomSheetModal>
    </ScreenScroll>
  );
}

function EngineField({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  helper,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  helper?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <AnimatedTextField
        colors={colors}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="numeric"
        helper={helper}
      />
    </View>
  );
}

function FuelStatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: highlight ? "rgba(103, 232, 249, 0.12)" : "rgba(15, 23, 42, 0.74)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: highlight ? "rgba(103, 232, 249, 0.22)" : "rgba(148, 163, 184, 0.14)",
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 96,
        gap: 4,
      }}
    >
      <Text style={{ color: "#9db2ca", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function FuelingProgressCard({
  colors,
  summary,
  calorieGoal,
  completionPercent,
  progressRatio,
  caloriesRemaining,
  overGoalCalories,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  summary: DailyFuelingSummary;
  calorieGoal: number;
  completionPercent: number;
  progressRatio: number;
  caloriesRemaining: number;
  overGoalCalories: number;
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(progressRatio >= 0.72 ? 1 : 0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: trackWidth * progressRatio,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, progressRatio, trackWidth]);

  useEffect(() => {
    if (progressRatio < 0.72) {
      glowPulse.stopAnimation();
      Animated.timing(glowPulse, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.45,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [glowPulse, progressRatio]);

  const statusTone =
    summary.status === "underfueled"
      ? { border: "rgba(251, 191, 36, 0.32)", glow: "rgba(251, 191, 36, 0.18)", label: "#fde68a" }
      : summary.status === "well_fueled"
        ? { border: "rgba(74, 222, 128, 0.28)", glow: "rgba(74, 222, 128, 0.14)", label: "#86efac" }
        : { border: "rgba(103, 232, 249, 0.2)", glow: "rgba(103, 232, 249, 0.14)", label: "#67e8f9" };

  return (
    <View
      style={{
        backgroundColor: "#0c1828",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: statusTone.border,
        padding: 20,
        gap: 18,
        overflow: "hidden",
        shadowColor: "#020817",
        shadowOpacity: 0.3,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 16 },
      }}
    >
      <GlowBackground variant="race" />
      <RunningSurfaceAccent variant="race" />
      <View
        style={{
          position: "absolute",
          top: -34,
          right: -12,
          width: 190,
          height: 190,
          borderRadius: 999,
          backgroundColor: statusTone.glow,
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <View style={{ gap: 8, flex: 1 }}>
          <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }}>
            FUELING PROGRESS
          </Text>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 }}>
            <AnimatedNumber value={summary.eatenCalories} style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 }} />
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 }}> / </Text>
            <AnimatedNumber value={calorieGoal} style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 }} />
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 }}> calories</Text>
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
            {caloriesRemaining > 0
              ? `${caloriesRemaining.toLocaleString()} calories remaining`
              : `${overGoalCalories.toLocaleString()} calories over goal`}
          </Text>
        </View>

        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "rgba(8, 15, 26, 0.86)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            paddingHorizontal: 12,
            paddingVertical: 10,
            minWidth: 98,
            gap: 4,
          }}
        >
          <Text style={{ color: "#9db2ca", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 }}>COMPLETE</Text>
          <AnimatedNumber value={completionPercent} suffix="%" style={{ color: statusTone.label, fontSize: 18, fontWeight: "800" }} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={{
            height: 18,
            borderRadius: 999,
            backgroundColor: "rgba(148, 163, 184, 0.14)",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            shadowColor: "#67e8f9",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Animated.View
            style={{
              width: animatedWidth,
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#3dd5f3",
              overflow: "hidden",
              shadowColor: "#67e8f9",
              shadowOpacity:
                progressRatio >= 0.72
                  ? glowPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.36, 0.54],
                    })
                  : 0.34,
              shadowRadius:
                progressRatio >= 0.72
                  ? glowPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 20],
                    })
                  : 14,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#1fb6ff",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 2,
                left: 8,
                right: 8,
                height: 5,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.24)",
              }}
            />
          </Animated.View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18, flex: 1 }}>{summary.insight}</Text>
          {summary.burnedCalories > 0 ? (
            <AnimatedNumber
              value={summary.burnedCalories}
              suffix=" burned"
              style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function FoodLogRow({
  colors,
  entry,
  onRemove,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  entry: ReturnType<typeof getFoodEntriesForDate>[number];
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{entry.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{entry.calories} cal</Text>
            <View
              style={{
                backgroundColor: "rgba(103, 232, 249, 0.12)",
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(103, 232, 249, 0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800" }}>{getMealTagLabel(entry.meal)}</Text>
            </View>
          </View>
          {entry.servingLabel ? (
            <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 17 }}>
              {entry.servings} x {entry.servingLabel}
            </Text>
          ) : null}
          {entry.notes ? (
            <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 17 }}>{entry.notes}</Text>
          ) : null}
        </View>

        <Pressable onPress={onRemove} style={{ padding: 4 }}>
          <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MealSectionCard({
  colors,
  group,
  isExpanded,
  onToggleExpand,
  onAddFood,
  onRemoveEntry,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  group: MealGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddFood: () => void;
  onRemoveEntry: (entryId: string) => void;
}) {
  const hasEntries = group.entries.length > 0;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={onToggleExpand}
          disabled={!hasEntries}
          style={{ flex: 1, gap: 4, opacity: hasEntries ? 1 : 0.9 }}
        >
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{group.title}</Text>
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18 }}>
            {hasEntries
              ? `${group.calories} calories • ${group.entries.length} item${group.entries.length === 1 ? "" : "s"}`
              : "Nothing logged yet"}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{group.calories} cal</Text>
          {hasEntries ? (
            <Pressable onPress={onToggleExpand} style={{ padding: 4 }}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.subtext}
              />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onAddFood}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.cardAlt,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>Add food</Text>
          </Pressable>
        </View>
      </View>

      {!hasEntries ? (
        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
          Keep this meal lightweight until you need it. Add food in a couple taps.
        </Text>
      ) : !isExpanded ? (
        <View
          style={{
            backgroundColor: colors.cardAlt,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 18 }}>
            {group.entries[0].name}
            {group.entries.length > 1 ? ` and ${group.entries.length - 1} more` : ""}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {group.entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                backgroundColor: colors.cardAlt,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{entry.name}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{entry.calories} cal</Text>
                {entry.servingLabel ? (
                  <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 17 }}>
                    {entry.servings} x {entry.servingLabel}
                  </Text>
                ) : null}
                {entry.notes ? (
                  <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 17 }}>{entry.notes}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => onRemoveEntry(entry.id)} style={{ padding: 4 }}>
                <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RecoveryHeroCard({
  colors,
  recovery,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  recovery: RecoveryState;
}) {
  const accent = getRecoveryAccent(recovery.status);

  return (
    <View
      style={{
        backgroundColor: "#0c1828",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: `${accent}55`,
        padding: 20,
        gap: 18,
        overflow: "hidden",
        shadowColor: accent,
        shadowOpacity: 0.16,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      }}
    >
      <GlowBackground variant="road" />
      <RunningSurfaceAccent variant="road" />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 2,
          borderRadius: 999,
          backgroundColor: `${accent}70`,
        }}
      />
      <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }}>
        RECOVERY SCORE
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
        <AnimatedScoreRing
          value={recovery.percent}
          max={100}
          size={164}
          strokeWidth={14}
          fillColor={accent}
          trackColor="rgba(255,255,255,0.08)"
          glowColor={`${accent}66`}
        >
          <View style={{ alignItems: "center", justifyContent: "center", gap: 3 }}>
            <AnimatedNumber value={recovery.percent} suffix="%" style={{ color: "#f8fbff", fontSize: 30, fontWeight: "800" }} />
            <Text style={{ color: "#8ea5c2", fontSize: 11, fontWeight: "700", letterSpacing: 0.7 }}>
              {recovery.title.toUpperCase()}
            </Text>
          </View>
        </AnimatedScoreRing>

        <View style={{ flex: 1, minWidth: 180, gap: 10 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.3 }}>
            {recovery.title} readiness
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
            {recovery.recommendation}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(8, 15, 26, 0.88)",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: `${accent}44`,
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 4,
            }}
          >
            <Text style={{ color: "#9db2ca", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 }}>TODAY</Text>
            <Text style={{ color: accent, fontSize: 18, fontWeight: "800" }}>{recovery.adjustment.title}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function RecoverySummaryCard({
  colors,
  title,
  content,
  style,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  content: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    >
      <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>{title}</Text>
      {content}
    </View>
  );
}

function RecoveryBreakdownRow({
  colors,
  text,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  text: string;
}) {
  const [label, status] = text.split(": ");

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, fontWeight: "700" }}>{status}</Text>
    </View>
  );
}

function RecoveryMetricCard({
  colors,
  metric,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  metric: RecoveryMetric;
  onPress?: () => void;
}) {
  const accent = metric.score >= 75 ? "#4ade80" : metric.score >= 50 ? "#67e8f9" : "#fbbf24";

  return (
    <InteractivePressable
      onPress={onPress}
      style={{
        width: "47.8%",
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${accent}30`,
        padding: 14,
        gap: 8,
      }}
      scaleTo={onPress ? 0.975 : 1}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>
            {metric.label.toUpperCase()}
          </Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{metric.shortLabel}</Text>
          <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 17 }}>{metric.value}</Text>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.subtext} /> : null}
      </View>
      <AnimatedProgressBar progress={metric.score} fillColor={accent} trackColor="rgba(255,255,255,0.08)" height={6} />
    </InteractivePressable>
  );
}

function RecoveryTrendCard({
  colors,
  trend,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  trend: number[];
}) {
  const delta = trend[trend.length - 1] - trend[0];
  const arrowName = delta >= 4 ? "arrow-up" : delta <= -4 ? "arrow-down" : "remove";
  const arrowColor = delta >= 4 ? "#4ade80" : delta <= -4 ? "#fbbf24" : "#67e8f9";

  return (
    <View
      style={{
        flex: 1,
        minWidth: 220,
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>TREND</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>7-day readiness</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={arrowName} size={14} color={arrowColor} />
          <Text style={{ color: arrowColor, fontSize: 12, fontWeight: "800" }}>
            {delta >= 4 ? "Rising" : delta <= -4 ? "Falling" : "Stable"}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 7, height: 58 }}>
        {trend.map((point, index) => (
          <View key={`${point}-${index}`} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: "100%",
                maxWidth: 22,
                height: Math.max(12, Math.round((point / 100) * 48)),
                borderRadius: 999,
                backgroundColor: index === trend.length - 1 ? "#67e8f9" : "rgba(103, 232, 249, 0.26)",
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function RecoveryFatigueCard({
  colors,
  value,
  onChange,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  value: FatigueLevel;
  onChange: (value: FatigueLevel) => void;
}) {
  const options: { value: FatigueLevel; label: string }[] = [
    { value: "fresh", label: "Fresh" },
    { value: "steady", label: "Manageable" },
    { value: "heavy", label: "Heavy" },
  ];

  return (
    <View
      style={{
        flex: 1,
        minWidth: 220,
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>FATIGUE CHECK-IN</Text>
        <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 19 }}>
          Optional input that sharpens the recovery score.
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: value === option.value ? "#67e8f9" : colors.border,
              backgroundColor: value === option.value ? "rgba(103, 232, 249, 0.12)" : colors.cardAlt,
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function getRecoveryAccent(status: RecoveryState["status"]) {
  return status === "high" ? "#4ade80" : status === "moderate" ? "#67e8f9" : "#fbbf24";
}

function SleepScorePanel({
  score,
  quality,
}: {
  score: number | null;
  quality: "solid" | "mixed" | "poor";
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(103, 232, 249, 0.12)",
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: "#67e8f9", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>LAST SLEEP READ</Text>
      <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800" }}>
        {score !== null ? `${score}/100` : "No score yet"}
      </Text>
      <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19 }}>
        {quality === "solid" ? "Great quality" : quality === "mixed" ? "Okay quality" : "Poor quality"}
      </Text>
    </View>
  );
}

function buildSleepScore(hoursValue: string, quality: "solid" | "mixed" | "poor") {
  const hours = Number.parseFloat(hoursValue);

  if (Number.isNaN(hours) || hours <= 0) {
    return null;
  }

  const hourScore = Math.max(0, Math.min(Math.round((hours / 8) * 70), 70));
  const qualityScore = quality === "solid" ? 30 : quality === "mixed" ? 18 : 6;
  return Math.max(0, Math.min(hourScore + qualityScore, 100));
}

function getFuelingCalorieGoal(
  mileage: string,
  runnerLevel: ReturnType<typeof useProfile>["profile"]["runnerLevel"],
  trainingLoad: TrainingLoad
) {
  const numericMileage = Number.parseFloat(mileage);
  const mileageBase =
    Number.isFinite(numericMileage) && numericMileage >= 36
      ? 2900
      : Number.isFinite(numericMileage) && numericMileage >= 21
        ? 2650
        : Number.isFinite(numericMileage) && numericMileage >= 11
          ? 2400
          : 2200;
  const loadBoost = trainingLoad === "high" ? 300 : trainingLoad === "moderate" ? 150 : 0;
  const levelOffset =
    runnerLevel === "advanced" ? 150 : runnerLevel === "intermediate" ? 75 : runnerLevel === "total_beginner" ? -100 : 0;

  return Math.max(1800, Math.min(3600, mileageBase + loadBoost + levelOffset));
}

function getMealTagLabel(meal: MealSlot) {
  switch (meal) {
    case "breakfast":
      return "Breakfast";
    case "lunch":
      return "Lunch";
    case "dinner":
      return "Dinner";
    case "snacks":
      return "Snack";
    default:
      return "Breakfast";
  }
}

function ChoiceRow<T extends string>({
  colors,
  title,
  selected,
  options,
  onSelect,
}: {
  colors: ReturnType<typeof useThemeColors>["colors"];
  title: string;
  selected: T;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => ({
              backgroundColor: selected === option.value ? colors.primarySoft : colors.cardAlt,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: selected === option.value ? colors.primary : colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
