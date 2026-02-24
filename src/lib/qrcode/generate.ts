import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (base64 PNG)
 */
export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: "#1c1917",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a QR code as SVG string
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    width: 300,
    margin: 2,
    color: {
      dark: "#1c1917",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate booking check-in URL with QR token
 */
export function getCheckInUrl(qrToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mamalu.vercel.app";
  return `${baseUrl}/api/checkin/verify?token=${qrToken}`;
}

/**
 * Generate QR code for a booking
 */
export async function generateBookingQRCode(qrToken: string): Promise<string> {
  const checkInUrl = getCheckInUrl(qrToken);
  return generateQRCodeDataURL(checkInUrl);
}
