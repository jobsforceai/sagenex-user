"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";
import Navbar from "@/app/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserNode, ParentNode } from "@/types";

interface TreeApiResponse {
  tree: UserNode;
  parent: ParentNode | null;
}

const TeamPage = () => {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treeData, setTreeData] = useState<TreeApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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
          `${backendUrl}/api/v1/user/team/tree`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data: TreeApiResponse = await res.json();
          setTreeData(data);
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
  }, [token, isAuthenticated, authLoading, router]);

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <Card>
          <CardHeader>
            <CardTitle>My Team</CardTitle>
          </CardHeader>
          <CardContent>
            {treeData && treeData.tree ? (
              <TreeClient tree={treeData.tree} parent={treeData.parent} />
            ) : (
              <p>No team members found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamPage;
