"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";

interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  packageUSD: number;
  dateJoined: string;
  children: TeamMember[];
}

const TeamPage = () => {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depth] = useState(6);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchTeamTree = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const res = await fetch(
          `${backendUrl}/api/v1/user/team/tree?depth=${depth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setTeam(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Failed to fetch team data");
        }
      } catch {
        setError("An error occurred while fetching team data");
      } finally {
        setDataLoading(false);
      }
    };

    if (token) {
      fetchTeamTree();
    }
  }, [token, isAuthenticated, authLoading, router, depth]);

  if (authLoading || dataLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold pl-4">My Team</h1>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        {team ? (
          <TreeClient initialTreeData={team} />
        ) : (
          <p>No team members found.</p>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
