export interface UnilevelBonus {
  level: number;
  name: string;
  unlockRequirement: string;
  memberCount: number;
}

export const UNILEVEL_BONUSES: UnilevelBonus[] = [
  {
    level: 1,
    name: "Level 1 Bonus",
    unlockRequirement: "Unlock with 36 team members",
    memberCount: 36,
  },
  {
    level: 2,
    name: "Level 2 Bonus",
    unlockRequirement: "Unlock with 216 team members",
    memberCount: 216,
  },
  {
    level: 3,
    name: "Level 3 Bonus",
    unlockRequirement: "Unlock with 1,296 team members",
    memberCount: 1296,
  },
  {
    level: 4,
    name: "Level 4 Bonus",
    unlockRequirement: "Unlock with 7,776 team members",
    memberCount: 7776,
  },
  {
    level: 5,
    name: "Level 5 Bonus",
    unlockRequirement: "Unlock with 46,656 team members",
    memberCount: 46656,
  },
  {
    level: 6,
    name: "Level 6 Bonus",
    unlockRequirement: "Unlock with 279,936 team members",
    memberCount: 279936,
  },
];
