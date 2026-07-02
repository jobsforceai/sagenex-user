import type { RewardQuest, RewardQuestApi, TodayMission } from "./types";

type QuestVisual = {
  subtitle: string;
  icon: NonNullable<RewardQuest["icon"]>;
  gradient: string;
};

const LUXURY_VISUALS: Record<string, QuestVisual> = {
  "10L": {
    subtitle: "Level 1 · Starter",
    icon: "sparkles",
    gradient: "rewards-hero-active",
  },
  "30L": {
    subtitle: "Level 2 · Mid",
    icon: "trophy",
    gradient: "rewards-hero-tier-2",
  },
  "50L": {
    subtitle: "Level 3 · Elite",
    icon: "target",
    gradient: "rewards-hero-tier-3",
  },
  "1CR": {
    subtitle: "Level 4 · Crown",
    icon: "crown",
    gradient: "rewards-hero-tier-4",
  },
};

const TRAVEL_VISUALS: Record<string, QuestVisual> = {
  "europe-trip-2026": {
    subtitle: "Travel quest",
    icon: "plane",
    gradient: "rewards-hero-travel",
  },
  "cruise-trip-2026": {
    subtitle: "Travel quest",
    icon: "ship",
    gradient: "rewards-hero-travel-alt",
  },
};

function questVisual(quest: RewardQuestApi): QuestVisual {
  const table = quest.type === "luxury" ? LUXURY_VISUALS : TRAVEL_VISUALS;
  if (table[quest.id]) return table[quest.id];

  return quest.type === "luxury"
    ? { subtitle: "Luxury quest", icon: "sparkles", gradient: "rewards-hero-tier-2" }
    : { subtitle: "Travel quest", icon: "plane", gradient: "rewards-hero-travel" };
}

function windowLabel(quest: RewardQuestApi): string {
  const start = new Date(quest.window.startsAt).getTime();
  const end = new Date(quest.window.endsAt).getTime();
  if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
    const days = Math.round((end - start) / (24 * 3600 * 1000));
    if (days > 0) return `${days}-day window`;
  }
  return quest.type === "travel" ? "Program window" : "Reward window";
}

function overallProgressPct(quest: RewardQuestApi): number {
  if (!quest.keys.length) return 0;
  const total = quest.keys.reduce((sum, key) => sum + key.progressPct, 0);
  return Math.min(100, Math.round(total / quest.keys.length));
}

function nextAction(quest: RewardQuestApi): string {
  if (quest.status === "claimable") {
    return `Claim your ${quest.title} reward`;
  }
  if (quest.status === "pending_review") {
    return `Your ${quest.title} claim is under review`;
  }
  if (quest.status === "claimed") {
    return `You unlocked ${quest.title}`;
  }

  const activeKey = quest.keys.find((k) => k.status === "in_progress");
  if (activeKey?.cta?.label) return activeKey.cta.label;
  if (activeKey?.remainingDisplay && activeKey.remainingDisplay !== "Done") {
    return activeKey.label === "ID verified"
      ? activeKey.remainingDisplay
      : `${activeKey.label}: ${activeKey.remainingDisplay}`;
  }

  return quest.primaryBlocker;
}

export function enrichQuest(quest: RewardQuestApi): RewardQuest {
  const visual = questVisual(quest);
  return {
    ...quest,
    ...visual,
    overallProgressPct: overallProgressPct(quest),
    nextAction: nextAction(quest),
    window: {
      ...quest.window,
      label: windowLabel(quest),
    },
  };
}

export function enrichQuests(quests: RewardQuestApi[]): RewardQuest[] {
  return quests.map(enrichQuest);
}

export function getActiveQuest(quests: RewardQuest[]): RewardQuest | null {
  return (
    quests.find((q) => q.isActiveQuest) ??
    quests.find((q) => q.status === "in_progress" || q.status === "claimable") ??
    quests[0] ??
    null
  );
}

export function getLuxuryQuests(quests: RewardQuest[]): RewardQuest[] {
  return quests.filter((q) => q.type === "luxury");
}

export function getTravelQuests(quests: RewardQuest[]): RewardQuest[] {
  return quests.filter((q) => q.type === "travel");
}

export function buildMissionsFromQuests(quests: RewardQuest[]): TodayMission[] {
  const missions: TodayMission[] = [];

  for (const quest of quests) {
    if (quest.status === "claimable") {
      missions.push({
        id: `claim-${quest.id}`,
        text: `Claim your ${quest.title} reward`,
        actionLabel: "View rewards",
        href: "#reward-claims",
        priority: "urgent",
      });
    }

    if (quest.status === "pending_review") {
      missions.push({
        id: `review-${quest.id}`,
        text: `${quest.title} is waiting for admin review`,
        actionLabel: "View status",
        href: "#reward-claims",
        priority: "normal",
      });
    }
  }

  const focus = getActiveQuest(quests);
  if (focus) {
    for (const key of focus.keys) {
      if (key.status !== "in_progress" || !key.cta) continue;
      if (missions.some((m) => m.href === key.cta?.href)) continue;
      missions.push({
        id: `key-${focus.id}-${key.id}`,
        text:
          key.remainingDisplay && key.remainingDisplay !== "Done"
            ? `${focus.title}: ${key.remainingDisplay}`
            : `${focus.title}: complete ${key.label.toLowerCase()}`,
        actionLabel: key.cta.label,
        href: key.cta.href,
        priority: key.id.includes("kyc") ? "urgent" : "normal",
      });
    }
  }

  return missions.slice(0, 3);
}
