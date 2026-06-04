const RESEND_TEST_FROM = "Mamalu Kitchen <onboarding@resend.dev>";

export function getEmailFrom() {
  return process.env.EMAIL_FROM || RESEND_TEST_FROM;
}
