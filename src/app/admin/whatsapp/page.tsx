"use client";

import { useEffect, useState } from "react";
import { MessageSquare, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface WhatsAppAccount {
  id: string;
  phone_number: string;
  display_name: string;
  status: string;
  connected_at: string;
  stats: {
    total_messages: number;
    pending_flags: number;
  };
}

interface FlaggedMessage {
  id: string;
  message_text: string;
  flag_type: string;
  confidence_score: number;
  review_status: string;
  flagged_at: string;
  from_number: string;
  contact_name: string;
}

export default function WhatsAppMonitoringPage() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchFlaggedMessages(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/whatsapp/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedMessages = async (accountId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/messages?account_id=${accountId}&flagged_only=true&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setFlaggedMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch flagged messages:", error);
    }
  };

  const updateReviewStatus = async (messageId: string, status: string) => {
    try {
      const res = await fetch(`/api/whatsapp/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: status }),
      });
      if (res.ok) {
        fetchFlaggedMessages(selectedAccount!);
      }
    } catch (error) {
      console.error("Failed to update review status:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-stone-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">WhatsApp Monitoring</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <MessageSquare className="h-8 w-8 text-amber-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-amber-900 mb-2">No WhatsApp Accounts Connected</h2>
              <p className="text-amber-800 mb-4">
                Connect your WhatsApp Business account to start monitoring messages for cash mentions.
              </p>
              <button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">
                Connect WhatsApp Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Monitoring</h1>
        <p className="text-stone-600">Monitor WhatsApp messages for cash mentions and suspicious activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-600">Total Messages</span>
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">{selectedAccountData?.stats.total_messages || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-600">Pending Flags</span>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-600">{selectedAccountData?.stats.pending_flags || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-600">Connected Accounts</span>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold">{accounts.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
          <div className="flex gap-2 flex-wrap">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedAccount === account.id
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {account.display_name || account.phone_number}
                {account.stats.pending_flags > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {account.stats.pending_flags}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-xl font-semibold">Flagged Messages</h2>
        </div>
        <div className="divide-y divide-stone-200">
          {flaggedMessages.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No flagged messages found</p>
            </div>
          ) : (
            flaggedMessages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-stone-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-stone-900">
                      {message.contact_name || message.from_number}
                    </div>
                    <div className="text-sm text-stone-500">
                      {new Date(message.flagged_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      message.flag_type === "cash_mention" ? "bg-amber-100 text-amber-800" :
                      message.flag_type === "suspicious_activity" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {message.flag_type.replace("_", " ")}
                    </span>
                    <span className="text-sm text-stone-600">
                      {Math.round(message.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 rounded p-3 mb-3">
                  <p className="text-stone-700">{message.message_text}</p>
                </div>

                {message.review_status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReviewStatus(message.id, "confirmed")}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Confirm Violation
                    </button>
                    <button
                      onClick={() => updateReviewStatus(message.id, "false_positive")}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      False Positive
                    </button>
                    <button
                      onClick={() => updateReviewStatus(message.id, "dismissed")}
                      className="px-4 py-2 bg-stone-300 text-stone-700 rounded hover:bg-stone-400 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {message.review_status !== "pending" && (
                  <div className="flex items-center gap-2 text-sm">
                    {message.review_status === "confirmed" && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">Confirmed Violation</span>
                      </>
                    )}
                    {message.review_status === "false_positive" && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Marked as False Positive</span>
                      </>
                    )}
                    {message.review_status === "dismissed" && (
                      <>
                        <Clock className="h-4 w-4 text-stone-500" />
                        <span className="text-stone-500 font-medium">Dismissed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
