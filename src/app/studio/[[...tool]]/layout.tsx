export const metadata = {
  title: "Mamalu Kitchen CMS",
  description: "Content management for Mamalu Kitchen",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ margin: 0, height: "100vh" }}>{children}</div>;
}
