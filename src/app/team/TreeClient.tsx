"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { transformDataToFlow } from "@/lib/utils";
import { UserNode } from "@/types";
import { Expand, Lock, Maximize2, Minus, Plus, Search, Unlock, PhoneCall, MessageCircle, X } from "lucide-react";
import { getTeamNodeSubtree, findUserInDownline, getTeamMemberContact } from "@/actions/user";
import { UserIdLabel } from "@/components/common/UserIdLabel";
import { track } from "@/lib/posthog";
import { toast } from "sonner";

interface TreeClientProps {
  tree: UserNode;
}

const TreeClient = ({ tree: initialTree }: TreeClientProps) => {
  const [tree, setTree] = useState<UserNode>(initialTree);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const [locked, setLocked] = useState(false);
  const [expanding, setExpanding] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  // Selected-member action bar
  const [selected, setSelected] = useState<{ userId: string; fancyId?: string | null; fullName?: string; phone?: string | null; packageUSD?: number; isPackageActive?: boolean; sponsor?: { userId: string; fancyId?: string | null; fullName: string } | null; totalLifetimeEarnings?: number; lastMonthEarnings?: number } | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const { nodes, edges } = useMemo(() => transformDataToFlow(tree), [tree]);

  // Merge a freshly-fetched subtree into the in-memory tree at the matching node.
  const mergeSubtree = useCallback((subtree: UserNode) => {
    setTree((prev) => mergeNodeInTree(prev, subtree));
  }, []);

  const expandNode = useCallback(async (userId: string) => {
    if (expanding.has(userId)) return;
    setExpanding((s) => new Set(s).add(userId));
    try {
      const { subtree } = await getTeamNodeSubtree(userId, 2);
      if (subtree) mergeSubtree(subtree);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to expand node";
      toast.error(msg);
    } finally {
      setExpanding((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  }, [expanding, mergeSubtree]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      const target = findNodeInTree(tree, node.id);
      if (!target) return;
      // Show action bar for any clicked node that isn't the root (self).
      const isRoot = node.id === tree.userId;
      if (!isRoot) {
        setSelected({ userId: target.userId, fullName: target.fullName });
        track("tree_node_action_bar_opened", { userId: target.userId });
        setSelectedLoading(true);
        getTeamMemberContact(node.id)
          .then(res => {
            if (res?.error || !res?.member) {
              setSelected(s => s && s.userId === node.id ? { ...s, phone: null } : s);
            } else {
              setSelected({
                userId: res.member.userId,
                fancyId: (res.member as any).fancyId ?? null,
                fullName: res.member.fullName,
                phone: res.member.phone,
                packageUSD: res.member.packageUSD,
                isPackageActive: res.member.isPackageActive,
                sponsor: res.member.sponsor
                  ? { userId: res.member.sponsor.userId, fancyId: (res.member.sponsor as any).fancyId ?? null, fullName: res.member.sponsor.fullName }
                  : null,
                totalLifetimeEarnings: res.member.totalLifetimeEarnings,
                lastMonthEarnings: res.member.lastMonthEarnings,
              });
            }
          })
          .catch(() => {
            setSelected(s => s && s.userId === node.id ? { ...s, phone: null } : s);
          })
          .finally(() => setSelectedLoading(false));
      }
      // Expand subtree if more children exist (existing behaviour kept).
      const loadedKids = target.children?.length ?? 0;
      const totalKids = target.childrenCount ?? loadedKids;
      if (totalKids > loadedKids) {
        void expandNode(node.id);
      }
    },
    [tree, expandNode]
  );

  const handleSearch = useCallback(async () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSearching(true);
    track("tree_search_executed", { query: trimmed });
    try {
      const result = await findUserInDownline(trimmed);
      const path: string[] = result?.ancestorPath ?? [];
      // Expand every ancestor along the path so the target becomes visible.
      for (const ancestorId of path) {
        const node = findNodeInTree(tree, ancestorId);
        if (!node) {
          // Ancestor not yet loaded — fetch it. Then re-resolve.
          await expandNode(ancestorId);
        } else if ((node.childrenCount ?? 0) > (node.children?.length ?? 0)) {
          await expandNode(ancestorId);
        }
      }
      // Center on target if it ended up in view.
      setTimeout(() => flow?.fitView({ padding: 0.3, duration: 500, nodes: [{ id: trimmed }] as never }), 250);
      toast.success(`Found ${trimmed} in your downline`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "User not found in your downline";
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  }, [searchInput, tree, expandNode, flow]);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-black text-[#0F172A] sm:text-lg">Team Structure</h2>
          <p className="mt-1 hidden text-xs text-[#64748B] sm:block">Click any node to expand the next 2 levels.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-[#64748B] sm:mt-3 sm:gap-5 sm:text-xs">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-300" />Inactive</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C8103E]" />Left</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 shadow-sm focus-within:border-[#C8103E] focus-within:ring-2 focus-within:ring-[#C8103E]/20 sm:h-11 sm:flex-none sm:gap-2 sm:px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Find ID"
              className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none sm:w-44 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !searchInput.trim()}
              className="rounded-md bg-[#C8103E] px-3 py-1 text-xs font-bold !text-white disabled:opacity-50"
            >
              {searching ? "…" : "Go"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => flow?.fitView({ padding: 0.2, duration: 500 })}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0F172A] shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Expand className="h-4 w-4" />
            Fit
          </button>
        </div>
      </div>

      <div className="relative mt-3 h-[430px] overflow-hidden rounded-2xl border border-slate-100 bg-[radial-gradient(circle_at_50%_0%,rgba(236,253,245,0.65),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] sm:mt-5 sm:h-[640px] sm:rounded-3xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.25}
          maxZoom={1.6}
          nodesDraggable={!locked}
          nodesConnectable={false}
          panOnDrag={!locked}
          zoomOnScroll={!locked}
          zoomOnPinch={!locked}
          onInit={setFlow}
          onNodeClick={handleNodeClick}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#E2E8F0" gap={22} size={1} />
        </ReactFlow>

        <div className="absolute bottom-4 left-3 z-10 flex flex-col gap-1.5 sm:bottom-8 sm:left-7 sm:gap-2">
          {[
            { label: "Zoom in", icon: Plus, onClick: () => flow?.zoomIn({ duration: 220 }) },
            { label: "Zoom out", icon: Minus, onClick: () => flow?.zoomOut({ duration: 220 }) },
            { label: "Fit view", icon: Maximize2, onClick: () => flow?.fitView({ padding: 0.2, duration: 500 }) },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20 sm:h-11 sm:w-11 sm:rounded-xl"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLocked((value) => !value)}
            aria-label={locked ? "Unlock tree" : "Lock tree"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20 sm:h-11 sm:w-11 sm:rounded-xl"
          >
            {locked ? <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>

        <div className="absolute bottom-4 right-3 z-10 hidden rounded-2xl border border-slate-200 bg-white/95 p-4 text-xs text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:bottom-8 sm:right-7 sm:block">
          <div className="space-y-2">
            <p><span className="mr-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Green</span> Active Members</p>
            <p><span className="mr-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Gray</span> Inactive Members</p>
            <p><span className="mr-2 inline-block rounded-full bg-[#FFF1F4] px-2 py-1 text-[10px] font-bold text-[#C8103E]">Red</span> Left Members</p>
          </div>
        </div>

        {/* Selected-member action panel (Call / WhatsApp) */}
        {selected && (
          <div className="absolute inset-x-3 top-3 z-20 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:inset-x-auto sm:right-7 sm:top-7 sm:w-72 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {selected.sponsor && (
                  <p className="mb-1 truncate text-[10px] text-[#64748B]">
                    Sponsor ·{" "}
                    <span className="font-bold text-[#0F172A]">
                      <UserIdLabel userId={selected.sponsor.userId} fancyId={selected.sponsor.fancyId ?? null} variant="fancy-only" />
                    </span>
                    {selected.sponsor.fullName ? ` · ${selected.sponsor.fullName}` : ""}
                  </p>
                )}
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#64748B] sm:text-[10px]">Selected member</p>
                <p className="mt-1 truncate text-sm font-black text-[#0F172A] sm:text-base">{selected.fullName ?? selected.userId}</p>
                <p className="text-xs font-bold text-[#64748B]">
                  <UserIdLabel userId={selected.userId} fancyId={selected.fancyId ?? null} variant="fancy-only" />
                </p>
                {typeof selected.packageUSD === "number" && selected.packageUSD > 0 && (
                  <p className="mt-1 text-[11px] text-[#0F172A]">
                    Package ₹{selected.packageUSD.toLocaleString("en-IN")} · {selected.isPackageActive ? <span className="font-bold text-emerald-700">Active</span> : <span className="font-bold text-slate-500">Inactive</span>}
                  </p>
                )}
                {(typeof selected.totalLifetimeEarnings === "number" || typeof selected.lastMonthEarnings === "number") && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.06em] text-emerald-700">Lifetime</p>
                      <p className="mt-0.5 truncate text-xs font-black text-emerald-700">₹{Math.round(selected.totalLifetimeEarnings ?? 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-lg bg-sky-50 px-2 py-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.06em] text-sky-700">Last month</p>
                      <p className="mt-0.5 truncate text-xs font-black text-sky-700">₹{Math.round(selected.lastMonthEarnings ?? 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedLoading ? (
              <div className="mt-3 h-10 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={selected.phone ? `tel:${selected.phone}` : undefined}
                  aria-disabled={!selected.phone}
                  onClick={() => track("tree_node_call_clicked", { userId: selected.userId })}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${selected.phone ? "bg-[#0F172A] !text-white hover:opacity-90" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
                >
                  <PhoneCall className="h-4 w-4" />
                  <span className="hidden sm:inline">Call</span>
                </a>
                <a
                  href={selected.phone ? `https://wa.me/${(selected.phone.replace(/\\D/g, "").length === 10 ? "91" : "") + selected.phone.replace(/\\D/g, "")}?text=${encodeURIComponent(`Hi ${(selected.fullName ?? "").split(" ")[0] || "there"}, wanted to chat about your Sagenex journey.`)}` : undefined}
                  target="_blank" rel="noopener noreferrer"
                  aria-disabled={!selected.phone}
                  onClick={() => track("tree_node_whatsapp_clicked", { userId: selected.userId })}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${selected.phone ? "bg-emerald-500 !text-white hover:bg-emerald-600" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            )}
            {!selectedLoading && !selected.phone && (
              <p className="mt-2 text-[11px] text-[#94A3B8]">No phone number on file for this member.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TreeClient;

// Recursively find a node in the tree by userId.
function findNodeInTree(root: UserNode, userId: string): UserNode | null {
  if (root.userId === userId) return root;
  for (const child of root.children || []) {
    const hit = findNodeInTree(child, userId);
    if (hit) return hit;
  }
  return null;
}

// Replace the matching node in the tree with the freshly-fetched subtree.
function mergeNodeInTree(root: UserNode, subtree: UserNode): UserNode {
  if (root.userId === subtree.userId) {
    return { ...root, ...subtree };
  }
  return {
    ...root,
    children: (root.children || []).map((c) => mergeNodeInTree(c, subtree)),
  };
}
