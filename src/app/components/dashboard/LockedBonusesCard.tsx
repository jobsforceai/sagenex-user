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
        team: { current: number; required: number };
        directs: { current: number; required: number };
    };
}

const LockedBonusesCard = ({ bonuses }: { bonuses: LockedBonus[] | undefined }) => {
    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Locked Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
                {bonuses && bonuses.length > 0 ? (
                    <div className="space-y-4">
                        {bonuses.map(bonus => {
                            const teamProgress = Math.min(100, (bonus.progress.team.current / bonus.progress.team.required) * 100);
                            const directsProgress = Math.min(100, (bonus.progress.directs.current / bonus.progress.directs.required) * 100);
                            
                            return (
                                <div key={bonus.level} className="p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            {bonus.isUnlocked ? (
                                                <Unlock className="text-emerald-400 h-5 w-5" />
                                            ) : (
                                                <Lock className="text-amber-400 h-5 w-5" />
                                            )}
                                            <p className="text-gray-200 font-semibold">{bonus.name}</p>
                                        </div>
                                        <span className={`font-bold text-xl ${bonus.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${bonus.lockedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                <span>Team Progress</span>
                                                <span className="font-medium">{bonus.progress.team.current} / {bonus.progress.team.required}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                <div 
                                                    className="bg-sky-500 h-2.5 rounded-full" 
                                                    style={{ width: `${teamProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                <span>Directs Progress</span>
                                                <span className="font-medium">{bonus.progress.directs.current} / {bonus.progress.directs.required}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                <div 
                                                    className="bg-emerald-500 h-2.5 rounded-full" 
                                                    style={{ width: `${directsProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">{bonus.unlockRequirement}</p>
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
