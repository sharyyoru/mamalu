"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CheckCircle, XCircle, AlertCircle, Calendar, Loader2, Users } from "lucide-react";
import jsQR from "jsqr";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
}

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
    date?: string;
    time?: string;
    totalGuests?: number;
    attendance?: number | null;
    checkedInAt?: string;
  };
}

export default function EventScannerPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scannedToken, setScannedToken] = useState("");
  const [attendance, setAttendance] = useState(1);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckInResult["booking"][]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetectorInstance | null>(null);

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
          action: "preview",
          deviceInfo: navigator.userAgent,
        }),
      });

      const data: CheckInResult = await res.json();
      setResult(data);
      if (data.success && data.booking) {
        setScannedToken(token);
        setAttendance(data.booking.attendance ?? data.booking.totalGuests ?? 1);
      }
    } catch (error) {
      setResult({ success: false, error: "Network error - please try again" });
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  const saveAttendance = async () => {
    if (!scannedToken || processing) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: scannedToken, action: "confirm", attendance, deviceInfo: navigator.userAgent }),
      });
      const data: CheckInResult = await res.json();
      setResult(data);
      if (data.success && data.booking) {
        setRecentCheckins(prev => [data.booking!, ...prev.slice(0, 9)]);
        setScannedToken("");
      }
    } catch {
      setResult({ success: false, error: "Network error - please try again" });
    } finally {
      setProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Camera preview is not ready");
      }

      video.srcObject = stream;
      streamRef.current = stream;
      await video.play();
      setScanning(true);
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
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
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      let qrData: string | null = null;

      if ("BarcodeDetector" in window) {
        if (!barcodeDetectorRef.current) {
          const Detector = (window as Window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
          barcodeDetectorRef.current = new Detector({ formats: ["qr_code"] });
        }
        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        if (barcodes.length > 0) {
          qrData = barcodes[0].rawValue;
        }
      }

      if (!qrData) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        qrData = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        })?.data || null;
      }

      if (qrData) {
        let token = qrData;
        try {
          token = new URL(qrData).searchParams.get("token") || qrData;
        } catch {}

        stopCamera();
        processCheckIn(token);
        return;
      }
    } catch {
      // Keep scanning when a frame cannot be decoded.
    }

    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

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
              {result.success ? (scannedToken ? "Booking Found" : "Attendance Saved") : result.alreadyCheckedIn ? "Already Checked In" : "Scan Failed"}
            </h3>
            {result.booking && (
              <div className="mt-2 space-y-1">
                <p className="text-stone-700"><strong>{result.booking.attendeeName}</strong></p>
                <p className="text-stone-600 text-sm">{result.booking.classTitle}</p>
                <p className="text-stone-500 text-sm">Booking: {result.booking.bookingNumber}</p>
                {result.booking.date && <p className="text-stone-500 text-sm">Date: {result.booking.date} {result.booking.time || ""}</p>}
                <p className="text-stone-500 text-sm">Booked guests: {result.booking.totalGuests || 1}</p>
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
            />
            {scanning ? (
              <>
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

        {/* Booking details and attendance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Booking Attendance
          </h2>

          {scannedToken && result?.booking ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-stone-50 p-4 space-y-1 text-sm">
                <p className="font-semibold text-stone-900">{result.booking.attendeeName}</p>
                <p className="text-stone-600">{result.booking.classTitle}</p>
                <p className="text-stone-500">{result.booking.bookingNumber}</p>
              </div>
              <label className="block text-sm font-medium text-stone-700">
                Guests Attended
              <input
                type="number"
                min={0}
                max={result.booking.totalGuests || 1}
                value={attendance}
                onChange={(e) => setAttendance(Number(e.target.value))}
                className="mt-1 w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              </label>
            <button
                onClick={saveAttendance}
                disabled={processing}
                className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                  "Save Attendance"
              )}
            </button>
            </div>
          ) : (
            <div className="min-h-52 flex flex-col items-center justify-center text-center text-stone-400">
              <Users className="h-12 w-12 mb-3" />
              <p>Scan a booking QR code to view details and record attendance.</p>
            </div>
          )}

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
          <li>Review the booking details after the QR code is detected</li>
          <li>Enter the number of guests who attended and save attendance</li>
        </ol>
      </div>
    </div>
  );
}
