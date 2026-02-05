"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  MessageSquare, AlertCircle, CheckCircle, Clock, Wifi, WifiOff, 
  QrCode, RefreshCw, Loader2, Volume2, VolumeX, Bell, Shield,
  Phone, User, Calendar, Search, X, ExternalLink
} from "lucide-react";

// WhatsApp Server URL - configure in .env.local
const WA_SERVER_URL = process.env.NEXT_PUBLIC_WA_SERVER_URL || "http://localhost:3001";

interface ConnectionStatus {
  status: "disconnected" | "initializing" | "qr_pending" | "authenticated" | "ready";
  qrCode: string | null;
  qrDataUrl: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  lastError: string | null;
  connectedAt: string | null;
}

interface CashMention {
  id: string;
  message_id: string;
  from_number: string;
  contact_name: string;
  message_text: string;
  timestamp: string;
  is_group: boolean;
  matched_keywords: string[];
  review_status: "pending" | "confirmed" | "false_positive" | "dismissed";
  notes: string | null;
}

interface RealtimeAlert {
  id: string;
  from: string;
  contactName: string;
  text: string;
  timestamp: string;
  isGroup: boolean;
}

export default function WhatsAppMonitoringPage() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "disconnected",
    qrCode: null,
    qrDataUrl: null,
    phoneNumber: null,
    displayName: null,
    lastError: null,
    connectedAt: null,
  });
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Monitoring state
  const [cashMentions, setCashMentions] = useState<CashMention[]>([]);
  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serverOnlineRef = useRef<boolean | null>(null);
  const soundEnabledRef = useRef(true);

  // Keep refs in sync
  useEffect(() => {
    serverOnlineRef.current = serverOnline;
  }, [serverOnline]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Check server health
  const checkServerHealth = useCallback(async () => {
    try {
      const res = await fetch(`${WA_SERVER_URL}/health`, { 
        method: "GET",
        mode: "cors",
      });
      setServerOnline(res.ok);
      return res.ok;
    } catch {
      setServerOnline(false);
      return false;
    }
  }, []);

  // Fetch flagged messages from server
  const fetchMessages = useCallback(async () => {
    try {
      const url = new URL(`${WA_SERVER_URL}/api/messages`);
      if (filter !== "all") {
        url.searchParams.set("status", filter);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setCashMentions(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [filter]);

  // Connect WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsUrl = WA_SERVER_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "status":
            setConnectionStatus(message.data);
            break;
          case "qr":
            setConnectionStatus(prev => ({
              ...prev,
              status: "qr_pending",
              qrDataUrl: message.data.qrDataUrl,
            }));
            break;
          case "ready":
            // Fetch messages on ready
            fetch(`${WA_SERVER_URL}/api/messages`)
              .then(res => res.json())
              .then(data => setCashMentions(data.messages || []))
              .catch(console.error);
            break;
          case "cash_alert":
            // Add to realtime alerts
            setRealtimeAlerts(prev => [message.data, ...prev].slice(0, 50));
            // Play sound if enabled (use ref to avoid dependency)
            if (soundEnabledRef.current && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            // Refresh messages list
            fetch(`${WA_SERVER_URL}/api/messages`)
              .then(res => res.json())
              .then(data => setCashMentions(data.messages || []))
              .catch(console.error);
            break;
          case "disconnected":
            setConnectionStatus(prev => ({
              ...prev,
              status: "disconnected",
              lastError: message.data?.reason,
            }));
            break;
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      wsRef.current = null;
      // Reconnect after 3 seconds using ref to check server status
      reconnectTimeoutRef.current = setTimeout(() => {
        if (serverOnlineRef.current) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  }, []);

  // Initialize WhatsApp connection
  const initializeConnection = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${WA_SERVER_URL}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize");
      }
    } catch (error) {
      console.error("Failed to initialize:", error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      await fetch(`${WA_SERVER_URL}/api/disconnect`, { method: "POST" });
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Update review status
  const updateReviewStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${WA_SERVER_URL}/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: status }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Initial setup - run once on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${WA_SERVER_URL}/health`, { method: "GET", mode: "cors" });
        const online = res.ok;
        setServerOnline(online);
        serverOnlineRef.current = online;
        
        if (online) {
          // Fetch status
          const statusRes = await fetch(`${WA_SERVER_URL}/api/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setConnectionStatus(statusData);
          }
          // Fetch messages
          const messagesRes = await fetch(`${WA_SERVER_URL}/api/messages`);
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setCashMentions(messagesData.messages || []);
          }
          // Connect WebSocket
          connectWebSocket();
        }
      } catch {
        setServerOnline(false);
        serverOnlineRef.current = false;
      }
      setLoading(false);
    };
    init();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  // Refetch messages when filter changes
  useEffect(() => {
    if (serverOnline) {
      fetchMessages();
    }
  }, [filter, serverOnline, fetchMessages]);

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800";
      case "authenticated": return "bg-blue-100 text-blue-800";
      case "qr_pending": return "bg-amber-100 text-amber-800";
      case "initializing": return "bg-blue-100 text-blue-800";
      default: return "bg-stone-100 text-stone-800";
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // Server offline state
  if (serverOnline === false) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">WhatsApp Cash Monitor</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <WifiOff className="h-8 w-8 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">WhatsApp Server Offline</h2>
              <p className="text-red-800 mb-4">
                The WhatsApp monitoring server is not running. Please start the server to enable monitoring.
              </p>
              <div className="bg-red-100 rounded-lg p-4 mb-4">
                <p className="font-mono text-sm text-red-900">
                  cd whatsapp-server<br />
                  npm install<br />
                  npm start
                </p>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Server URL: <code className="bg-red-100 px-2 py-1 rounded">{WA_SERVER_URL}</code>
              </p>
              <button
                onClick={() => checkServerHealth()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Hidden audio element for alerts */}
      <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">WhatsApp Cash Monitor</h1>
            <p className="text-stone-500 text-sm">Monitor conversations for cash keyword mentions</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(connectionStatus.status)}`}>
              {connectionStatus.status === "ready" ? "Connected" : connectionStatus.status.replace("_", " ")}
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-stone-100 rounded-lg"
              title={soundEnabled ? "Mute alerts" : "Enable alerts"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-stone-400" />}
            </button>
            <button
              onClick={fetchMessages}
              className="p-2 hover:bg-stone-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - QR Code / Connection */}
        <div className="w-96 border-r bg-stone-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              WhatsApp Connection
            </h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {connectionStatus.status === "ready" ? (
              // Connected state
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">{connectionStatus.displayName || "Connected"}</p>
                      <p className="text-sm text-green-700">{connectionStatus.phoneNumber}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600">
                    Connected since {connectionStatus.connectedAt ? new Date(connectionStatus.connectedAt).toLocaleString() : "now"}
                  </p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Monitoring Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">cash</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">نقد</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">كاش</span>
                  </div>
                </div>

                <button
                  onClick={disconnectWhatsApp}
                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Disconnect WhatsApp
                </button>
              </div>
            ) : connectionStatus.status === "qr_pending" && connectionStatus.qrDataUrl ? (
              // QR Code state
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4 text-center">
                  <img 
                    src={connectionStatus.qrDataUrl} 
                    alt="WhatsApp QR Code" 
                    className="mx-auto mb-4"
                  />
                  <p className="text-sm text-stone-600 mb-2">
                    Scan this QR code with WhatsApp
                  </p>
                  <ol className="text-xs text-stone-500 text-left space-y-1">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Go to Settings → Linked Devices</li>
                    <li>3. Tap &quot;Link a Device&quot;</li>
                    <li>4. Scan this QR code</li>
                  </ol>
                </div>
              </div>
            ) : connectionStatus.status === "initializing" || connectionStatus.status === "authenticated" ? (
              // Initializing state
              <div className="bg-white border rounded-lg p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
                <p className="font-medium text-stone-900">
                  {connectionStatus.status === "authenticated" ? "Authenticated, loading..." : "Initializing WhatsApp..."}
                </p>
                <p className="text-sm text-stone-500 mt-2">
                  Please wait while we connect to WhatsApp
                </p>
              </div>
            ) : (
              // Disconnected state
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-stone-400" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Connect WhatsApp</h3>
                  <p className="text-sm text-stone-500 mb-4">
                    Connect your WhatsApp account to start monitoring for cash mentions
                  </p>
                  <button
                    onClick={initializeConnection}
                    disabled={connecting}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-5 w-5" />
                        Generate QR Code
                      </>
                    )}
                  </button>
                </div>

                {connectionStatus.lastError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{connectionStatus.lastError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Real-time alerts preview */}
            {realtimeAlerts.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  Recent Alerts
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {realtimeAlerts.slice(0, 5).map((alert, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                      <p className="font-medium text-red-900">{alert.contactName || alert.from}</p>
                      <p className="text-red-700 truncate">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Flagged Messages */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Cash Mentions ({cashMentions.length})
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending Review</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cashMentions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-stone-900 mb-2">No Cash Mentions</h3>
                  <p className="text-stone-500">
                    {connectionStatus.status === "ready" 
                      ? "All clear! No suspicious messages detected."
                      : "Connect WhatsApp to start monitoring messages."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {cashMentions.map((mention) => (
                  <div key={mention.id} className="p-4 hover:bg-stone-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-stone-500" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">
                            {mention.contact_name || mention.from_number}
                          </p>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(mention.timestamp).toLocaleString()}
                            {mention.is_group && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Group</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        mention.review_status === "pending" ? "bg-amber-100 text-amber-800" :
                        mention.review_status === "confirmed" ? "bg-red-100 text-red-800" :
                        mention.review_status === "false_positive" ? "bg-green-100 text-green-800" :
                        "bg-stone-100 text-stone-600"
                      }`}>
                        {mention.review_status}
                      </span>
                    </div>

                    <div className="bg-stone-100 rounded-lg p-3 mb-3">
                      <p className="text-stone-800 whitespace-pre-wrap">{mention.message_text}</p>
                      {mention.matched_keywords?.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {mention.matched_keywords.map((kw, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-xs">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {mention.review_status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateReviewStatus(mention.id, "confirmed")}
                          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Confirm Violation
                        </button>
                        <button
                          onClick={() => updateReviewStatus(mention.id, "false_positive")}
                          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          False Positive
                        </button>
                        <button
                          onClick={() => updateReviewStatus(mention.id, "dismissed")}
                          className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
