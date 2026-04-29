"use client";

import dynamic from "next/dynamic";

export type DestinationPoint = {
  latitude: string;
  longitude: string;
};

type DestinationMapPickerProps = {
  addressLabel: string;
  latitude: string;
  longitude: string;
  onChange: (point: DestinationPoint) => void;
};

const DestinationMapPickerVisual = dynamic(
  () =>
    import("@/app/dashboard/_components/destination-map-picker-visual").then(
      (mod) => mod.DestinationMapPickerVisual,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="destination-map-picker destination-map-picker--loading">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">
          Preparando mapa de destino...
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
          En cuanto cargue el mapa podras tocar el punto exacto de entrega.
        </p>
      </div>
    ),
  },
);

export function DestinationMapPicker(props: DestinationMapPickerProps) {
  return <DestinationMapPickerVisual {...props} />;
}
