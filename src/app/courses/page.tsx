"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCourses } from "@/actions/user";
import { CourseSummary } from "@/types";
import { Lock, BookOpen } from "lucide-react";

const CoursesPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

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
          const coursesList = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
          if (coursesList.length === 0 && !Array.isArray(data) && (!data || !Array.isArray(data.data))) {
              console.warn("Unexpected data structure for courses list:", data);
          }
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            Sagenex Academy
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Unlock your potential with our expert-led courses on crypto, finance, and technology.
          </p>
        </header>

        {courses.length === 0 ? (
          <p className="text-center text-gray-500">No courses available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link key={course._id} href={`/courses/${course._id}`} passHref>
                <Card className="bg-gray-900/40 border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-400 text-sm mb-4">{course.description.substring(0, 120)}...</p>
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>{course.skillLevel}</span>
                      <span>{course.lecturesCount} lectures</span>
                    </div>
                  </CardContent>
                  <div className="p-4 bg-gray-800/50 mt-auto">
                    {course.isLocked ? (
                      <div className="flex items-center text-yellow-400">
                        <Lock className="w-4 h-4 mr-2" />
                        <span>Locked</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-green-400">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>Start Learning</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesPage;
