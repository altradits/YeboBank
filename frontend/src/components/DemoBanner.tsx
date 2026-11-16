// Permanent demo banner. Rendered by the root layout so it appears on every
// screen. Must never be removed while this repo is a test-networks-only demo.
export default function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Demo: test sats only, no real money"
      style={{
        background: "#1a2e1f",
        color: "#ffd978",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: 1.4,
        padding: "8px 16px",
        textAlign: "center",
        position: "sticky",
        top: 0,
        zIndex: 9999,
      }}
    >
      Demo: test sats only, no real money. Interest, Mlinzi returns and agent
      float are simulated.
    </div>
  );
}
