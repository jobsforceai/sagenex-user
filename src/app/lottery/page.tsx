"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buyLotteryTickets,
  getActiveLotteryPools,
  getDashboardData,
  getKycStatus,
  getLotteryPoolDetails,
  sendLotteryOtp,
} from "@/actions/user";
import { KycStatus } from "@/types";
import { ArrowLeft, ShieldCheck, Ticket, Trophy, Wallet } from "lucide-react";

type Prize = {
  rank: number;
  title: string;
  description?: string;
  imageUrl?: string;
};

type PoolSummary = {
  poolId: string;
  title: string;
  subtitle?: string;
  description?: string;
  ticketPrice: number;
  maxTickets: number;
  ticketsSold: number;
  ticketsLeft: number;
  status: string;
  prizes: Prize[];
  launchedAt?: string;
};

type PoolDetails = PoolSummary & {
  winners?: unknown[];
  myTicketsCount?: number;
  myTickets?: number[];
};

type Purchase = {
  poolId: string;
  quantity: number;
  ticketNumbers: number[];
  ticketPrice: number;
  totalCost: number;
  ticketsSold: number;
  ticketsLeft: number;
  status: string;
  transactionId: string;
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

type MarkdownOptions = {
  allowLinks?: boolean;
};

const markdownLinkClassName =
  "text-emerald-300 underline underline-offset-2 hover:text-emerald-200";

const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);

const parseInlineMarkdown = (text: string, options: MarkdownOptions, keyPrefix: string) => {
  const nodes: ReactNode[] = [];
  let remaining = text;
  const pattern =
    /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)/;
  let nodeIndex = 0;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match) {
      nodes.push(remaining);
      break;
    }

    const matchIndex = match.index ?? 0;
    if (matchIndex > 0) {
      nodes.push(remaining.slice(0, matchIndex));
    }

    const [fullMatch, , linkText, linkUrl] = match;
    if (linkText && linkUrl) {
      if (options.allowLinks && isSafeUrl(linkUrl)) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${nodeIndex}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={markdownLinkClassName}
          >
            {linkText}
          </a>
        );
      } else {
        nodes.push(linkText);
      }
    } else if (match[5] || match[7]) {
      const strongText = match[5] || match[7] || "";
      nodes.push(
        <strong key={`${keyPrefix}-strong-${nodeIndex}`} className="font-semibold text-white">
          {strongText}
        </strong>
      );
    } else if (match[9] || match[11]) {
      const emText = match[9] || match[11] || "";
      nodes.push(
        <em key={`${keyPrefix}-em-${nodeIndex}`} className="italic text-gray-300">
          {emText}
        </em>
      );
    } else {
      nodes.push(fullMatch);
    }

    remaining = remaining.slice(matchIndex + fullMatch.length);
    nodeIndex += 1;
  }

  return nodes;
};

const renderMarkdownBlocks = (content: string, options: MarkdownOptions) => {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const blocks = trimmed.split(/\n\s*\n/);

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    const isUnordered = lines.length > 0 && lines.every((line) => /^[-*+]\s+/.test(line.trim()));
    const isOrdered = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line.trim()));

    if (isUnordered || isOrdered) {
      const items = lines.map((line, lineIndex) => {
        const text = line.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");
        return (
          <li key={`li-${blockIndex}-${lineIndex}`} className="text-sm text-gray-400">
            {parseInlineMarkdown(text, options, `li-${blockIndex}-${lineIndex}`)}
          </li>
        );
      });
      const ListTag = isOrdered ? "ol" : "ul";
      return (
        <ListTag
          key={`list-${blockIndex}`}
          className={`${isOrdered ? "list-decimal" : "list-disc"} ml-4 space-y-1`}
        >
          {items}
        </ListTag>
      );
    }

    const paragraphLines = lines.map((line, lineIndex) => (
      <span key={`line-${blockIndex}-${lineIndex}`}>
        {parseInlineMarkdown(line, options, `p-${blockIndex}-${lineIndex}`)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    ));

    return (
      <p key={`p-${blockIndex}`} className="text-sm text-gray-400">
        {paragraphLines}
      </p>
    );
  });
};

const MarkdownText = ({
  content,
  className,
  allowLinks = true,
}: {
  content?: string;
  className?: string;
  allowLinks?: boolean;
}) => {
  if (!content) return null;
  return <div className={`space-y-2 ${className || ""}`}>{renderMarkdownBlocks(content, { allowLinks })}</div>;
};

const LotteryPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pools, setPools] = useState<PoolSummary[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<PoolDetails | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [verificationMethod, setVerificationMethod] = useState<"otp" | "password">("otp");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [brokenPrizeImages, setBrokenPrizeImages] = useState<Record<string, boolean>>({});
  const [activePrizeImage, setActivePrizeImage] = useState<{ url: string; title: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const parsedQuantity = useMemo(() => parseInt(quantity, 10), [quantity]);
  const isValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const ticketPrice = selectedPool?.ticketPrice ?? 0;
  const ticketsLeft = selectedPool?.ticketsLeft ?? 0;
  const totalCost = isValidQuantity ? parsedQuantity * ticketPrice : 0;
  const isKycVerified = kycStatus?.status === "VERIFIED";
  const isPoolActive = selectedPool?.status === "ACTIVE" && ticketsLeft > 0;
  const canAfford = totalCost > 0 && walletBalance >= totalCost;
  const hasVerification =
    verificationMethod === "otp" ? otp.trim().length > 0 : password.trim().length > 0;
  const canBuy =
    isPoolActive &&
    isKycVerified &&
    isValidQuantity &&
    parsedQuantity <= ticketsLeft &&
    canAfford &&
    hasVerification &&
    !buyLoading;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const [poolsRes, dashboardRes, kycRes] = await Promise.all([
          getActiveLotteryPools(),
          getDashboardData(),
          getKycStatus(),
        ]);

        if (poolsRes.error || dashboardRes.error || kycRes.error) {
          throw new Error(poolsRes.error || dashboardRes.error || kycRes.error || "Failed to load lottery data.");
        }

        const nextPools = poolsRes.pools || [];
        setPools(nextPools);
        if (!selectedPoolId && nextPools.length > 0) {
          setSelectedPoolId(nextPools[0].poolId);
        }
        setWalletBalance(dashboardRes.wallet?.availableBalance ?? 0);
        setKycStatus(kycRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedPoolId) {
      setSelectedPool(null);
      return;
    }
    const fetchDetails = async () => {
      setDetailsLoading(true);
      setError(null);
      try {
        const res = await getLotteryPoolDetails(selectedPoolId);
        if (res.error) {
          throw new Error(res.error);
        }
        setSelectedPool(res.pool);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pool details.");
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedPoolId]);

  const handleBuyTickets = async () => {
    if (!selectedPool || !isValidQuantity) return;
    setBuyLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (parsedQuantity > ticketsLeft) {
        throw new Error("Requested quantity exceeds tickets left.");
      }
      const otpValue = otp.trim();
      const passwordValue = password.trim();
      if (verificationMethod === "otp" && !otpValue) {
        throw new Error("OTP is required to complete this purchase.");
      }
      if (verificationMethod === "password" && !passwordValue) {
        throw new Error("Password is required to complete this purchase.");
      }
      const verificationPayload =
        verificationMethod === "otp"
          ? { otp: otpValue }
          : { password: passwordValue };
      const res = await buyLotteryTickets(selectedPool.poolId, parsedQuantity, verificationPayload);
      if (res.error) {
        throw new Error(res.error);
      }
      const purchase: Purchase = res.purchase;
      setNotice(res.message || "Tickets purchased successfully.");
      setWalletBalance((prev) => Math.max(0, prev - purchase.totalCost));
      setSelectedPool((prev) =>
        prev
          ? {
              ...prev,
              ticketsSold: purchase.ticketsSold,
              ticketsLeft: purchase.ticketsLeft,
              status: purchase.status,
              myTicketsCount: (prev.myTicketsCount || 0) + purchase.quantity,
              myTickets: [...(prev.myTickets || []), ...purchase.ticketNumbers],
            }
          : prev
      );
      setPools((prev) =>
        prev.map((pool) =>
          pool.poolId === purchase.poolId
            ? {
                ...pool,
                ticketsSold: purchase.ticketsSold,
                ticketsLeft: purchase.ticketsLeft,
                status: purchase.status,
              }
            : pool
        )
      );
      setOtp("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase tickets.");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await sendLotteryOtp();
      if (res.error) {
        throw new Error(res.error);
      }
      setNotice(res.message || "OTP sent to your registered email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const markPrizeImageBroken = (key: string) => {
    setBrokenPrizeImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  if (authLoading || loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24 space-y-6">
        <header className="space-y-2">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold">Lottery Pools</h1>
          <p className="text-gray-400">
            Join active draws, track your tickets, and claim exclusive rewards.
          </p>
        </header>

        {error && (
          <Card className="border-red-500/40 bg-red-500/10">
            <CardContent className="py-4 text-red-200">{error}</CardContent>
          </Card>
        )}
        {notice && (
          <Card className="border-emerald-500/40 bg-emerald-500/10">
            <CardContent className="py-4 text-emerald-200">{notice}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="bg-neutral-900/70 border-neutral-800">
              <CardHeader>
                <CardTitle>Active Pools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pools.length === 0 ? (
                  <p className="text-gray-400">No active pools available right now.</p>
                ) : (
                  pools.map((pool) => {
                    const isSelected = selectedPoolId === pool.poolId;
                    const soldPct =
                      pool.maxTickets > 0 ? Math.min(100, (pool.ticketsSold / pool.maxTickets) * 100) : 0;
                    return (
                      <button
                        key={pool.poolId}
                        type="button"
                        onClick={() => setSelectedPoolId(pool.poolId)}
                        className={`w-full text-left rounded-2xl border px-4 py-4 transition ${
                          isSelected
                            ? "border-emerald-400/60 bg-emerald-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">{pool.title}</span>
                              <span className="text-xs uppercase tracking-wide text-emerald-300">
                                {pool.status}
                              </span>
                            </div>
                            {pool.subtitle && (
                              <p className="text-sm text-gray-400">{pool.subtitle}</p>
                            )}
                            {pool.description && (
                              <MarkdownText
                                content={pool.description}
                                className="text-sm text-gray-500"
                                allowLinks={false}
                              />
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Ticket Price</p>
                            <p className="text-lg font-semibold">{formatCurrency(pool.ticketPrice)}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>
                              {pool.ticketsSold} sold / {pool.maxTickets} total
                            </span>
                            <span>{pool.ticketsLeft} left</span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-800">
                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${soldPct}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {selectedPool && (
              <Card className="bg-neutral-900/70 border-neutral-800">
                <CardHeader>
                  <CardTitle>Prizes</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPool.prizes?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedPool.prizes.map((prize) => {
                        const imageKey = `${selectedPool.poolId}-prize-${prize.rank}`;
                        const hasImage = !!prize.imageUrl && !brokenPrizeImages[imageKey];
                        return (
                          <div
                            key={imageKey}
                            className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2"
                          >
                            {hasImage ? (
                              <div
                                className="group relative w-full overflow-hidden rounded-lg bg-neutral-900 cursor-zoom-in"
                                style={{ aspectRatio: "16 / 9" }}
                                onClick={() =>
                                  setActivePrizeImage({ url: prize.imageUrl || "", title: prize.title })
                                }
                              >
                                <img
                                  src={prize.imageUrl}
                                  alt={prize.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={() => markPrizeImageBroken(imageKey)}
                                />
                                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="m-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs text-gray-200">
                                    View full
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="flex w-full items-center justify-center rounded-lg bg-neutral-900 text-xs text-gray-500"
                                style={{ aspectRatio: "16 / 9" }}
                              >
                                No image available
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-amber-200">
                              <Trophy className="h-4 w-4" />
                              <span>Rank {prize.rank}</span>
                            </div>
                            <p className="font-semibold">{prize.title}</p>
                            {prize.description && (
                              <MarkdownText content={prize.description} className="text-sm text-gray-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400">Prizes will be announced soon.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-neutral-900/70 border-neutral-800">
              <CardHeader>
                <CardTitle>Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    KYC Status
                  </span>
                  <span className={isKycVerified ? "text-emerald-300" : "text-amber-300"}>
                    {kycStatus?.status || "UNKNOWN"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-sky-300" />
                    Wallet Balance
                  </span>
                  <span>{formatCurrency(walletBalance)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  KYC must be verified and wallet balance should cover the ticket total.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900/70 border-neutral-800">
              <CardHeader>
                <CardTitle>Pool Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailsLoading ? (
                  <p className="text-gray-400">Loading pool details...</p>
                ) : selectedPool ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xl font-semibold">{selectedPool.title}</p>
                      {selectedPool.subtitle && (
                        <p className="text-sm text-gray-400">{selectedPool.subtitle}</p>
                      )}
                      {selectedPool.description && (
                        <MarkdownText content={selectedPool.description} className="text-sm text-gray-500" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-400">Ticket Price</p>
                        <p className="font-semibold">{formatCurrency(selectedPool.ticketPrice)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-400">Tickets Left</p>
                        <p className="font-semibold">{selectedPool.ticketsLeft}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-400">Tickets Sold</p>
                        <p className="font-semibold">
                          {selectedPool.ticketsSold} / {selectedPool.maxTickets}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-400">Your Tickets</p>
                        <p className="font-semibold">{selectedPool.myTicketsCount || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Ticket className="h-4 w-4 text-amber-300" />
                        <span>Buy Tickets</span>
                      </div>
                      {isPoolActive ? (
                        <>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className={
                                  verificationMethod === "otp"
                                    ? "border-emerald-400/70 text-emerald-200 bg-emerald-500/10"
                                    : "border-neutral-700 text-gray-400"
                                }
                                onClick={() => {
                                  setVerificationMethod("otp");
                                  setPassword("");
                                }}
                              >
                                Use OTP
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className={
                                  verificationMethod === "password"
                                    ? "border-emerald-400/70 text-emerald-200 bg-emerald-500/10"
                                    : "border-neutral-700 text-gray-400"
                                }
                                onClick={() => {
                                  setVerificationMethod("password");
                                  setOtp("");
                                }}
                              >
                                Use Password
                              </Button>
                            </div>

                            {verificationMethod === "otp" ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Enter OTP"
                                  value={otp}
                                  onChange={(event) => setOtp(event.target.value)}
                                  className="bg-neutral-950 border-neutral-800"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleSendOtp}
                                  disabled={otpSending}
                                >
                                  {otpSending ? "Sending..." : "Send OTP"}
                                </Button>
                              </div>
                            ) : (
                              <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="bg-neutral-950 border-neutral-800"
                              />
                            )}

                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                                className="bg-neutral-950 border-neutral-800"
                              />
                              <Button onClick={handleBuyTickets} disabled={!canBuy}>
                                {buyLoading ? "Processing..." : "Buy"}
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>Total Cost: {formatCurrency(totalCost)}</p>
                            {!isKycVerified && <p>KYC verification required to purchase.</p>}
                            {!hasVerification && <p>Enter OTP or password to continue.</p>}
                            {isValidQuantity && parsedQuantity > ticketsLeft && (
                              <p>Quantity exceeds available tickets.</p>
                            )}
                            {isValidQuantity && !canAfford && <p>Insufficient wallet balance.</p>}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">
                          Ticket sales are closed for this pool.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">Your Tickets</p>
                      {selectedPool.myTickets?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedPool.myTickets.map((ticket) => (
                            <span
                              key={`${selectedPool.poolId}-${ticket}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
                            >
                              #{ticket}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No tickets purchased yet.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">Select a pool to see details.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {activePrizeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActivePrizeImage(null)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-10 right-0 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs text-gray-200 hover:bg-black/90"
              onClick={() => setActivePrizeImage(null)}
            >
              Close
            </button>
            <div className="rounded-2xl border border-white/10 bg-neutral-950 p-3">
              <img
                src={activePrizeImage.url}
                alt={activePrizeImage.title}
                className="max-h-[80vh] w-full rounded-xl object-contain"
              />
            </div>
            <p className="mt-3 text-center text-sm text-gray-300">
              {activePrizeImage.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryPage;
