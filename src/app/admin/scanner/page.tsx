"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, User, Calendar, Loader2 } from "lucide-react";

interface CheckInResult {
  success: boolean;
  message?: string;
  error?: string;
  alreadyCheckedIn?: boolean;
  booking?: {
    id: string;
    bookingNumber: string;
    attendeeName: string;
    attendeeEmail?: string;
    classTitle: string;
    classId?: string;
    sessionsBooked?: number;
    checkedInAt?: string;
  };
}

export default function EventScannerPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckInResult["booking"][]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Process token from URL on mount
  useEffect(() => {
    if (tokenFromUrl && !processing) {
      processCheckIn(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const processCheckIn = useCallback(async (token: string) => {
    if (processing) return;
    
    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          deviceInfo: navigator.userAgent,
        }),
      });

      const data: CheckInResult = await res.json();
      setResult(data);

      if (data.success && data.booking) {
        setRecentCheckins(prev => [data.booking!, ...prev.slice(0, 9)]);
      }

      // Auto-clear result after 5 seconds for successful scans
      if (data.success) {
        setTimeout(() => setResult(null), 5000);
      }
    } catch (error) {
      setResult({ success: false, error: "Network error - please try again" });
    } finally {
      setProcessing(false);
      setManualToken("");
    }
  }, [processing]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        scanQRCode();
      }
    } catch (error) {
      setCameraError("Unable to access camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // Use BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          // Extract token from URL
          const url = new URL(qrData);
          const token = url.searchParams.get("token");
          if (token) {
            stopCamera();
            processCheckIn(token);
            return;
          }
        }
      }
    } catch (error) {
      // BarcodeDetector not supported or error, continue scanning
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      processCheckIn(manualToken.trim());
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Event Scanner</h1>
        <p className="text-stone-600">Scan QR codes to check in attendees</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-4 ${
          result.success 
            ? "bg-green-50 border border-green-200" 
            : result.alreadyCheckedIn
            ? "bg-amber-50 border border-amber-200"
            : "bg-red-50 border border-red-200"
        }`}>
          {result.success ? (
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
          ) : result.alreadyCheckedIn ? (
            <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${
              result.success ? "text-green-800" : result.alreadyCheckedIn ? "text-amber-800" : "text-red-800"
            }`}>
              {result.success ? "Check-In Successful!" : result.alreadyCheckedIn ? "Already Checked In" : "Check-In Failed"}
            </h3>
            {result.booking && (
              <div className="mt-2 space-y-1">
                <p className="text-stone-700"><strong>{result.booking.attendeeName}</strong></p>
                <p className="text-stone-600 text-sm">{result.booking.classTitle}</p>
                <p className="text-stone-500 text-sm">Booking: {result.booking.bookingNumber}</p>
                {result.booking.checkedInAt && (
                  <p className="text-stone-500 text-sm">
                    Checked in: {new Date(result.booking.checkedInAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {result.error && !result.booking && (
              <p className="text-red-700 mt-1">{result.error}</p>
            )}
          </div>
          <button 
            onClick={() => setResult(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Scanner Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Scanner
          </h2>
          
          {cameraError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {cameraError}
            </div>
          )}

          <div className="relative aspect-square bg-stone-100 rounded-lg overflow-hidden mb-4">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-amber-500 rounded-lg"></div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400">
                <Camera className="h-16 w-16 mb-4" />
                <p>Camera is off</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <button
            onClick={scanning ? stopCamera : startCamera}
            disabled={processing}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              scanning
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-amber-600 text-white hover:bg-amber-700"
            } disabled:opacity-50`}
          >
            {scanning ? "Stop Camera" : "Start Camera"}
          </button>

          <p className="text-xs text-stone-500 mt-2 text-center">
            Point camera at QR code to auto-scan
          </p>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Manual Entry
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                QR Code Token
              </label>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste token or booking number"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={processing || !manualToken.trim()}
              className="w-full py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Check In"
              )}
            </button>
          </form>

          {/* Recent Check-ins */}
          {recentCheckins.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Check-ins
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentCheckins.map((checkin, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{checkin?.attendeeName}</p>
                      <p className="text-stone-500 text-xs truncate">{checkin?.classTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-stone-50 rounded-lg p-6">
        <h3 className="font-semibold text-stone-800 mb-3">How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
          <li>Click &quot;Start Camera&quot; to enable the QR scanner</li>
          <li>Point the camera at the attendee&apos;s QR code</li>
          <li>The system will automatically detect and process the check-in</li>
          <li>Alternatively, manually enter the token if camera scanning fails</li>
        </ol>
      </div>
    </div>
  );
}
