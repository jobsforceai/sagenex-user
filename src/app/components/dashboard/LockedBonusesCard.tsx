"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Unlock } from "lucide-react";

interface LockedBonus {
    level: number;
    name: string;
    lockedAmount: number;
    isUnlocked: boolean;
    unlockRequirement: string;
    progress: {
        activeLegs?: { current: number; required: number; depth?: number };
        activeTeam?: { current: number; required: number };
        testQualified?: { current: number; required: number };
    };
}

const LockedBonusesCard = ({ bonuses }: { bonuses: LockedBonus[] | undefined }) => {
    const getProgressPct = (current: number, required: number) =>
        required > 0 ? Math.min(100, (current / required) * 100) : 100;

    // Backend levels start at 1; UI displays levels starting at 2.
    const displayLevel = (level: number) => level + 1;
    // Shift any "L<number>" and "Level <number>" tokens to match UI numbering.
    const shiftLevelLabel = (value: string) =>
        value
            .replace(/\bL(\d+)\b/g, (_, raw) => `L${Number(raw) + 1}`)
            .replace(/\bLevel\s+(\d+)\b/g, (_, raw) => `Level ${Number(raw) + 1}`);

    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Locked Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
                {bonuses && bonuses.length > 0 ? (
                    <div className="space-y-4">
                        {bonuses.map(bonus => {
                            const progressItems = [
                                bonus.progress?.activeLegs && {
                                    label: bonus.progress.activeLegs.depth
                                        ? `Active legs (depth ${bonus.progress.activeLegs.depth})`
                                        : "Active legs",
                                    current: bonus.progress.activeLegs.current,
                                    required: bonus.progress.activeLegs.required,
                                    barClass: "bg-sky-500",
                                },
                                bonus.progress?.activeTeam && {
                                    label: "Active team",
                                    current: bonus.progress.activeTeam.current,
                                    required: bonus.progress.activeTeam.required,
                                    barClass: "bg-emerald-500",
                                },
                                bonus.progress?.testQualified && {
                                    label: "Tests qualified",
                                    current: bonus.progress.testQualified.current,
                                    required: bonus.progress.testQualified.required,
                                    barClass: "bg-amber-500",
                                    isTestStatus: true,
                                },
                            ].filter(
                                (item): item is { label: string; current: number; required: number; barClass: string; isTestStatus?: boolean } =>
                                    Boolean(item)
                            );
                            const imageLevel = displayLevel(bonus.level);
                            const displayName = bonus.name?.trim()
                                ? `${shiftLevelLabel(bonus.name)} - Level ${imageLevel}`
                                : `Matrix Level ${imageLevel}`;
                            const displayRequirement = bonus.unlockRequirement
                                ? shiftLevelLabel(bonus.unlockRequirement)
                                : "";
                            
                            return (
                                <div key={bonus.level} className="p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            {bonus.isUnlocked ? (
                                                <Unlock className="text-emerald-400 h-5 w-5" />
                                            ) : (
                                                <Lock className="text-amber-400 h-5 w-5" />
                                            )}
                                            <p className="text-gray-200 font-semibold">{displayName}</p>
                                        </div>
                                        <span className={`font-bold text-xl ${bonus.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${bonus.lockedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {progressItems.length > 0 ? (
                                            progressItems.map((item) =>
                                                item.isTestStatus ? (
                                                    <div
                                                        key={item.label}
                                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                                                            item.current >= item.required
                                                                ? "border-emerald-500/40 bg-emerald-500/10"
                                                                : "border-gray-700/50 bg-black/30"
                                                        }`}
                                                    >
                                                        <span
                                                            className={
                                                                item.current >= item.required
                                                                    ? "text-emerald-200"
                                                                    : "text-gray-400"
                                                            }
                                                        >
                                                            Test status
                                                        </span>
                                                        {item.current >= item.required ? (
                                                            <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-200">
                                                                Passed
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
                                                                Not passed
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div key={item.label}>
                                                        <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                            <span>{item.label}</span>
                                                            <span className="font-medium">
                                                                {item.current} / {item.required}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                            <div
                                                                className={`${item.barClass} h-2.5 rounded-full`}
                                                                style={{ width: `${getProgressPct(item.current, item.required)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <p className="text-xs text-gray-500">Progress data unavailable.</p>
                                        )}
                                    </div>
                                    {displayRequirement && (
                                        <p className="text-xs text-gray-500 mt-3">
                                            {displayRequirement}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No locked bonuses at the moment.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default LockedBonusesCard;
