"use client";

import dynamic from "next/dynamic";
import type { TrackingLocation } from "@/lib/tracking";

type TrackingMapProps = {
  courierLabel: string;
  destinationLabel: string;
  courierLocation: TrackingLocation | null;
  destinationLocation: {
    latitude: number;
    longitude: number;
  } | null;
};

const TrackingMapVisual = dynamic(
  () =>
    import("@/app/_components/tracking-map-visual").then(
      (mod) => mod.TrackingMapVisual,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="tracking-map-shell">
        <div className="tracking-map-empty">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Cargando mapa del pedido...
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            En cuanto el navegador termine de hidratar, aqui veras la posicion del
            repartidor y el destino final.
          </p>
        </div>
      </div>
    ),
  },
);

export function TrackingMap(props: TrackingMapProps) {
  return <TrackingMapVisual {...props} />;
}
