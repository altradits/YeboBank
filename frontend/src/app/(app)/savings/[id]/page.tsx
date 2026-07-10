import { Suspense } from "react";
import { mockLocks } from "@/lib/mock";
import LockDetail from "./LockDetail";

// Static export: pre-render every savings lock seeded in the mock data. Locks
// created at runtime live only in memory, so there is nothing else to pre-render.
export function generateStaticParams() {
  return mockLocks.map((l) => ({ id: l.id }));
}

export default function Page() {
  return (
    <Suspense>
      <LockDetail />
    </Suspense>
  );
}
