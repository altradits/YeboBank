import { TopBar } from "@/components/app/TopBar";
import RouteGuard from "@/components/app/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-main">
        <TopBar />
        <div className="app-content">
          <RouteGuard>{children}</RouteGuard>
        </div>
      </div>
    </div>
  );
}
