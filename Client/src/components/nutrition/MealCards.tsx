import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import NightsStayOutlinedIcon from "@mui/icons-material/NightsStayOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";
import { Cell, Pie, PieChart } from "recharts";

import { BODY, INK, LINE, MUTED, SURFACE } from "../workout/ui";
import {
  groupMeals,
  splitFoods,
  type MainKind,
  type RichMeal,
} from "./mealMacros";

const MACRO_COLORS = {
  protein: "#0284c7",
  carbs: "#f59e0b",
  fat: "#8b5cf6",
} as const;

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

const MAIN_STYLE: Record<
  MainKind,
  { bg: string; border: string; accent: string; Icon: React.ElementType }
> = {
  breakfast: { bg: "#fffbeb", border: "#fde68a", accent: "#b45309", Icon: WbSunnyOutlinedIcon },
  lunch: { bg: "#f0f9ff", border: "#bae6fd", accent: "#0369a1", Icon: CloudOutlinedIcon },
  dinner: { bg: "#eef2ff", border: "#c7d2fe", accent: "#4338ca", Icon: NightsStayOutlinedIcon },
};

function extraIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  if (/pre/.test(n)) return BoltOutlinedIcon;
  if (/post/.test(n)) return FitnessCenterOutlinedIcon;
  return CookieOutlinedIcon;
}

function MacroDonut({ meal }: { meal: RichMeal }) {
  const { protein, carbs, fat } = meal;
  if (protein === undefined || carbs === undefined || fat === undefined) {
    return null;
  }

  const slices = [
    { key: "protein", label: "Protein", grams: protein },
    { key: "carbs", label: "Carbs", grams: carbs },
    { key: "fat", label: "Fat", grams: fat },
  ] as const;

  const data = slices.map((s) => ({
    name: s.label,
    value: s.grams * KCAL_PER_GRAM[s.key],
    fill: MACRO_COLORS[s.key],
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0 && meal.calories === undefined) return null;

  const kcal = meal.calories ?? Math.round(total);
  const summary =
    `${meal.meal}: ${kcal} kcal. Protein ${protein} g, carbs ${carbs} g, fat ${fat} g.`;

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{ mt: 2, pt: 2, borderTop: `1px solid ${LINE}` }}
    >
      <Box
        role="img"
        aria-label={summary}
        sx={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}
      >
        <Box aria-hidden sx={{ width: 92, height: 92 }}>
          <PieChart width={92} height={92} accessibilityLayer={false}>
            <Pie
              data={total > 0 ? data : [{ name: "None", value: 1, fill: LINE }]}
              dataKey="value"
              innerRadius={30}
              outerRadius={44}
              paddingAngle={total > 0 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {(total > 0 ? data : [{ fill: LINE }]).map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </Box>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 16, lineHeight: 1, color: INK }}>
              {kcal}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 11, color: MUTED }}>
              kcal
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        component="ul"
        aria-hidden
        sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.5, minWidth: 0 }}
      >
        {slices.map((s) => (
          <Box
            component="li"
            key={s.key}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: MACRO_COLORS[s.key],
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 14, color: BODY, fontWeight: 700 }}>
              {s.label}{" "}
              <Box component="span" sx={{ color: INK, fontWeight: 900 }}>
                {s.grams}g
              </Box>
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

function FoodList({ foods }: { foods: string }) {
  const items = splitFoods(foods);
  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        mt: 1.5,
        pl: 3,
        color: INK,
        fontSize: 16,
        lineHeight: 1.6,
        "& li": { pl: 0.5, mb: 0.5, overflowWrap: "anywhere" },
        "& li::marker": { fontWeight: 900, color: MUTED },
      }}
    >
      {items.map((item, i) => (
        <li key={`${i}-${item}`}>{item}</li>
      ))}
    </Box>
  );
}

function MealCard({
  meal,
  Icon,
  bg,
  border,
  accent,
  dashed,
}: {
  meal: RichMeal;
  Icon: React.ElementType;
  bg: string;
  border: string;
  accent: string;
  dashed?: boolean;
}) {
  return (
    <Box
      component="article"
      sx={{
        height: "100%",
        minWidth: 0,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        bgcolor: bg,
        border: `1px ${dashed ? "dashed" : "solid"} ${border}`,
        textAlign: "left",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.75)",
            color: accent,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <Typography
          variant="h6"
          component="h3"
          sx={{ fontWeight: 950, fontSize: 20, color: accent, overflowWrap: "anywhere" }}
        >
          {meal.meal}
        </Typography>
      </Stack>
      <FoodList foods={meal.foods} />
      <MacroDonut meal={meal} />
    </Box>
  );
}

const sectionHeadingSx = {
  fontWeight: 900,
  fontSize: 18,
  color: INK,
  mb: 1.5,
} as const;

export default function MealCards({ meals }: { meals: RichMeal[] }) {
  const { main, extras } = groupMeals(meals);

  return (
    <>
      {main.length > 0 && (
        <Box component="section" sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="h2" sx={sectionHeadingSx}>
            Main meals
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                md: `repeat(${main.length}, minmax(0, 1fr))`,
              },
            }}
          >
            {main.map(({ kind, meal }) => (
              <MealCard key={kind} meal={meal} {...MAIN_STYLE[kind]} />
            ))}
          </Box>
        </Box>
      )}

      {extras.length > 0 && (
        <Box
          component="section"
          sx={{
            minWidth: 0,
            mt: main.length > 0 ? 3 : 0,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            bgcolor: SURFACE,
            border: `1px solid ${LINE}`,
          }}
        >
          <Typography variant="h6" component="h2" sx={sectionHeadingSx}>
            Around training and snacks
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {extras.map((meal, i) => (
              <MealCard
                key={`${i}-${meal.meal}`}
                meal={meal}
                Icon={extraIcon(meal.meal)}
                bg="#fff"
                border="#94a3b8"
                accent={INK}
                dashed
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
