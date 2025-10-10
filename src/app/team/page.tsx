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
import { getTeamTree } from "@/actions/user";

interface TreeApiResponse {
  tree: UserNode;
  parent: ParentNode | null;
}

const TeamPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
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
        const data = await getTeamTree();
        if (data.error) {
          setError(data.error);
        } else {
          setTreeData(data);
        }
      } catch {
        setError("An error occurred while fetching team data");
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTeamTree();
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
