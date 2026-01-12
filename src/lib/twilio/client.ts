import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioClient = accountSid && authToken 
  ? Twilio(accountSid, authToken) 
  : null;

export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && TWILIO_WHATSAPP_NUMBER);
}
