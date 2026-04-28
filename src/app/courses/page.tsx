"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, type AnimationGeneratorType } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getAllCourses, getDashboardData } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseSummary } from "@/types";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Lock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

const formatNumber = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const item = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as AnimationGeneratorType,
      damping: 22,
      stiffness: 220,
    },
  },
};

const tierImages: Record<string, string> = {
  "Titanium Academy": "/academy/3.png",
  "Diamond Academy": "/academy/4.png",
  "Crown Academy": "/academy/5.png",
};

const getTierTheme = (title: string) => {
  if (title.includes("Crown") || title.includes("Diamond")) {
    return {
      accent: "from-[#F59E0B]/18 via-white to-[#FFF1F4]",
      iconBg: "bg-amber-50 text-amber-600",
      border: "border-amber-200/80",
      chip: "bg-amber-50 text-amber-700",
    };
  }
  if (title.includes("Titanium") || title.includes("Platinum")) {
    return {
      accent: "from-violet-100/70 via-white to-[#FFF1F4]",
      iconBg: "bg-violet-50 text-violet-600",
      border: "border-violet-200/80",
      chip: "bg-violet-50 text-violet-700",
    };
  }
  if (title.includes("Gold")) {
    return {
      accent: "from-amber-100/80 via-white to-white",
      iconBg: "bg-amber-50 text-amber-600",
      border: "border-amber-200/80",
      chip: "bg-amber-50 text-amber-700",
    };
  }
  return {
    accent: "from-[#ECFDF5] via-white to-[#FFF1F4]",
    iconBg: "bg-[#ECFDF5] text-emerald-600",
    border: "border-emerald-200/80",
    chip: "bg-emerald-50 text-emerald-700",
  };
};

const CoursesHeader = ({ unlockedCount, totalCount }: { unlockedCount: number; totalCount: number }) => (
  <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C8103E]/15 bg-[#FFF1F4] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#C8103E]">
          <Sparkles className="h-3.5 w-3.5" />
          SAGENEX Academy
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Courses</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#64748B] sm:text-base">
          Learn, earn, and lead with practical training built for the SAGENEX ecosystem.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Unlocked</p>
          <p className="mt-1 text-2xl font-black text-[#0F172A]">{unlockedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Available</p>
          <p className="mt-1 text-2xl font-black text-[#0F172A]">{totalCount}</p>
        </div>
      </div>
    </div>
  </header>
);

const CoursesHero = ({ courses }: { courses: CourseSummary[] }) => {
  const lessons = courses.reduce((sum, course) => sum + (course.lecturesCount || 0), 0);
  const students = courses.reduce((sum, course) => sum + (course.studentsEnrolled || 0), 0);

  return (
    <section className="wallet-red-surface relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_58%,#30000C_100%)] p-4 text-white shadow-[0_24px_70px_rgba(122,0,31,0.22)] sm:p-6 lg:p-7">
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-28 -bottom-28 h-80 w-80 rounded-full bg-[#F59E0B]/18 blur-3xl" />
      <Image
        src="/rewards/trophy-motivation.png"
        alt=""
        width={260}
        height={260}
        className="pointer-events-none absolute -right-5 bottom-[-46px] hidden h-60 w-60 object-contain opacity-20 drop-shadow-2xl lg:block"
      />
      <div className="relative max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
          <GraduationCap className="h-4 w-4 text-amber-100" />
          <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.16em] text-amber-50">Leadership Learning Hub</p>
        </div>
        <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.04] text-white sm:text-4xl lg:text-5xl">
          Build skills that compound with your network.
        </h2>
        <p className="wallet-red-soft mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/82 sm:text-base">
          Start unlocked academies, track learning paths, and upgrade when you are ready for the next training tier.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:max-w-4xl">
          {[
            ["Academies", courses.length.toString(), "Visible programs"],
            ["Lessons", formatNumber(lessons), "Training modules"],
            ["Members", formatNumber(students), "Learning community"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.09] p-4 backdrop-blur">
              <p className="wallet-red-muted text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p>
              <p className="mt-2 text-2xl font-black leading-none text-white">{value}</p>
              <p className="wallet-red-soft mt-2 text-xs font-semibold text-white/65">{helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AcademyCard = ({
  course,
  onUpgradeClick,
}: {
  course: CourseSummary;
  onUpgradeClick: (course: CourseSummary) => void;
}) => {
  const { accessStatus, isPublished, title, price, modules, goal, _id, whatYoullLearn } = course;
  const theme = getTierTheme(title);
  const tierImage = tierImages[title];
  const unlocked = accessStatus === "unlocked";
  const nextLocked = accessStatus === "next_locked";
  const learnItems = whatYoullLearn?.length ? whatYoullLearn.slice(0, 4) : ["Lessons will be available soon."];

  return (
    <motion.article
      variants={item}
      whileHover={{ y: -4 }}
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br ${theme.accent} p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${theme.iconBg}`}>
          {tierImage ? (
            <Image src={tierImage} alt={`${title} badge`} width={56} height={56} className="h-12 w-12 object-contain" />
          ) : (
            <BookOpen className="h-7 w-7" />
          )}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${unlocked ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {unlocked ? "Unlocked" : "Upgrade"}
        </span>
      </div>

      <div className="mt-5 min-w-0">
        <h3 className="text-2xl font-black tracking-tight text-[#0F172A]">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-[#64748B]">{course.description || goal}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#64748B]">Wallet Value</p>
          <p className="mt-1 break-words text-lg font-black text-[#0F172A]">{formatCurrency(price)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#64748B]">Lessons</p>
          <p className="mt-1 text-lg font-black text-[#0F172A]">{formatNumber(course.lecturesCount || modules.length)}</p>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">What you’ll learn</p>
        <div className="mt-3 space-y-2">
          {learnItems.map((learnPoint, index) => {
            const courseModule = modules.find((module) => module.title === learnPoint);
            const hasLessons = Boolean(courseModule?.lessons.length);
            const canStart = unlocked && isPublished && hasLessons;

            return (
              <div key={`${learnPoint}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#0F172A]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{learnPoint}</span>
                </span>
                {canStart ? (
                  <Link href={`/courses/${_id}?module=${encodeURIComponent(learnPoint)}`} className="shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                      Start
                      <PlayCircle className="h-3 w-3" />
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-[#64748B]">
                    <Lock className="h-3 w-3" />
                    Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/75 p-4">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Goal</p>
        <p className="mt-1 text-sm font-semibold text-[#0F172A]">{goal || "Build practical SAGENEX ecosystem skills."}</p>
      </div>

      <div className="mt-5">
        {unlocked ? (
          <Button asChild className="wallet-red-control h-12 w-full rounded-2xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] text-white hover:from-[#C8103E] hover:to-[#68001A]">
            <Link href={`/courses/${_id}`}>
              Open Academy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : nextLocked ? (
          <Button
            type="button"
            onClick={() => onUpgradeClick(course)}
            className="wallet-red-control h-12 w-full rounded-2xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] text-white hover:from-[#C8103E] hover:to-[#68001A]"
          >
            Upgrade to Unlock
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </motion.article>
  );
};

const UpgradeModal = ({ course, onClose }: { course: CourseSummary; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C8103E]">
        <Lock className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-2xl font-black text-[#0F172A]">Unlock {course.title}</h3>
      <p className="mt-3 text-sm text-[#64748B]">
        To unlock this academy, your total investment must be at least{" "}
        <span className="font-black text-[#0F172A]">{formatCurrency(course.price)}</span>.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button onClick={onClose} variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-black text-[#0F172A] hover:bg-slate-50">
          Close
        </Button>
        <Button asChild className="wallet-red-control h-11 rounded-xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] font-black text-white hover:from-[#C8103E] hover:to-[#68001A]">
          <Link href="/wallet">Invest Now</Link>
        </Button>
      </div>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <main className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-96 rounded-3xl" />
        ))}
      </div>
    </div>
  </main>
);

const CoursesPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCourseForUpgrade, setSelectedCourseForUpgrade] = useState<CourseSummary | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchCourses = async () => {
      try {
        const [coursesData] = await Promise.all([getAllCourses(), getDashboardData()]);

        if (coursesData.error) {
          setError(coursesData.error);
        } else {
          let coursesList: CourseSummary[] = Array.isArray(coursesData) ? coursesData : coursesData?.data || [];
          coursesList = coursesList.map((course) => {
            if (course.title === "Starter Academy" && course.accessStatus === "next_locked") {
              return { ...course, accessStatus: "unlocked" };
            }
            return course;
          });
          setCourses(coursesList);
        }
      } catch {
        setError("An error occurred while fetching courses");
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated) fetchCourses();
  }, [isAuthenticated, authLoading, router]);

  const visibleCourses = useMemo(
    () => courses.filter((course) => course.accessStatus === "unlocked" || course.accessStatus === "next_locked"),
    [courses]
  );

  const unlockedCount = useMemo(
    () => visibleCourses.filter((course) => course.accessStatus === "unlocked").length,
    [visibleCourses]
  );

  if (authLoading || dataLoading) return <LoadingSkeleton />;

  return (
    <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <CoursesHeader unlockedCount={unlockedCount} totalCount={visibleCourses.length} />
        <CoursesHero courses={visibleCourses} />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-[#FFF1F4] px-4 py-3 text-sm font-semibold text-[#C8103E]">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:col-span-2 xl:col-span-3">
              <BookOpen className="mx-auto h-10 w-10 text-[#C8103E]" />
              <h2 className="mt-4 text-xl font-black text-[#0F172A]">No academies available</h2>
              <p className="mt-2 text-sm text-[#64748B]">Please check back later for new training programs.</p>
            </div>
          ) : (
            visibleCourses.map((course) => (
              <AcademyCard key={course._id} course={course} onUpgradeClick={setSelectedCourseForUpgrade} />
            ))
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {[
            ["Structured Learning", "Follow tiered academies as your SAGENEX journey grows.", Layers3, "bg-[#ECFDF5] text-emerald-700"],
            ["Practical Finance", "Build confidence in wallet, rewards, and ecosystem workflows.", Wallet, "bg-[#FFF1F4] text-[#C8103E]"],
            ["Leadership Growth", "Train for duplication, team momentum, and long-term performance.", TrendingUp, "bg-amber-50 text-amber-700"],
          ].map(([title, text, Icon, klass]) => (
            <div key={title as string} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${klass as string}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-black text-[#0F172A]">{title as string}</h3>
              <p className="mt-2 text-sm text-[#64748B]">{text as string}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-[#ECFDF5] px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:px-5">
          <ShieldCheck className="h-8 w-8 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-lg font-black text-emerald-700">Keep learning as your access grows.</p>
            <p className="mt-1 text-sm text-emerald-800/80">Unlocked courses remain available, and upcoming academies open as your investment tier increases.</p>
          </div>
        </section>
      </div>

      {selectedCourseForUpgrade && (
        <UpgradeModal course={selectedCourseForUpgrade} onClose={() => setSelectedCourseForUpgrade(null)} />
      )}
    </main>
  );
};

export default CoursesPage;
