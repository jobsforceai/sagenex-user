// components/Leaderboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import clsx from "clsx";

type LeaderboardEntry = {
  rank: number;
  userId: string | null;
  fullName: string;
  profilePicture: string | null;
  packagesSold: number;
  earnings: number;
};

type Props = {
  leaderboardData: LeaderboardEntry[];
  currentUserId?: string;
};

export default function Leaderboard({ leaderboardData, currentUserId }: Props) {
  return (
    <Card className="bg-[#0b0b0b] border border-neutral-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-2xl tracking-tight">Leaderboard</CardTitle>
        </div>
        <CardDescription className="text-neutral-400">
          Top agents by packages sold this month
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="max-h-[420px] overflow-auto rounded-lg border border-neutral-800/60">
          <Table className="table-fixed">
            <TableHeader className="bg-neutral-950/60 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead className="w-[52%]">Agent</TableHead>
                <TableHead className="w-28 text-right">Packages</TableHead>
                <TableHead className="w-40 text-right">Earnings</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leaderboardData.map((user, idx) => {
                const isCurrent = user.userId === currentUserId;
                return (
                  <TableRow
                    key={user.rank}
                    className={clsx(
                      "text-sm leading-tight",
                      "hover:bg-neutral-900/60",
                      isCurrent && "bg-emerald-500/10"
                    )}
                  >
                    {/* Rank */}
                    <TableCell className="text-center font-semibold">
                      {idx === 0 ? (
                        <Crown className="h-5 w-5 mx-auto text-yellow-400" />
                      ) : (
                        <span className="text-neutral-400">{user.rank}</span>
                      )}
                    </TableCell>

                    {/* Agent */}
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0 border border-neutral-700">
                          {user.profilePicture && (
                            <AvatarImage src={user.profilePicture} />
                          )}
                          <AvatarFallback className="bg-neutral-700 text-neutral-300">
                            {user.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            {user.packagesSold} packages sold
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Packages (number only for neat columns) */}
                    <TableCell className="text-right tabular-nums">
                      {user.packagesSold}
                    </TableCell>

                    {/* Earnings */}
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-400 tabular-nums">
                        {formatCurrency(user.earnings)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
