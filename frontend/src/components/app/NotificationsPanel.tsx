"use client";

interface Notif {
  id: string;
  kind: "vote" | "join" | "deposit" | "statement" | "withdrawal";
  title: string;
  body: string;
  ago: string;
  read?: boolean;
}

const MOCK_NOTIFS: Notif[] = [
  { id: "n1", kind: "vote",       title: "New vote in Mama Mboga Ltd",      body: "\"Should we increase monthly contribution to KES 2,000?\" — 3 of 8 voted.",  ago: "2h ago" },
  { id: "n2", kind: "deposit",    title: "Deposit confirmed",                body: "KES 1,000 converted to 12,480 sats via M-Pesa.",                               ago: "5h ago" },
  { id: "n3", kind: "join",       title: "Join request — Kilimani Savers",   body: "Jane Achieng wants to join. 6 approvals needed (you can vote).",               ago: "1d ago" },
  { id: "n4", kind: "statement",  title: "Monthly statement ready",          body: "June statement posted. Return: KES 1,240 after 2% fee.",                       ago: "2d ago", read: true },
];

const KIND_META: Record<Notif["kind"], { icon: string; color: string }> = {
  vote:       { icon: "ti-thumb-up",        color: "var(--gold-soft)" },
  join:       { icon: "ti-user-plus",       color: "var(--lime)" },
  deposit:    { icon: "ti-circle-check",    color: "var(--emerald-deep)" },
  statement:  { icon: "ti-file-text",       color: "var(--gold)" },
  withdrawal: { icon: "ti-arrow-up-circle", color: "var(--terra)" },
};

export default function NotificationsPanel() {
  const unread = MOCK_NOTIFS.filter((n) => !n.read).length;

  return (
    <div className="card notif-panel">
      <div className="section-head">
        <h2>
          Notifications
          {unread > 0 && <span className="notif-badge">{unread}</span>}
        </h2>
      </div>

      <div className="notif-list">
        {MOCK_NOTIFS.map((n) => {
          const { icon, color } = KIND_META[n.kind];
          return (
            <div key={n.id} className={`notif-row${n.read ? " notif-row--read" : ""}`}>
              <div className="notif-icon-wrap" style={{ background: `${color}18`, color }}>
                <i className={`ti ${icon}`} />
              </div>
              <div className="notif-body">
                <p className="notif-title">{n.title}</p>
                <p className="notif-text">{n.body}</p>
              </div>
              <span className="notif-ago">{n.ago}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
