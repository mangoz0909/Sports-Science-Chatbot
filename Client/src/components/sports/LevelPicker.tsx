import React from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import GroupsIcon from "@mui/icons-material/Groups";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import BlockIcon from "@mui/icons-material/Block";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import PanToolIcon from "@mui/icons-material/PanTool";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import SportsGolfIcon from "@mui/icons-material/SportsGolf";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { INK, LINE, MUTED, SURFACE, captionSx } from "../workout/ui";

export type Level = 1 | 2 | 3 | 4 | 5;
export type LevelIcon = React.ElementType;

export type LevelOption = { icon: LevelIcon; label: string };

export type PreferenceKey = "teamwork" | "intensity" | "contact" | "coordination";

export type PreferenceScale = {
  /** Accessible group name, e.g. "Intensity". */
  name: string;
  levels: readonly [LevelOption, LevelOption, LevelOption, LevelOption, LevelOption];
  /** Optional end captions for two-ended scales. */
  ends?: readonly [string, string];
};

export const PREFERENCE_SCALES: Record<PreferenceKey, PreferenceScale> = {
  teamwork: {
    name: "Team vs Solo",
    ends: ["Solo", "Team"],
    levels: [
      { icon: PersonIcon, label: "solo only" },
      { icon: PeopleIcon, label: "mostly solo" },
      { icon: GroupIcon, label: "either" },
      { icon: Diversity1Icon, label: "mostly team" },
      { icon: GroupsIcon, label: "team only" },
    ],
  },
  intensity: {
    name: "Intensity",
    levels: [
      { icon: SelfImprovementIcon, label: "very relaxed" },
      { icon: DirectionsWalkIcon, label: "easy" },
      { icon: DirectionsRunIcon, label: "moderate" },
      { icon: FitnessCenterIcon, label: "hard" },
      { icon: LocalFireDepartmentIcon, label: "all out" },
    ],
  },
  contact: {
    name: "Contact",
    levels: [
      { icon: BlockIcon, label: "no contact" },
      { icon: WavingHandIcon, label: "incidental contact" },
      { icon: PanToolIcon, label: "some contact" },
      { icon: SportsMmaIcon, label: "regular contact" },
      { icon: SportsKabaddiIcon, label: "full collision" },
    ],
  },
  coordination: {
    name: "Skill & Coordination",
    levels: [
      { icon: SportsSoccerIcon, label: "simple movements" },
      { icon: SportsBasketballIcon, label: "some skill" },
      { icon: SportsTennisIcon, label: "solid skill" },
      { icon: SportsGolfIcon, label: "fine technique" },
      { icon: PsychologyIcon, label: "highly technical" },
    ],
  },
};

/** The AI prompt reads preferences on a 1-10 scale; 5 levels map to 2,4,6,8,10. */
export function levelToScore(level: number): number {
  return level * 2;
}

type LevelPickerProps = {
  scale: PreferenceScale;
  value: Level;
  onChange: (level: Level) => void;
};

export default function LevelPicker({ scale, value, onChange }: LevelPickerProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const select = (level: number, focus: boolean) => {
    const next = Math.min(5, Math.max(1, level)) as Level;
    onChange(next);
    if (focus) refs.current[next - 1]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(value + 1, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(value - 1, true);
        break;
      case "Home":
        event.preventDefault();
        select(1, true);
        break;
      case "End":
        event.preventDefault();
        select(5, true);
        break;
      default:
    }
  };

  const current = scale.levels[value - 1];

  return (
    <Box>
      <Box
        role="radiogroup"
        aria-label={scale.name}
        onKeyDown={onKeyDown}
        sx={{ display: "flex", gap: { xs: 0.75, sm: 1 }, width: "100%" }}
      >
        {scale.levels.map((option, index) => {
          const level = index + 1;
          const selected = level === value;
          const Icon = option.icon;
          return (
            <ButtonBase
              key={level}
              ref={(el: HTMLButtonElement | null) => {
                refs.current[index] = el;
              }}
              role="radio"
              aria-checked={selected}
              aria-label={`${scale.name} ${level} of 5, ${option.label}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(level, false)}
              focusRipple={false}
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                minHeight: 48,
                borderRadius: 2,
                border: `1.5px solid ${selected ? INK : LINE}`,
                bgcolor: selected ? INK : "#fff",
                color: selected ? "#fff" : MUTED,
                transition: "background-color .15s, border-color .15s, color .15s",
                "&:hover": {
                  borderColor: INK,
                  bgcolor: selected ? INK : SURFACE,
                },
                "&.Mui-focusVisible, &:focus-visible": {
                  outline: `3px solid ${INK}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Icon aria-hidden="true" fontSize="small" />
            </ButtonBase>
          );
        })}
      </Box>

      {scale.ends && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Typography component="span" sx={{ ...captionSx, fontSize: 12 }}>
            {scale.ends[0]}
          </Typography>
          <Typography component="span" sx={{ ...captionSx, fontSize: 12 }}>
            {scale.ends[1]}
          </Typography>
        </Box>
      )}

      <Typography
        aria-live="polite"
        sx={{
          mt: 0.5,
          fontSize: 13,
          fontWeight: 800,
          color: INK,
          textAlign: "center",
          textTransform: "capitalize",
        }}
      >
        {current.label}
      </Typography>
    </Box>
  );
}
