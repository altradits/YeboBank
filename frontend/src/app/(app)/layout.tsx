import { Sidebar, BottomNav } from "@/components/app/Nav";
import { TopBar } from "@/components/app/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
