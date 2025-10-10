import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Users, Crown } from "lucide-react";

const SmartUpdates = () => (
  <Card className="bg-gray-900 border-gray-800">
    <CardHeader>
      <CardTitle>Smart Updates</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-start">
        <div className="bg-green-500/20 p-2 rounded-full">
          <ArrowUp className="h-4 w-4 text-green-400" />
        </div>
        <div className="ml-3">
          <p>You just earned ₹50,000 from a Direct Sale.</p>
          <p className="text-xs text-muted-foreground">2 hours ago</p>
        </div>
      </div>
      <div className="flex items-start">
        <div className="bg-blue-500/20 p-2 rounded-full">
          <Users className="h-4 w-4 text-blue-400" />
        </div>
        <div className="ml-3">
          <p>Your downline agent, Agent C, has joined.</p>
          <p className="text-xs text-muted-foreground">1 day ago</p>
        </div>
      </div>
      <div className="flex items-start">
        <div className="bg-yellow-500/20 p-2 rounded-full">
          <Crown className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p>Congratulations! You achieved the GM promotion.</p>
          <p className="text-xs text-muted-foreground">3 days ago</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SmartUpdates;
