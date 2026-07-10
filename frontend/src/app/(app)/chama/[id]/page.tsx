import { Suspense } from "react";
import { mockChamas, mockAllChamas } from "@/lib/mock";
import ChamaDashboard from "./ChamaDashboard";

// Static export: pre-render every chama seeded in the mock data. Chamas created
// at runtime live only in memory, so there is nothing else to pre-render.
export function generateStaticParams() {
  const ids = new Set([...mockChamas, ...mockAllChamas].map((c) => c.id));
  return [...ids].map((id) => ({ id }));
}

export default function Page() {
  return (
    <Suspense>
      <ChamaDashboard />
    </Suspense>
  );
}
