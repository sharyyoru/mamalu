export const DEPOSIT_CUTOFF_DAYS = 2;

export function dateAllowsDeposit(eventDate: string, currentDate: string) {
  if (!eventDate || !currentDate) return false;

  const start = new Date(`${currentDate}T00:00:00Z`);
  const event = new Date(`${eventDate}T00:00:00Z`);
  const daysUntilEvent = Math.round((event.getTime() - start.getTime()) / 86_400_000);

  return daysUntilEvent > DEPOSIT_CUTOFF_DAYS;
}

export function getDubaiDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
