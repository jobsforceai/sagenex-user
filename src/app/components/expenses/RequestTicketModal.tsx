"use client";

import { useState } from "react";
import { requestExpenseTicket } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RequestTicketModalProps {
  onClose: () => void;
  onTicketRequested: () => void;
}

const RequestTicketModal = ({ onClose, onTicketRequested }: RequestTicketModalProps) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description) {
      setError("Description is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await requestExpenseTicket(description);
      if (res.error) {
        setError(res.error);
      } else {
        onTicketRequested();
        onClose();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Request New Expense Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Business trip to Singapore"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Request Ticket"}
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default RequestTicketModal;
