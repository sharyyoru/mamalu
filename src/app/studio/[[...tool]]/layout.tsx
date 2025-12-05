export const metadata = {
  title: "Mamalu Kitchen CMS",
  description: "Content management for Mamalu Kitchen",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
