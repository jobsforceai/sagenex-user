export type QuestStatus =
  | "locked"
  | "in_progress"
  | "pending_review"
  | "claimable"
  | "claimed";

export type QuestKeyStatus = "locked" | "in_progress" | "complete";

export type QuestType = "luxury" | "travel";

export type QuestKey = {
  id: string;
  label: string;
  current: number;
  required: number;
  unit: "INR" | "count";
  currentDisplay: string;
  requiredDisplay: string;
  remainingDisplay: string;
  progressPct: number;
  status: QuestKeyStatus;
  helpText: string;
  cta?: { label: string; href: string };
};

/** Shape returned by GET /api/v1/rewards/quests */
export type RewardQuestApi = {
  id: string;
  type: QuestType;
  title: string;
  rewardDescription: string;
  imageUrl?: string;
  status: QuestStatus;
  window: {
    startsAt: string;
    endsAt: string;
    daysLeft: number;
    expired: boolean;
  };
  keys: QuestKey[];
  primaryBlocker: string;
  isActiveQuest: boolean;
};

/** UI-enriched quest (API fields + presentation metadata) */
export type RewardQuest = RewardQuestApi & {
  subtitle: string;
  icon: "sparkles" | "trophy" | "target" | "crown" | "plane" | "ship";
  gradient: string;
  overallProgressPct: number;
  nextAction: string;
  window: RewardQuestApi["window"] & {
    label: string;
  };
};

export type TodayMission = {
  id: string;
  text: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
  priority: "urgent" | "normal";
};
