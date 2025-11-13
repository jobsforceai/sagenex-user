"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { Button } from "@/components/ui/button";
import { getAllCourses } from "@/actions/user";
import { CourseSummary } from "@/types";
import { Lock, BookOpen, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, AnimationGeneratorType } from "framer-motion";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0 });

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
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

const getTierTheme = (tier: string) => {
  if (tier.includes("Platinum"))
    return {
      ribbonBg: "from-[#a78bfa] to-[#7c3aed]",
      priceColor: "text-[#d8b4fe]",
      ringColor: "rgba(139, 92, 246, .45)",
      cardBg: "from-[#101613] to-[#0c110e]",
      walletBg: "bg-[#1f5a45]/20 border-[#1f5a45]/60",
      walletText: "text-[#ddf6ea]",
      goalText: "text-[#b6c8bf]",
      listItemText: "text-[#cfe0d7]"
    };
  if (tier.includes("Gold"))
    return {
      ribbonBg: "from-[#b58a2b] to-[#f1d27a]",
      priceColor: "text-[#f0d493]",
      ringColor: "rgba(241,210,122,.45)",
      cardBg: "from-[#101613] to-[#0c110e]",
      walletBg: "bg-[#1f5a45]/20 border-[#1f5a45]/60",
      walletText: "text-[#ddf6ea]",
      goalText: "text-[#b6c8bf]",
      listItemText: "text-[#cfe0d7]"
    };
  if (tier.includes("Silver"))
    return {
      ribbonBg: "from-[#8e8f93] to-[#cfd3d6]",
      priceColor: "text-[#e5e7eb]",
      ringColor: "rgba(207,211,214,.45)",
      cardBg: "from-[#101613] to-[#0c110e]",
      walletBg: "bg-[#1f5a45]/20 border-[#1f5a45]/60",
      walletText: "text-[#ddf6ea]",
      goalText: "text-[#b6c8bf]",
      listItemText: "text-[#cfe0d7]"
    };
  if (tier.includes("Bronze"))
    return {
      ribbonBg: "from-[#7a4b2c] to-[#b5763a]",
      priceColor: "text-[#e0b187]",
      ringColor: "rgba(181,118,58,.45)",
      cardBg: "from-[#101613] to-[#0c110e]",
      walletBg: "bg-[#1f5a45]/20 border-[#1f5a45]/60",
      walletText: "text-[#ddf6ea]",
      goalText: "text-[#b6c8bf]",
      listItemText: "text-[#cfe0d7]"
    };
  // default green/gold accent
  return {
    ribbonBg: "from-[#0f3d2e] to-[#1f5a45]",
    priceColor: "text-[#d4b36a]",
    ringColor: "rgba(31,90,69,.45)",
    cardBg: "from-[#101613] to-[#0c110e]",
    walletBg: "bg-[#1f5a45]/20 border-[#1f5a45]/60",
    walletText: "text-[#ddf6ea]",
    goalText: "text-[#b6c8bf]",
    listItemText: "text-[#cfe0d7]"
  };
};

const tierImages: Record<string, string> = {
  "Titanium Academy": "/academy/3.png",
  "Diamond Academy": "/academy/4.png",
  "Crown Academy": "/academy/5.png",
};

const AcademyCard = ({ course, onUpgradeClick }: { course: CourseSummary, onUpgradeClick: (course: CourseSummary) => void }) => {
  const { accessStatus, isPublished, title, price, modules, goal, _id, whatYoullLearn } = course;
  const { ribbonBg, priceColor, ringColor, cardBg, walletBg, walletText, goalText, listItemText } = getTierTheme(title);
  const tierImage = tierImages[title];
  const wallet = `$${fmt(price)}`;

  const unlockedCard = (
    <motion.article
      variants={item}
      whileHover={{
        y: -6,
        boxShadow: "0px 18px 40px rgba(0,0,0,.55)",
      }}
      className={`group relative flex h-full flex-col rounded-2xl border border-white/5 bg-gradient-to-b ${cardBg} p-4 text-white shadow-[0_10px_24px_rgba(0,0,0,.45)]`}
    >
      {/* Ribbon */}
      <div
        className={`flex items-center justify-between rounded-lg bg-gradient-to-r ${ribbonBg} px-3 py-2 text-sm font-bold tracking-tight text-white ring-1 ring-white/10`}
      >
        <span>{title}</span>
        {tierImage && (
          <Image
            src={tierImage}
            alt={`${title} badge`}
            width={32}
            height={32}
            className="h-8 w-8"
          />
        )}
      </div>

      {/* Content grows to keep consistent card heights */}
      <div className="flex-1 pt-3">
        {/* Price */}
        <div className={`text-3xl font-extrabold ${priceColor}`}>
          <span className="align-top text-base text-[#f3e3ba]">
            $
          </span>
          {fmt(price)}
        </div>

        {/* Bullets (reserved height for consistency across cards) */}
        <ul className={`mt-3 list-disc space-y-2 pl-5 text-sm ${listItemText} min-h-[4.5rem]`}>
          {whatYoullLearn && whatYoullLearn.length > 0 ? (
            whatYoullLearn.map((learnPoint, index) => {
              const courseModule = modules.find(m => m.title === learnPoint);
              const hasLessons = courseModule && courseModule.lessons.length > 0;
              const canStart = accessStatus === 'unlocked' && isPublished && hasLessons;

              return (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{learnPoint}</span>
                  {canStart ? (
                    <Link href={`/courses/${_id}?module=${encodeURIComponent(learnPoint)}`} passHref>
                      <Button size="sm" variant="ghost" className="bg-green-500/20 text-green-300 hover:bg-green-500/40 h-auto px-2 py-1 text-xs">
                        Start <BookOpen className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex items-center text-gray-500 text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      <span>Soon</span>
                    </div>
                  )}
                </li>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm">Lessons will be available soon.</p>
          )}
        </ul>
      </div>

      {/* Wallet */}
      <div className={`mt-3 flex items-center justify-between rounded-xl border ${walletBg} px-3 py-2 font-semibold ${walletText}`}>
        <span className="text-xs tracking-wide text-white/80">
          E-WALLET
        </span>
        <span className="text-sm">{wallet}</span>
      </div>

      {/* Goal */}
      <p className={`mt-3 text-sm ${goalText}`}>
        <span className="font-semibold text-white/90">Goal:</span>{" "}
        {goal}
      </p>

      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            `radial-gradient(60% 50% at 50% 0%, ${ringColor}, transparent 70%)`,
        }}
      />
    </motion.article>
  );

  if (accessStatus === 'unlocked') {
    return (
      <div className="relative h-full">
        {unlockedCard}
      </div>
    );
  }

  if (accessStatus === 'next_locked') {
    return (
      <div className="relative h-full">
        <div className="relative h-full blur-sm">
          {unlockedCard}
        </div>
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
          <Lock className="w-8 h-8 text-yellow-400 mb-4" />
          <h4 className="text-xl font-bold text-white mb-2">Unlock {title}</h4>
          <p className="text-gray-300 text-sm mb-4">Upgrade your plan to access this academy and more.</p>
          <Button 
            onClick={() => onUpgradeClick(course)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Upgrade to Unlock <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

const UpgradeModal = ({ course, onClose }: { course: CourseSummary, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
      <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-white mb-4">Unlock {course.title}</h3>
      <p className="text-gray-300 mb-6">
        To unlock this academy, your total investment must be at least{" "}
        <span className="font-bold text-emerald-400">${course.price}</span>.
      </p>
      <div className="flex justify-evenly gap-4">
        <Button onClick={onClose} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
          Close
        </Button>
        <Link href="/wallet" passHref>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            Invest Now
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

const CoursesPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCourseForUpgrade, setSelectedCourseForUpgrade] = useState<CourseSummary | null>(null);

  const handleUpgradeClick = (course: CourseSummary) => {
    setSelectedCourseForUpgrade(course);
  };

  const handleCloseModal = () => {
    setSelectedCourseForUpgrade(null);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchCourses = async () => {
      try {
        const data = await getAllCourses();
        if (data.error) {
          setError(data.error);
        } else {
          let coursesList = Array.isArray(data) ? data : (data?.data || []);
          // WORKAROUND: If Starter Academy is 'next_locked', treat it as 'unlocked'.
          // This is to handle the case for new users who haven't purchased any package yet.
          coursesList = coursesList.map((course: CourseSummary) => {
            if (course.title === "Starter Academy" && course.accessStatus === "next_locked") {
              return { ...course, accessStatus: 'unlocked' };
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

    if (isAuthenticated) {
      fetchCourses();
    }
  }, [isAuthenticated, authLoading, router]);

  const visibleCourses = useMemo(() => {
    return courses.filter(course => course.accessStatus === 'unlocked' || course.accessStatus === 'next_locked');
  }, [courses]);

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            LEARN, EARN & LEAD
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Unlock your potential with our expert-led courses on crypto, finance, and technology.
          </p>
        </header>

        {visibleCourses.length === 0 ? (
          <p className="text-center text-gray-500">No academies available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleCourses.map((course) => (
              <AcademyCard key={course._id} course={course} onUpgradeClick={handleUpgradeClick} />
            ))}
          </div>
        )}
      </main>
      {selectedCourseForUpgrade && (
        <UpgradeModal course={selectedCourseForUpgrade} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default CoursesPage;
