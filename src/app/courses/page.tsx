"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAllCourses } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { CoursesPageSkeleton } from "@/app/components/ui/PageSkeletons";
import { CourseSummary } from "@/types";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lock,
  PlayCircle,
  Unlock,
} from "lucide-react";

const formatNumber = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const TIER_ORDER = [
  "starter",
  "bronze",
  "silver",
  "gold",
  "diamond",
  "crown",
  "titanium",
  "platinum",
] as const;

const TIER_IMAGES: Record<string, string> = {
  starter: "/courses/starter.jpeg",
  bronze: "/courses/bronze.jpeg",
  silver: "/courses/silver.jpeg",
  gold: "/courses/gold.jpeg",
  diamond: "/courses/diamond.jpeg",
  crown: "/courses/crown.jpeg",
};

function getTierKey(title: string): string {
  const lower = title.toLowerCase();
  const match = TIER_ORDER.find((tier) => lower.includes(tier));
  return match ?? "starter";
}

function getTierImage(title: string): string {
  return TIER_IMAGES[getTierKey(title)] ?? TIER_IMAGES.starter;
}

function sortCoursesByTier(courses: CourseSummary[]) {
  return [...courses].sort((a, b) => {
    const aIndex = TIER_ORDER.indexOf(getTierKey(a.title) as (typeof TIER_ORDER)[number]);
    const bIndex = TIER_ORDER.indexOf(getTierKey(b.title) as (typeof TIER_ORDER)[number]);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}

const CoursesHeader = ({
  unlockedCount,
  totalCount,
}: {
  unlockedCount: number;
  totalCount: number;
}) => {
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C8103E]/15 bg-[#FFF1F4] px-3 py-1 text-xs font-bold text-[#C8103E]">
          <GraduationCap className="h-3.5 w-3.5" />
          Sagenex Academy
        </div>
        <h1 className="mt-3 text-2xl font-black text-[#0F172A] sm:text-3xl">Courses</h1>
        <p className="mt-1 max-w-xl text-sm text-[#64748B]">
          Learn step by step. Higher tiers unlock as your investment grows.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-bold text-[#64748B]">Unlocked</p>
          <p className="text-xl font-black text-[#0F172A]">
            {unlockedCount}/{totalCount}
          </p>
        </div>
        <p className="hidden text-sm font-semibold text-[#94A3B8] sm:block">{todayLabel}</p>
      </div>
    </header>
  );
};

const QuickStats = ({ courses }: { courses: CourseSummary[] }) => {
  const lessons = courses.reduce((sum, course) => sum + (course.lecturesCount || 0), 0);
  const students = courses.reduce((sum, course) => sum + (course.studentsEnrolled || 0), 0);

  const tiles = [
    { label: "Academies", value: courses.length.toString() },
    { label: "Lessons", value: formatNumber(lessons) },
    { label: "Members learning", value: formatNumber(students) },
  ];

  return (
    <section className="grid grid-cols-3 gap-3">
      {tiles.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-xs font-bold text-[#64748B]">{label}</p>
          <p className="mt-1 text-lg font-black text-[#0F172A] sm:text-xl">{value}</p>
        </div>
      ))}
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
  const { accessStatus, isPublished, title, price, modules, goal, _id, lecturesCount } = course;
  const tierImage = getTierImage(title);
  const unlocked = accessStatus === "unlocked";
  const nextLocked = accessStatus === "next_locked";
  const lessonCount = lecturesCount || modules.length;
  const canOpen = unlocked && isPublished;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0a1a12]">
        <Image
          src={tierImage}
          alt={title}
          fill
          className={`object-cover object-center transition duration-300 group-hover:scale-[1.02] ${
            unlocked ? "" : "brightness-[0.72] saturate-[0.85]"
          }`}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          priority={getTierKey(title) === "starter"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/55 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
              unlocked
                ? "bg-emerald-500 text-white"
                : nextLocked
                  ? "bg-amber-400 text-[#0F172A]"
                  : "bg-slate-700/90 text-white"
            }`}
          >
            {unlocked ? (
              <>
                <Unlock className="h-3.5 w-3.5" />
                Unlocked
              </>
            ) : nextLocked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Upgrade to unlock
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Locked
              </>
            )}
          </span>
        </div>

        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/20">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm">
              <Lock className="h-6 w-6" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-black text-[#0F172A] sm:text-xl">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">
          {course.description || goal || "Practical training for your Sagenex journey."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[11px] font-bold text-[#64748B]">Investment needed</p>
            <p className="mt-0.5 text-sm font-black text-[#0F172A] sm:text-base">{formatCurrency(price)}</p>
          </div>
          <div className="rounded-2xl bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[11px] font-bold text-[#64748B]">Lessons</p>
            <p className="mt-0.5 text-sm font-black text-[#0F172A] sm:text-base">{formatNumber(lessonCount)}</p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          {canOpen ? (
            <Button
              asChild
              className="h-12 w-full rounded-2xl bg-[#C41E3A] text-sm font-bold text-white hover:bg-[#ad1b34]"
            >
              <Link href={`/courses/${_id}`}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start learning
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          ) : nextLocked ? (
            <Button
              type="button"
              onClick={() => onUpgradeClick(course)}
              className="h-12 w-full rounded-2xl bg-[#C41E3A] text-sm font-bold text-white hover:bg-[#ad1b34]"
            >
              <Lock className="mr-2 h-4 w-4" />
              Upgrade to unlock
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              variant="outline"
              className="h-12 w-full rounded-2xl border-slate-200 font-bold text-[#64748B]"
            >
              Complete previous tier first
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

const UpgradeModal = ({ course, onClose }: { course: CourseSummary; onClose: () => void }) => {
  const tierImage = getTierImage(course.title);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="relative h-36 bg-[#0a1a12]">
          <Image src={tierImage} alt="" fill className="object-cover object-center opacity-90" sizes="448px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-lg font-black text-white">{course.title}</p>
          </div>
        </div>
        <div className="p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C41E3A]">
            <Lock className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-xl font-black text-[#0F172A]">Unlock this academy</h3>
          <p className="mt-2 text-sm text-[#64748B]">
            Your total investment must reach at least{" "}
            <span className="font-black text-[#0F172A]">{formatCurrency(course.price)}</span> to open
            this course.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="h-11 rounded-xl border-slate-200 font-bold text-[#0F172A]"
            >
              Close
            </Button>
            <Button asChild className="h-11 rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#ad1b34]">
              <Link href="/wallet">Go to wallet</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoursesPage = () => {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCourseForUpgrade, setSelectedCourseForUpgrade] = useState<CourseSummary | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getAllCourses();

        if (coursesData.error) {
          setError(coursesData.error);
        } else {
          let coursesList: CourseSummary[] = Array.isArray(coursesData)
            ? coursesData
            : coursesData?.data || [];
          coursesList = coursesList.map((course) => {
            if (course.title === "Starter Academy" && course.accessStatus === "next_locked") {
              return { ...course, accessStatus: "unlocked" };
            }
            return course;
          });
          setCourses(coursesList);
        }
      } catch {
        setError("Could not load courses. Please try again.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const visibleCourses = useMemo(
    () =>
      sortCoursesByTier(
        courses.filter(
          (course) => course.accessStatus === "unlocked" || course.accessStatus === "next_locked",
        ),
      ),
    [courses],
  );

  const unlockedCount = useMemo(
    () => visibleCourses.filter((course) => course.accessStatus === "unlocked").length,
    [visibleCourses],
  );

  if (dataLoading) return <CoursesPageSkeleton />;

  return (
    <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <CoursesHeader unlockedCount={unlockedCount} totalCount={visibleCourses.length} />
        <QuickStats courses={visibleCourses} />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-[#FFF1F4] px-4 py-3 text-sm font-semibold text-[#C8103E]">
            {error}
          </div>
        )}

        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Your learning path</p>
          {visibleCourses.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <BookOpen className="mx-auto h-10 w-10 text-[#C41E3A]" />
              <h2 className="mt-4 text-xl font-black text-[#0F172A]">No courses available yet</h2>
              <p className="mt-2 text-sm text-[#64748B]">Check back soon for new training programs.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <AcademyCard
                  key={course._id}
                  course={course}
                  onUpgradeClick={setSelectedCourseForUpgrade}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 sm:px-5">
          <p className="text-sm font-black text-emerald-800">How unlocking works</p>
          <p className="mt-1 text-sm text-emerald-900/80">
            Starter is free to begin. Each next academy opens when your wallet investment reaches the
            amount shown on the card.
          </p>
        </section>
      </div>

      {selectedCourseForUpgrade && (
        <UpgradeModal
          course={selectedCourseForUpgrade}
          onClose={() => setSelectedCourseForUpgrade(null)}
        />
      )}
    </main>
  );
};

export default CoursesPage;
