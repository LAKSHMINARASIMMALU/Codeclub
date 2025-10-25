import { Header } from "@/components/header";

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6 bg-muted/30">{children}</main>
    </div>
  );
}
