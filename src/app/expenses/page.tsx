"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { getMyExpenseTickets } from "@/actions/user";
import { ExpenseTicket } from "@/types";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import RequestTicketModal from "@/app/components/expenses/RequestTicketModal";

const ExpensesPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<ExpenseTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await getMyExpenseTickets();
      if (res.error) {
        setError(res.error);
      } else {
        setTickets(res.tickets);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleTicketRequested = () => {
    fetchTickets();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-500/20 text-green-300";
      case "PENDING_APPROVAL": return "bg-yellow-500/20 text-yellow-300";
      case "REJECTED": return "bg-red-500/20 text-red-300";
      case "SUBMITTED": return "bg-blue-500/20 text-blue-300";
      case "COMPLETED": return "bg-gray-500/20 text-gray-300";
      default: return "bg-gray-700 text-gray-200";
    }
  };

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <header className="flex justify-between items-center mb-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">My Expenses</h1>
            <p className="text-gray-400 mt-2">Track and manage your expense tickets.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Request New Ticket
          </Button>
        </header>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <Card
                key={ticket.ticketId}
                className="bg-gray-900/40 border-gray-800 cursor-pointer hover:bg-gray-800/60"
                onClick={() => router.push(`/expenses/${ticket.ticketId}`)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">{ticket.description}</p>
                    <p className="text-sm text-gray-400">{ticket.ticketId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      {ticket.totalAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No expense tickets found.</p>
          )}
        </div>
      </main>
      {isModalOpen && <RequestTicketModal onClose={() => setIsModalOpen(false)} onTicketRequested={handleTicketRequested} />}
    </div>
  );
};

export default ExpensesPage;
