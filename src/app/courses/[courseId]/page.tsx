"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCourseById,
  getCourseProgress,
  updateVideoProgress,
  markLessonAsComplete,
} from "@/actions/user";
import { CourseDetails, Lesson, LessonProgress } from "@/types";
import {
  Lock,
  PlayCircle,
  CheckCircle,
  List,
  Info,
  Users,
  BarChart,
  Clock,
  Languages,
  Star,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import VideoPlayer from "@/app/components/courses/VideoPlayer";
import { Button } from "@/components/ui/button";
import { CourseDetailSkeleton } from "@/app/components/ui/PageSkeletons";
import AppErrorState from "@/app/components/auth/AppErrorState";

const CourseErrorState = ({
  message,
  showUpgrade,
}: {
  message: string;
  showUpgrade: boolean;
}) => (
  <AppErrorState
    title="Could not open this course"
    message={message}
    icon={
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C41E3A]">
        <Lock className="h-7 w-7" />
      </span>
    }
    actions={
      <>
        <Button asChild variant="outline" className="rounded-xl border-slate-200 font-bold">
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Link>
        </Button>
        {showUpgrade && (
          <Button asChild className="rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#ad1b34]">
            <Link href="/wallet">Go to wallet</Link>
          </Button>
        )}
      </>
    }
  />
);

const CoursePage = () => {
  const params = useParams<{ courseId?: string | string[] }>();
  const courseIdParam = params?.courseId;
  const courseId = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
  const hasCourseId = typeof courseId === "string" && courseId.length > 0;
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const searchParams = useSearchParams();
  const selectedModuleTitle = searchParams.get("module");

  const modulesToDisplay = useMemo(() => {
    if (!course) return [];
    if (selectedModuleTitle) {
      return course.modules.filter((m) => m.title === selectedModuleTitle);
    }
    return course.modules;
  }, [course, selectedModuleTitle]);

  useEffect(() => {
    if (modulesToDisplay.length > 0 && modulesToDisplay[0].lessons.length > 0) {
      setSelectedLesson(modulesToDisplay[0].lessons[0]);
    }
  }, [modulesToDisplay]);

  const getLessonProgress = useCallback(
    (lessonId: string) => progress.find((p) => p.lessonId === lessonId),
    [progress],
  );

  const fetchCourseData = useCallback(async (resolvedCourseId: string) => {
    setDataLoading(true);
    setError(null);
    try {
      const [courseData, progressData] = await Promise.all([
        getCourseById(resolvedCourseId),
        getCourseProgress(resolvedCourseId),
      ]);

      if (courseData.error) {
        setError(courseData.error);
      } else {
        const courseDetails = courseData.data || courseData.course || courseData;
        setCourse(courseDetails);
      }

      if (progressData.error) {
        console.warn("Could not fetch course progress:", progressData.error);
      } else {
        setProgress(progressData.progress || []);
      }
    } catch {
      setError("Something went wrong while loading this course.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasCourseId) {
      fetchCourseData(courseId);
    } else {
      setError("Course not found.");
      setDataLoading(false);
    }
  }, [fetchCourseData, hasCourseId, courseId]);

  const handleProgressUpdate = async (watchedSeconds: number) => {
    if (!selectedLesson || !courseId) return;
    await updateVideoProgress(courseId, selectedLesson._id, watchedSeconds);
  };

  const handleComplete = async () => {
    if (!selectedLesson || !courseId) return;
    await markLessonAsComplete(courseId, selectedLesson._id);
    setProgress((prev) => {
      const existing = prev.find((p) => p.lessonId === selectedLesson._id);
      if (existing) {
        return prev.map((p) =>
          p.lessonId === selectedLesson._id ? { ...p, completed: true } : p,
        );
      }
      return [...prev, { lessonId: selectedLesson._id, completed: true, watchedSeconds: 0 }];
    });
  };

  const firstUncompletedLessonIndex = useMemo(() => {
    if (!course) return -1;
    const allLessons = course.modules.flatMap((m) => m.lessons);
    return allLessons.findIndex((lesson) => !getLessonProgress(lesson._id)?.completed);
  }, [course, getLessonProgress]);

  const needsUpgrade = error ? /access|upgrade|plan|invest/i.test(error) : false;

  if (dataLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6">
        <Link
          href="/courses"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <CourseErrorState message={error} showUpgrade={needsUpgrade} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6">
        <CourseErrorState message="This course could not be found." showUpgrade={false} />
      </div>
    );
  }

  let lessonCounter = -1;

  return (
    <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/courses"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition hover:text-[#C41E3A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <VideoPlayer
                lesson={selectedLesson}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleComplete}
                initialWatchedSeconds={getLessonProgress(selectedLesson._id)?.watchedSeconds || 0}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#64748B] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <BookOpen className="mr-2 h-5 w-5" />
                Select a lesson to begin
              </div>
            )}

            <h1 className="mt-5 text-2xl font-black text-[#0F172A] sm:text-3xl">{course.title}</h1>
            <p className="mt-2 text-sm text-[#64748B] sm:text-base">{course.description}</p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-black text-[#0F172A]">What you&apos;ll learn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.whatYoullLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-sm text-[#64748B]">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-black text-[#0F172A]">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.requirements.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C41E3A]" />
                      <p className="text-sm text-[#64748B]">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-5">
            <Card className="rounded-2xl border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-black text-[#0F172A]">Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                {modulesToDisplay.map((module) => (
                  <div key={module._id} className="mb-4 last:mb-0">
                    <h3 className="mb-2 text-sm font-black text-[#C41E3A]">{module.title}</h3>
                    <ul className="space-y-1">
                      {module.lessons.map((lesson) => {
                        lessonCounter++;
                        const lessonIndex = lessonCounter;
                        const isCompleted = getLessonProgress(lesson._id)?.completed;
                        const isLocked =
                          firstUncompletedLessonIndex !== -1 &&
                          lessonIndex > firstUncompletedLessonIndex;

                        let icon = <PlayCircle className="h-4 w-4 shrink-0 text-[#64748B]" />;
                        if (isCompleted) icon = <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />;
                        if (isLocked) icon = <Lock className="h-4 w-4 shrink-0 text-slate-300" />;

                        return (
                          <li key={lesson._id}>
                            <button
                              type="button"
                              onClick={() => setSelectedLesson(lesson)}
                              disabled={isLocked}
                              className={`flex w-full items-center gap-2 rounded-xl p-2.5 text-left text-sm transition ${
                                selectedLesson?._id === lesson._id
                                  ? "bg-[#FFF1F4] font-semibold text-[#C41E3A]"
                                  : "text-[#0F172A] hover:bg-slate-50 disabled:hover:bg-transparent"
                              }`}
                            >
                              {icon}
                              <span
                                className={`${isCompleted ? "text-[#94A3B8] line-through" : ""} ${isLocked ? "text-slate-300" : ""}`}
                              >
                                {lesson.title}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-black text-[#0F172A]">Course details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{course.rating} rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.studentsEnrolled} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>{course.lecturesCount} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.totalVideoDuration} total</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>{course.skillLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span>{course.language}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
