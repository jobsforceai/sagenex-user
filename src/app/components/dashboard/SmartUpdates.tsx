import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";

const SmartUpdates = () => (
  <Card className="bg-gray-900 border-gray-800">
    <CardHeader>
      <CardTitle>Smart Updates</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-start">
        <div className="bg-yellow-500/20 p-2 rounded-full">
          <Crown className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p>
            Thank you for joining Sagenex! We&apos;re excited to have you on
            board.
          </p>
          <p className="text-xs text-muted-foreground">Just now</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SmartUpdates;
