// components/SixLegTreeView.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, CornerDownRight } from "lucide-react";
import clsx from "clsx";

// --- TYPES ---
type Agent = {
  id: string;
  name: string;
  volumeLabel: string;
  active?: boolean;
};

type Leg = {
  id: string;
  head: Agent;
  children?: Agent[];
};

type Props = {
  title?: string;
  subtitle?: string;
  legs: Leg[];
};

// --- MAIN COMPONENT ---
export default function SixLegTreeView({
  title = "Binary Tree View",
  subtitle = "Your left and right leg downlines.",
  legs,
}: Props) {
  return (
    <Card className="bg-[#0b0b0b] border border-neutral-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        </div>
        <p className="text-neutral-400 mt-1">{subtitle}</p>
      </CardHeader>

      <CardContent>
        {legs && legs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {legs.map((leg) => (
              <Leg key={leg.id} leg={leg} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-8">
            No team members found in your downline yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- SUBCOMPONENTS ---
function Leg({ leg }: { leg: Leg }) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-neutral-300">{leg.id}</h3>
      <div className="space-y-1">
        <AgentRow agent={leg.head} />
        {leg.children && leg.children.length > 0 && (
          <div className="pl-4 border-l border-dashed border-neutral-700 ml-3">
            {leg.children.map((child) => (
              <AgentRow key={child.id} agent={child} isChild />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentRow({ agent, isChild }: { agent: Agent; isChild?: boolean }) {
  const active = agent.active ?? true;

  return (
    <div className="flex items-center gap-3 py-1.5 relative">
      {isChild && (
        <CornerDownRight className="absolute -left-[13px] top-3 h-4 w-4 text-neutral-500" />
      )}
      <div
        className={clsx(
          "h-7 w-7 shrink-0 grid place-items-center rounded-full text-xs font-bold",
          active
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-red-500/20 text-red-400"
        )}
      >
        {agent.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold text-white/95">{agent.name}</p>
        <p className="text-xs text-neutral-400">{agent.volumeLabel}</p>
      </div>
    </div>
  );
}
