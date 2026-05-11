"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import type { TrackingLocation } from "@/lib/tracking";

type MapPoint = [number, number];

type TrackingMapVisualProps = {
  courierLabel: string;
  destinationLabel: string;
  courierLocation: TrackingLocation | null;
  destinationLocation: {
    latitude: number;
    longitude: number;
  } | null;
};

const courierSvg = `
  <svg viewBox="0 0 64 64" class="tracking-map-marker__icon">
    <path d="M12 41h7l7-13h12l4 7h6" />
    <path d="M26 28l5-9h9" />
    <path d="M42 35l-7-13" />
    <path d="M20 41h22" />
    <circle cx="18" cy="43" r="8" />
    <circle cx="48" cy="43" r="8" />
  </svg>
`;

const customerSvg = `
  <svg viewBox="0 0 64 64" class="tracking-map-marker__icon">
    <circle cx="32" cy="18" r="8" />
    <path d="M22 55c1.5-11 5-17 10-17s8.5 6 10 17" />
    <path d="M23 35c-7-4-10-9-9-15" />
    <path d="M41 34c7-4 10-10 9-17" />
    <path d="M47 16l5-6" />
  </svg>
`;

const courierIcon = divIcon({
  className: "tracking-map-marker",
  html: `
    <span class="tracking-map-marker__badge tracking-map-marker__badge--courier" aria-hidden="true">
      ${courierSvg}
    </span>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 35],
});

const destinationIcon = divIcon({
  className: "tracking-map-marker",
  html: `
    <span class="tracking-map-marker__badge tracking-map-marker__badge--destination" aria-hidden="true">
      ${customerSvg}
    </span>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 39],
});

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 15, {
        animate: true,
      });
      return;
    }

    map.fitBounds(latLngBounds(points), {
      animate: true,
      padding: [42, 42],
    });
  }, [map, points]);

  return null;
}

function CourierLegendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <path d="M12 41h7l7-13h12l4 7h6" />
      <path d="M26 28l5-9h9" />
      <path d="M42 35l-7-13" />
      <path d="M20 41h22" />
      <circle cx="18" cy="43" r="8" />
      <circle cx="48" cy="43" r="8" />
    </svg>
  );
}

function CustomerLegendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <circle cx="32" cy="18" r="8" />
      <path d="M22 55c1.5-11 5-17 10-17s8.5 6 10 17" />
      <path d="M23 35c-7-4-10-9-9-15" />
      <path d="M41 34c7-4 10-10 9-17" />
      <path d="M47 16l5-6" />
    </svg>
  );
}

export function TrackingMapVisual({
  courierLabel,
  destinationLabel,
  courierLocation,
  destinationLocation,
}: TrackingMapVisualProps) {
  const courierPoint = courierLocation
    ? ([courierLocation.latitude, courierLocation.longitude] as MapPoint)
    : null;
  const destinationPoint = destinationLocation
    ? ([destinationLocation.latitude, destinationLocation.longitude] as MapPoint)
    : null;
  const points = [courierPoint, destinationPoint].filter(
    (point): point is MapPoint => point !== null,
  );
  const missingDestination = !destinationPoint;
  const missingCourier = !courierPoint;

  if (points.length === 0) {
    return (
      <div className="tracking-map-shell">
        <div className="tracking-map-empty">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Aun no hay coordenadas para este pedido.
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            A este pedido le faltan las coordenadas del destino y el repartidor
            aun no envia su primera senal. El mapa se activa en cuanto exista al
            menos uno de esos dos puntos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-map-shell">
      <MapContainer
        center={points[0]}
        zoom={15}
        scrollWheelZoom={false}
        className="tracking-map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {courierPoint ? (
          <Marker position={courierPoint} icon={courierIcon}>
            <Popup>
              <strong>Repartidor</strong>
              <br />
              {courierLabel}
              <br />
              Ultimo ping: {courierLocation?.recordedAtLabel ?? "Sin hora"}
            </Popup>
          </Marker>
        ) : null}

        {destinationPoint ? (
          <Marker position={destinationPoint} icon={destinationIcon}>
            <Popup>
              <strong>Cliente</strong>
              <br />
              {destinationLabel}
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="tracking-map-overlay">
        <div className="tracking-map-legend">
          <span className="tracking-map-legend__item">
            <span className="tracking-map-legend__icon">
              <CourierLegendIcon />
            </span>
            Repartidor
          </span>
          <span className="tracking-map-legend__item">
            <span className="tracking-map-legend__icon">
              <CustomerLegendIcon />
            </span>
            Cliente
          </span>
        </div>
        {courierLocation ? (
          <div className="tracking-map-overlay__note">
            Ultima posicion: {courierLocation.recordedAtLabel}
          </div>
        ) : missingDestination ? (
          <div className="tracking-map-overlay__note">
            Solo hay un punto disponible. Faltan coordenadas del destino y la
            primera senal del repartidor.
          </div>
        ) : missingCourier ? (
          <div className="tracking-map-overlay__note">
            Ya se ve el cliente. Falta que el repartidor envie su primera
            ubicacion.
          </div>
        ) : (
          <div className="tracking-map-overlay__note">
            Ya llego la senal del repartidor. Falta capturar el destino para
            mostrar tambien el punto del cliente.
          </div>
        )}
      </div>
    </div>
  );
}
