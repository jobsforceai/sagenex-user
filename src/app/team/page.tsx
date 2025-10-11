"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";
import Navbar from "@/app/components/Navbar";
import PlacementQueue from "@/app/components/dashboard/PlacementQueue";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserNode, ParentNode, QueuedUser } from "@/types";
import { getTeamTree, getPlacementQueue } from "@/actions/user";

interface TreeApiResponse {
  tree: UserNode;
  parent: ParentNode | null;
}

const TeamPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treeData, setTreeData] = useState<TreeApiResponse | null>(null);
  const [queue, setQueue] = useState<QueuedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [treeResult, queueResult] = await Promise.all([
        getTeamTree(),
        getPlacementQueue(),
      ]);

      if (treeResult.error) {
        setError(treeResult.error);
      } else {
        setTreeData(treeResult);
      }

      if (queueResult.error) {
        // Handle queue error separately if needed, for now just log it
        console.error("Could not fetch placement queue:", queueResult.error);
      } else {
        setQueue(queueResult);
      }

    } catch {
      setError("An error occurred while fetching team data");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchTeamData();
    }
  }, [isAuthenticated, authLoading, router, fetchTeamData]);

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
        <PlacementQueue queue={queue} onUserPlaced={fetchTeamData} />
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