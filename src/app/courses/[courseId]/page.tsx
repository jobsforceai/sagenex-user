"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourseById, getCourseProgress, updateVideoProgress, markLessonAsComplete } from "@/actions/user";
import { CourseDetails, Lesson, LessonProgress } from "@/types";
import { Lock, PlayCircle, CheckCircle, List, Info, Users, BarChart, Clock, Languages, Star, ArrowLeft } from "lucide-react";
import VideoPlayer from "@/app/components/courses/VideoPlayer";
import { Button } from "@/components/ui/button";

const CoursePage = ({ params }: { params: { courseId: string } }) => {
  const { courseId } = params;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const getLessonProgress = useCallback((lessonId: string) => {
    return progress.find(p => p.lessonId === lessonId);
  }, [progress]);

  const fetchCourseData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [courseData, progressData] = await Promise.all([
        getCourseById(courseId),
        getCourseProgress(courseId)
      ]);

      if (courseData.error) {
        setError(courseData.error);
      } else {
        const courseDetails = courseData.data || courseData.course || courseData;
        setCourse(courseDetails);
        if (courseDetails.modules?.[0]?.lessons?.[0]) {
          setSelectedLesson(courseDetails.modules[0].lessons[0]);
        }
      }

      if (progressData.error) {
        console.warn("Could not fetch course progress:", progressData.error);
      } else {
        setProgress(progressData.progress || []);
      }

    } catch {
      setError("An error occurred while fetching the course");
    } finally {
      setDataLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchCourseData();
    }
  }, [isAuthenticated, authLoading, router, fetchCourseData]);

  const handleProgressUpdate = async (watchedSeconds: number) => {
    if (!selectedLesson) return;
    await updateVideoProgress(courseId, selectedLesson._id, watchedSeconds);
  };

  const handleComplete = async () => {
    if (!selectedLesson) return;
    await markLessonAsComplete(courseId, selectedLesson._id);
    setProgress(prev => {
        const existing = prev.find(p => p.lessonId === selectedLesson._id);
        if (existing) {
            return prev.map(p => p.lessonId === selectedLesson._id ? { ...p, completed: true } : p);
        }
        return [...prev, { lessonId: selectedLesson._id, completed: true, watchedSeconds: 0 }];
    });
  };

  const firstUncompletedLessonIndex = useMemo(() => {
    if (!course) return -1;
    const allLessons = course.modules.flatMap(m => m.lessons);
    return allLessons.findIndex(lesson => !getLessonProgress(lesson._id)?.completed);
  }, [course, getLessonProgress]);

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading course...</div>;
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen">
        <Navbar />
        <main className="container mx-auto p-4 pt-24 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Could not load course</h2>
          <p className="text-gray-400 mb-6">{error}</p>
        </main>
      </div>
    );
  }

  if (!course) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Course not found.</div>;
  }

  let lessonCounter = -1;

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedLesson ? (
                <VideoPlayer 
                    lesson={selectedLesson}
                    onProgressUpdate={handleProgressUpdate}
                    onComplete={handleComplete}
                    initialWatchedSeconds={getLessonProgress(selectedLesson._id)?.watchedSeconds || 0}
                />
            ) : (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                    Select a lesson to begin.
                </div>
            )}
            <h1 className="text-3xl font-bold mt-4 mb-2">{course.title}</h1>
            <p className="text-gray-400 mb-6">{course.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>What you&apos;ll learn</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {course.whatYoullLearn.map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-1 text-green-400 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{item}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {course.requirements.map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Info className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{item}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900/40 border-gray-800">
                <CardHeader><CardTitle>Course Content</CardTitle></CardHeader>
                <CardContent>
                    {course.modules.map(module => (
                        <div key={module._id} className="mb-4 last:mb-0">
                            <h3 className="font-semibold text-emerald-400 mb-2">{module.title}</h3>
                            <ul className="space-y-1">
                                {module.lessons.map(lesson => {
                                    lessonCounter++;
                                    const lessonIndex = lessonCounter;
                                    const isCompleted = getLessonProgress(lesson._id)?.completed;
                                    const isLocked = firstUncompletedLessonIndex !== -1 && lessonIndex > firstUncompletedLessonIndex;

                                    let icon = <PlayCircle className="w-4 h-4 flex-shrink-0" />;
                                    if (isCompleted) icon = <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
                                    if (isLocked) icon = <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />;

                                    return (
                                        <li key={lesson._id}>
                                            <button 
                                                onClick={() => setSelectedLesson(lesson)} 
                                                disabled={isLocked}
                                                className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${selectedLesson?._id === lesson._id ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-gray-700/50 disabled:hover:bg-transparent'}`}
                                            >
                                                {icon}
                                                <span className={`${isCompleted ? 'line-through text-gray-500' : ''} ${isLocked ? 'text-gray-600' : ''}`}>{lesson.title}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="bg-gray-900/40 border-gray-800">
                <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> <span>{course.rating} Rating</span></div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> <span>{course.studentsEnrolled} students</span></div>
                    <div className="flex items-center gap-2"><List className="w-4 h-4 text-gray-400" /> <span>{course.lecturesCount} lectures</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> <span>{course.totalVideoDuration} total</span></div>
                    <div className="flex items-center gap-2"><BarChart className="w-4 h-4 text-gray-400" /> <span>{course.skillLevel}</span></div>
                    <div className="flex items-center gap-2"><Languages className="w-4 h-4 text-gray-400" /> <span>{course.language}</span></div>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePage;
