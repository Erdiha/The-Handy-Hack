// src/app/admin/support/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { TicketDetailsModal } from "@/components/modals/TicketDetailsModal";

interface SupportTicket {
  id: number;
  jobId: number;
  jobTitle: string;
  customerEmail: string;
  handymanName: string;
  problemType: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  reportedBy: number;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Admin check
  const isAdmin = session?.user?.email === "erdiha@gmail.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (isAdmin) {
      fetchSupportTickets();
    }
  }, [status, isAdmin, router]);

  const fetchSupportTickets = async () => {
    try {
      const response = await fetch("/api/admin/support-tickets");
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error("Failed to fetch support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async (
    ticketId: number,
    action: "refund" | "release"
  ) => {
    setResolving(ticketId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/resolve-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        fetchSupportTickets(); // Refresh tickets
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to resolve ticket");
    } finally {
      setResolving(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading support dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This shouldn't happen due to redirect, but just in case
  }

  const openTickets = tickets.filter((t) => t.status === "open");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Support Dashboard
          </h1>
          <p className="text-slate-600">
            Manage customer support tickets and resolve payment issues
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Open Tickets
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {openTickets.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Total Tickets
            </h3>
            <p className="text-3xl font-bold text-slate-600">
              {tickets.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Resolved
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {resolvedTickets.length}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.includes("✅")
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{message}</span>
              <button
                onClick={() => setMessage("")}
                className="text-sm underline opacity-70 hover:opacity-100"
              >
                dismiss
              </button>
            </div>
          </div>
        )}

        {/* Open Tickets */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Open Tickets ({openTickets.length})
          </h2>

          {openTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="font-semibold text-slate-800 mb-2">
                All caught up!
              </h3>
              <p className="text-slate-600">
                No open support tickets at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {openTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  className="bg-white rounded-xl border border-slate-200 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">
                        Ticket #{ticket.id} - {ticket.problemType}
                      </h3>
                      <p className="text-slate-600 mt-1">
                        Job: {ticket.jobTitle}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Reported{" "}
                        {new Date(ticket.createdAt).toLocaleDateString()} by{" "}
                        {ticket.customerEmail}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "normal"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority} priority
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-slate-800 mb-2">
                      Job Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Customer:</span>
                        <span className="ml-2 font-medium">
                          {ticket.customerEmail}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Handyman:</span>
                        <span className="ml-2 font-medium">
                          {ticket.handymanName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-800 mb-2">
                      Problem Description
                    </h4>
                    <p className="text-slate-600 bg-slate-50 rounded-lg p-4">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Resolution Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-slate-200">
                    <Button
                      onClick={() => handleResolveTicket(ticket.id, "refund")}
                      disabled={resolving === ticket.id}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      {resolving === ticket.id
                        ? "Processing..."
                        : "Refund Customer"}
                    </Button>
                    <Button
                      onClick={() => handleResolveTicket(ticket.id, "release")}
                      disabled={resolving === ticket.id}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      {resolving === ticket.id
                        ? "Processing..."
                        : "Release Payment"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Resolved Tickets */}
        {resolvedTickets.length > 0 && (
          <div
            onClick={() => {
              setIsTicketModalOpen(true);
              setSelectedTicketId(resolvedTickets[0].id);
            }}
            className="mt-12 cursor-pointer "
          >
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Recently Resolved ({resolvedTickets.slice(0, 5).length})
            </h2>
            <div className="space-y-3">
              {resolvedTickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 opacity-75 cursor-pointer hover:bg-white/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-800">
                        Ticket #{ticket.id} - {ticket.problemType}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {ticket.jobTitle} • {ticket.customerEmail}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      resolved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticketId={selectedTicketId}
        onResolve={handleResolveTicket}
      />
    </div>
  );
}
