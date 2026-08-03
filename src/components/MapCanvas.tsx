import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import type { SwimMapProps } from "./SwimMap";

const SwimMap = lazy(() => import("./SwimMap"));

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-secondary">
      <span className="label-eyebrow">Loading map…</span>
    </div>
  );
}

export function MapCanvas(props: SwimMapProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <SwimMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}