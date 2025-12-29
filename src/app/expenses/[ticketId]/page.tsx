"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { getSingleExpenseTicket, getExpenseMetadata, addExpenseItem, removeExpenseItem, submitExpenseTicket } from "@/actions/user";
import { ExpenseTicket, ExpenseItem } from "@/types";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, Send, Loader2, ArrowLeft } from "lucide-react";

interface Currency {
    code: string;
    name: string;
    symbol: string;
}

const SingleTicketPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<ExpenseTicket | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // New Item Form State
  const [newItem, setNewItem] = useState({
    category: "",
    amountInLocalCurrency: "",
    currency: "USD",
    note: "",
    file: null as File | null,
  });
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await getSingleExpenseTicket(ticketId as string);
      if (res.error) {
        setError(res.error);
      } else {
        setTicket(res);
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

    if (isAuthenticated && ticketId) {
      fetchTicket();
      getExpenseMetadata().then(res => {
        if (!res.error) {
            setCategories(res.categories);
            setCurrencies(res.currencies);
        }
      });
    }
  }, [isAuthenticated, authLoading, router, ticketId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewItem({ ...newItem, file: e.target.files[0] });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.file || !newItem.category || !newItem.amountInLocalCurrency || !newItem.currency) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setIsSubmittingItem(true);
    const formData = new FormData();
    formData.append("document", newItem.file);
    formData.append("category", newItem.category);
    formData.append("amountInLocalCurrency", newItem.amountInLocalCurrency);
    formData.append("currency", newItem.currency);
    formData.append("note", newItem.note);

    try {
      const res = await addExpenseItem(ticketId as string, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setTicket(res.ticket);
        setNewItem({ category: "", amountInLocalCurrency: "", currency: "USD", note: "", file: null });
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await removeExpenseItem(ticketId as string, itemId);
      if (res.error) {
        setError(res.error);
      } else {
        setTicket(res.ticket);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleSubmitTicket = async () => {
    setIsSubmittingTicket(true);
    try {
      const res = await submitExpenseTicket(ticketId as string);
      if (res.error) {
        setError(res.error);
      } else {
        setTicket(res.ticket);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmittingTicket(false);
    }
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

  if (!ticket) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">{error || "Ticket not found."}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <header className="mb-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Expenses
            </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{ticket.description}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-400">{ticket.ticketId}</p>
            <p className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
              {ticket.status?.replace("_", " ")}
            </p>
          </div>
        </header>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        {ticket.status === 'REJECTED' && ticket.rejectionReason && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-8">
                <h3 className="font-bold">Ticket Rejected</h3>
                <p>{ticket.rejectionReason}</p>
            </div>
        )}

        {/* Add Item Form */}
        {ticket.status === 'APPROVED' && (
          <Card className="bg-gray-900/40 border-gray-800 mb-8">
            <CardHeader><CardTitle>Add New Expense Item</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" value={newItem.amountInLocalCurrency} onChange={(e) => setNewItem({ ...newItem, amountInLocalCurrency: e.target.value })} placeholder="e.g., 150.75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={newItem.currency} onValueChange={(value) => setNewItem({ ...newItem, currency: value })}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                        {currencies.map(curr => <SelectItem key={curr.code} value={curr.code}>{curr.code} - {curr.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="note">Note</Label>
                <Input id="note" value={newItem.note} onChange={(e) => setNewItem({ ...newItem, note: e.target.value })} placeholder="Optional note" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="file">Receipt</Label>
                <Input id="file" type="file" onChange={handleFileChange} />
              </div>
              <div className="sm:col-span-2 md:col-span-5 text-right">
                <Button onClick={handleAddItem} disabled={isSubmittingItem}>
                  {isSubmittingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Items */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Expense Items</CardTitle>
            <p className="text-2xl font-bold text-emerald-400">{(ticket.totalAmount ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
          </CardHeader>
          <CardContent>
            {(ticket.items && ticket.items.length > 0) ? (
              <div className="space-y-4">
                {ticket.items.map(item => (
                  <div key={item._id} className="p-4 bg-gray-800/60 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <p className="font-semibold text-white">{item.category}</p>
                        <p className="text-sm text-gray-400">{item.note || 'No note'}</p>
                      </div>
                      <div className="text-right flex-shrink-0 pl-4">
                        <p className="font-semibold text-white">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amountInLocalCurrency)}
                        </p>
                        <p className="text-xs text-gray-400">
                          (≈ {item.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700/50">
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                        View Receipt
                      </a>
                      {ticket.status === 'APPROVED' && (
                        <Button variant="destructive" size="icon" onClick={() => handleRemoveItem(item._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No items added to this ticket yet.</p>
            )}
          </CardContent>
        </Card>

        {ticket.status === 'APPROVED' && ticket.items && ticket.items.length > 0 && (
          <div className="mt-8 text-right">
            <Button size="lg" onClick={handleSubmitTicket} disabled={isSubmittingTicket}>
              {isSubmittingTicket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit for Review
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SingleTicketPage;
