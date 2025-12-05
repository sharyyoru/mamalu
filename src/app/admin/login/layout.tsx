export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page uses plain layout - no auth check, no sidebar
  return children;
}
