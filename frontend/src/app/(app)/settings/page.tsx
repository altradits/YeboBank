"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { logout } from "@/lib/api";
import { mockUser } from "@/lib/mock";
import { maskPhone } from "@/lib/format";

export default function SettingsPage() {
  const router = useRouter();
  async function onLogout() {
    await logout();
    router.push("/login");
  }
  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Your account and preferences.</p>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-head"><h2>Profile</h2></div>
        <Row label="Full name" value={mockUser.fullName} />
        <Row label="Phone" value={maskPhone(mockUser.phone)} />
        <Row label="Lightning address" value={mockUser.lightningAddress} />
        <Row label="Language" value={mockUser.language === "sw" ? "Kiswahili" : "English"} />
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Security</h2></div>
        <p className="note">Change your password or transaction PIN. (Coming with the backend.)</p>
        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <Button variant="ghost">Change password</Button>
          <Button variant="ghost">Change PIN</Button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Button variant="ghost" onClick={onLogout}><i className="ti ti-logout" /> Log out</Button>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="tx-row" style={{ justifyContent: "space-between" }}>
      <span className="note">{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
