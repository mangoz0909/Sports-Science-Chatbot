import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { useSearchParams } from "react-router-dom";
import AiWorkoutGenerator, { type SaveWorkoutOptions } from "../components/workout/AiWorkoutGenerator";

import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";

import Seo from "../components/Seo";
import CustomizeTypesDialog from "../components/workout/CustomizeTypesDialog";
import ExerciseCard from "../components/workout/ExerciseCard";
import { FuelCard, FuelEmptyHint } from "../components/workout/FuelCard";
import RecommendationCards from "../components/workout/RecommendationCards";
import WeekStrip from "../components/workout/WeekStrip";
import {
  BODY,
  INK,
  LINE,
  LINE_STRONG,
  MUTED,
  SURFACE,
  captionSx,
  cardSx,
  fieldSx,
  primaryButtonSx,
  progressSx,
  secondaryButtonSx,
  textButtonSx,
} from "../components/workout/ui";
import { useAuth } from "../contexts/AuthContext";
import { loadTodaysPlan } from "../services/planService";

import {
  addDays,
  demoPlan,
  fromISODate,
  fuelFromNutritionPlan,
  lastWeightFor,
  loadPlan,
  nextId,
  recommendWorkouts,
  replaceWorkoutTypes,
  savePlan,
  sessionFromType,
  sessionProgress,
  storageKeyFor,
  toISODate,
  toNumber,
  weekDays,
  type DaySession,
  type Fuel,
  type Plan,
  type PlannedExercise,
  type WorkoutType,
} from "../lib/workoutPlan";

/**
 * One page for the whole training week: pick a day, pick what to train from a
 * recovery-ranked split, then log sets against it. The AI tab feeds the same
 * planner: "Train this today" puts its session straight onto today. Workout
 * types and their default exercises are set up once in the customize dialog.
 */
export default function MyWorkoutPlan() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "ai" ? "ai" : "planner";

  const storageKey = user ? storageKeyFor(user.id) : null;

  const todayISO = toISODate(new Date());
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  const [plan, setPlan] = useState<Plan>(() =>
    storageKey ? loadPlan(storageKey) : demoPlan()
  );

  // Signing in or out mid-visit swaps which plan is on screen: the demo seed
  // must not be written into a real account, and one account's plan must not
  // linger into another's.
  const loadedKey = useRef(storageKey);
  const [planOwnerKey, setPlanOwnerKey] = useState(storageKey);
  useEffect(() => {
    if (loadedKey.current === storageKey) return;
    loadedKey.current = storageKey;
    setPlan(storageKey ? loadPlan(storageKey) : demoPlan());
    setPlanOwnerKey(storageKey);
  }, [storageKey]);

  // Nothing is persisted for signed-out visitors — the demo plan is scratch
  // data, and saving it would leak into their first signed-in session.
  useEffect(() => {
    // Effects from the account-change render still capture the old plan.
    if (!storageKey || planOwnerKey !== storageKey) return;
    savePlan(storageKey, plan);
  }, [plan, storageKey, planOwnerKey]);

  // Today's AI nutrition plan, for the Fuel cards. undefined = still loading;
  // null = signed in but nothing saved. Hidden entirely for signed-out/demo.
  const userId = user?.id;
  const [fuel, setFuel] = useState<Fuel | null | undefined>(undefined);
  useEffect(() => {
    setFuel(undefined);
    if (!userId) return;
    let cancelled = false;
    loadTodaysPlan<unknown>("nutrition", userId)
      .then((raw) => { if (!cancelled) setFuel(fuelFromNutritionPlan(raw)); })
      .catch(() => { if (!cancelled) setFuel(null); });
    return () => { cancelled = true; };
  }, [userId]);
  const showFuel = Boolean(userId) && selectedISO === todayISO && fuel !== undefined;

  const selectedDate = useMemo(() => fromISODate(selectedISO), [selectedISO]);
  const days = useMemo(() => weekDays(selectedDate), [selectedDate]);

  const session: DaySession | undefined = plan.days[selectedISO];

  const typeById = useMemo(
    () => new Map<string, WorkoutType>(plan.types.map((type) => [type.id, type])),
    [plan.types]
  );

  const activeType = session ? typeById.get(session.typeId) : undefined;
  const accent = session?.color ?? activeType?.color ?? INK;

  const recommendations = useMemo(
    () => recommendWorkouts(plan, selectedISO),
    [plan, selectedISO]
  );

  const { completed, total, percent } = sessionProgress(session);

  const dayLabel =
    selectedISO === todayISO
      ? "today"
      : `on ${selectedDate.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}`;

  /* ── day mutations ───────────────────────────────────────────────────── */

  const updateSession = (update: (current: DaySession) => DaySession) =>
    setPlan((current) => {
      const existing = current.days[selectedISO];
      if (!existing) return current;

      return {
        ...current,
        days: { ...current.days, [selectedISO]: update(existing) },
      };
    });

  const updateExercises = (
    update: (current: PlannedExercise[]) => PlannedExercise[]
  ) =>
    updateSession((current) => ({
      ...current,
      exercises: update(current.exercises),
    }));

  const startWorkout = (typeId: string) => {
    const type = typeById.get(typeId);
    if (!type) return;

    setPlan((current) => ({
      ...current,
      days: { ...current.days, [selectedISO]: sessionFromType(type, { plan: current, dateISO: selectedISO }) },
    }));
  };

  const clearWorkout = () =>
    setPlan((current) => {
      const days = { ...current.days };
      delete days[selectedISO];
      return { ...current, days };
    });

  const mapSet = (
    exerciseId: number,
    setId: number,
    update: (set: DaySession["exercises"][number]["sets"][number]) =>
      DaySession["exercises"][number]["sets"][number]
  ) =>
    updateExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? update(set) : set
              ),
            }
          : exercise
      )
    );

  const addExercise = () => {
    const name = newExerciseName.trim();
    if (!name || !session) return;

    const last = lastWeightFor(plan, name, selectedISO);
    updateExercises((current) => [
      ...current,
      {
        id: nextId(),
        name,
        targetReps: 8,
        cues: [],
        ...(last !== null ? { lastWeight: last } : {}),
        sets: [{ id: nextId(), reps: "8", weight: last !== null ? String(last) : "0", completed: false }],
      },
    ]);

    setNewExerciseName("");
  };

  const setTab = (value: "planner" | "ai") => {
    const next = new URLSearchParams(searchParams);
    if (value === "ai") next.set("tab", "ai");
    else next.delete("tab");
    setSearchParams(next);
  };

  /** Replacing a session wipes its logged sets, so ask first when there are any. */
  const confirmReplace = (existing: DaySession | undefined) =>
    !existing ||
    !existing.exercises.some((exercise) => exercise.sets.some((set) => set.completed)) ||
    window.confirm(
      `Replace ${existing.name ?? "this workout"}? The sets you've ticked off will be cleared.`
    );

  const saveAiWorkout = (workout: WorkoutType, { startToday }: SaveWorkoutOptions) => {
    if (!storageKey || planOwnerKey !== storageKey) throw new Error("Sign in to save a workout.");

    // Saving the same AI session twice reuses the first copy.
    const existing = workout.sourceKey
      ? plan.types.find((type) => type.sourceKey === workout.sourceKey)
      : undefined;
    const type = existing ?? workout;

    if (startToday && !confirmReplace(plan.days[todayISO])) return;

    const updated: Plan = {
      types: existing ? plan.types : [...plan.types, workout],
      days: startToday ? { ...plan.days, [todayISO]: sessionFromType(type, { plan, dateISO: todayISO }) } : plan.days,
    };
    savePlan(storageKey, updated);
    if (window.localStorage.getItem(storageKey) !== JSON.stringify(updated)) {
      throw new Error("Workout storage is unavailable.");
    }
    setPlan(updated);

    if (startToday) {
      setSelectedISO(todayISO);
      setTab("planner");
      window.scrollTo({ top: 0 });
    }
  };

  const guidance = session?.guidance;
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "calc(100dvh - var(--app-header-h, 64px))", bgcolor: SURFACE, py: { xs: 2.5, md: 4 } }}>
      <Seo
        title="My Workout Plan"
        description="Plan your training week, pick the workout your body is most recovered for, and log every set, rep, and weight."
        path="/my-workout-plan"
        noIndex
      />

      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* HEADER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
          mb={2.5}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={950} color={INK} fontSize={{ xs: 28, md: 34 }}>
              My Workout
            </Typography>
            <Typography color={MUTED} mt={0.5}>
              Plan your week, train with AI, and log every set.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setCustomizeOpen(true)}
            aria-label="Customize workouts"
            sx={{ ...secondaryButtonSx, flexShrink: 0, minWidth: 0, px: { xs: 1.25, sm: 2 }, "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } } }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Customize
            </Box>
          </Button>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, value: "planner" | "ai") => setTab(value)}
          aria-label="Workout plan sections"
          sx={{
            mb: 2.5,
            minHeight: 0,
            borderBottom: `1px solid ${LINE}`,
            "& .MuiTabs-indicator": { bgcolor: INK, height: 3, borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": { textTransform: "none", fontWeight: 800, color: MUTED, minHeight: 44, px: 0, mr: 3, minWidth: 0 },
            "& .MuiTab-root.Mui-selected": { color: INK },
          }}
        >
          <Tab value="planner" label="Planner" id="workout-tab-planner" aria-controls="workout-panel-planner" />
          <Tab
            value="ai"
            label="AI workout"
            icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            id="workout-tab-ai"
            aria-controls="workout-panel-ai"
          />
        </Tabs>

        {activeTab === "ai" && (
          <Box role="tabpanel" id="workout-panel-ai" aria-labelledby="workout-tab-ai">
            <AiWorkoutGenerator workoutTypes={plan.types} onSaveWorkout={saveAiWorkout} />
          </Box>
        )}

        <Box hidden={activeTab !== "planner"} role="tabpanel" id="workout-panel-planner" aria-labelledby="workout-tab-planner">
          {/* WEEK */}
          <Box sx={{ ...cardSx, p: { xs: 1.5, sm: 2.5 }, mb: 2 }}>
            <WeekStrip
              days={days}
              selectedISO={selectedISO}
              todayISO={todayISO}
              plan={plan}
              onSelect={setSelectedISO}
              onShiftWeek={(weeks) =>
                setSelectedISO(toISODate(addDays(selectedDate, weeks * 7)))
              }
            />
          </Box>

          {/* THE SELECTED DAY */}
          {!session ? (
            <Box sx={{ ...cardSx, p: { xs: 2, md: 3 } }}>
              {recommendations.length > 0 ? (
                <RecommendationCards
                  recommendations={recommendations}
                  onStart={startWorkout}
                  dayLabel={dayLabel}
                />
              ) : (
                <Stack alignItems="center" textAlign="center" py={3}>
                  <FitnessCenterIcon sx={{ fontSize: 40, color: "#94a3b8" }} />

                  <Typography component="h2" fontWeight={900} fontSize={20} color={INK} mt={1}>
                    No workouts yet
                  </Typography>

                  <Typography color={MUTED} mt={0.5} mb={2.5}>
                    Generate one with AI, or set up your own split.
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setTab("ai")} sx={{ ...primaryButtonSx, px: 2.5 }}>
                      Generate with AI
                    </Button>
                    <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setCustomizeOpen(true)} sx={{ ...secondaryButtonSx, px: 2.5 }}>
                      Create workouts
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>
          ) : (
            <>
              {/* SESSION SUMMARY: name, progress and the AI guidance in one card */}
              <Box sx={{ ...cardSx, mb: 2, overflow: "hidden" }}>
                <Box sx={{ height: 5, bgcolor: accent }} />

                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={captionSx}>
                        {selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </Typography>

                      <Typography component="h2" fontWeight={950} fontSize={{ xs: 22, md: 26 }} color={INK} lineHeight={1.2} mt={0.25}>
                        {session.name ?? activeType?.name ?? "Workout"}
                      </Typography>

                      {guidance && (
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={`${guidance.intensity} intensity`} variant="outlined" sx={{ fontWeight: 800, borderColor: LINE_STRONG }} />
                          <Chip size="small" label={guidance.duration} variant="outlined" sx={{ fontWeight: 800, borderColor: LINE_STRONG }} />
                        </Stack>
                      )}
                    </Box>

                    <Button
                      size="small"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => {
                        if (confirmReplace(session)) clearWorkout();
                      }}
                      sx={{ ...textButtonSx, color: MUTED, flexShrink: 0, "&:hover": { color: INK } }}
                    >
                      Change
                    </Button>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5} mt={2}>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      aria-label="Workout progress"
                      sx={{ ...progressSx(accent, 8), flex: 1 }}
                    />
                    <Typography variant="body2" fontWeight={800} color={INK} sx={{ flexShrink: 0 }}>
                      {completed}/{total} sets
                    </Typography>
                  </Stack>

                  {guidance && (guidance.coachNote || guidance.warmup.length > 0 || guidance.cooldown.length > 0 || guidance.recoveryNote) && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${LINE}` }}>
                      {guidance.coachNote && (
                        <Typography color={BODY} fontSize={14} lineHeight={1.7}>
                          {guidance.coachNote}
                        </Typography>
                      )}

                      {(guidance.warmup.length > 0 || guidance.cooldown.length > 0 || guidance.recoveryNote) && (
                        <>
                          <Button
                            size="small"
                            onClick={() => setGuideOpen((open) => !open)}
                            aria-expanded={guideOpen}
                            endIcon={<ExpandMoreIcon sx={{ transform: guideOpen ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />}
                            sx={{ ...textButtonSx, px: 0, mt: 0.5 }}
                          >
                            Warm-up, cooldown & recovery
                          </Button>

                          <Collapse in={guideOpen}>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 2,
                                mt: 1,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: SURFACE,
                              }}
                            >
                              {[["Warm-up", guidance.warmup], ["Cooldown", guidance.cooldown]].map(([title, items]) =>
                                (items as string[]).length > 0 && (
                                  <Box key={title as string}>
                                    <Typography sx={{ ...captionSx, mb: 0.5 }}>{title as string}</Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                      {(items as string[]).map((item, index) => (
                                        <Typography key={index} component="li" fontSize={14} color={BODY}>
                                          {item}
                                        </Typography>
                                      ))}
                                    </Box>
                                  </Box>
                                )
                              )}
                              {guidance.recoveryNote && (
                                <Box sx={{ gridColumn: "1 / -1" }}>
                                  <Typography sx={{ ...captionSx, mb: 0.5 }}>Recovery</Typography>
                                  <Typography fontSize={14} color={BODY}>{guidance.recoveryNote}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              {showFuel && !fuel && <FuelEmptyHint />}
              {showFuel && fuel && fuel.pre.length > 0 && <Box sx={{ mb: 1.5, mt: -0.5 }}><FuelCard label="Fuel before" items={fuel.pre} /></Box>}

              {/* EXERCISES */}
              <Stack spacing={1.5} mt={showFuel && !fuel ? 1.5 : 0}>
                {session.exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    accent={accent}
                    onUpdateSet={(setId, field, value) =>
                      mapSet(exercise.id, setId, (set) => ({
                        ...set,
                        [field]: value,
                      }))
                    }
                    onNormaliseSet={(setId, field) =>
                      (field === "reps" && exercise.prescription?.kind === "duration") ? undefined : mapSet(exercise.id, setId, (set) => ({
                        ...set,
                        [field]: String(toNumber(set[field])),
                      }))
                    }
                    onToggleSet={(setId) =>
                      mapSet(exercise.id, setId, (set) => ({
                        ...set,
                        completed: !set.completed,
                      }))
                    }
                    onAddSet={() =>
                      updateExercises((current) =>
                        current.map((entry) => {
                          if (entry.id !== exercise.id) return entry;

                          const last = entry.sets[entry.sets.length - 1];

                          return {
                            ...entry,
                            sets: [
                              ...entry.sets,
                              {
                                id: nextId(),
                                reps: last?.reps ?? entry.prescription?.target ?? String(entry.targetReps),
                                weight: last?.weight ?? "0",
                                completed: false,
                              },
                            ],
                          };
                        })
                      )
                    }
                    onRemoveSet={(setId) =>
                      updateExercises((current) =>
                        current.map((entry) =>
                          entry.id === exercise.id
                            ? {
                                ...entry,
                                sets: entry.sets.filter((set) => set.id !== setId),
                              }
                            : entry
                        )
                      )
                    }
                    onRemove={() =>
                      updateExercises((current) =>
                        current.filter((entry) => entry.id !== exercise.id)
                      )
                    }
                  />
                ))}
              </Stack>

              {showFuel && fuel && fuel.post.length > 0 && <FuelCard label="Fuel after" items={fuel.post} />}

              {session.exercises.length === 0 && (
                <Typography color={MUTED} textAlign="center" sx={{ ...cardSx, p: 3 }}>
                  No exercises in this session yet. Add one below.
                </Typography>
              )}

              {/* ADD EXERCISE */}
              <Stack
                component="form"
                direction="row"
                spacing={1}
                mt={1.5}
                onSubmit={(event: React.FormEvent) => {
                  event.preventDefault();
                  addExercise();
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add an exercise, e.g. Barbell Squat"
                  value={newExerciseName}
                  inputProps={{ "aria-label": "New exercise name" }}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  sx={fieldSx}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!newExerciseName.trim()}
                  sx={{ ...primaryButtonSx, px: 2.5, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  Add
                </Button>
              </Stack>
            </>
          )}

          <Typography variant="caption" color={MUTED} display="block" mt={3}>
            {user
              ? "Saved on this device. "
              : "Sign in to save your own plan. "}
            Recovery estimates and load tips are simple guides; adjust for
            technique, fatigue and your coach's advice.
          </Typography>
        </Box>
      </Container>

      <CustomizeTypesDialog
        open={customizeOpen}
        types={plan.types}
        onClose={() => setCustomizeOpen(false)}
        onSave={(types) => {
          setPlan((current) => replaceWorkoutTypes(current, types));
          setCustomizeOpen(false);
        }}
      />
    </Box>
  );
}
