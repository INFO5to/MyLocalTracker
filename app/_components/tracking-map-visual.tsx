"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
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

const courierIcon = divIcon({
  className: "tracking-map-marker",
  html: '<span class="tracking-map-marker__core tracking-map-marker__core--courier"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const destinationIcon = divIcon({
  className: "tracking-map-marker",
  html: '<span class="tracking-map-marker__core tracking-map-marker__core--destination"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
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
              <strong>Destino</strong>
              <br />
              {destinationLabel}
            </Popup>
          </Marker>
        ) : null}

        {courierPoint && destinationPoint ? (
          <Polyline positions={[courierPoint, destinationPoint]} pathOptions={{ color: "#eb6a42", weight: 4, opacity: 0.8 }} />
        ) : null}
      </MapContainer>

      <div className="tracking-map-overlay">
        <div className="tracking-map-legend">
          <span className="tracking-map-legend__item">
            <span className="tracking-map-legend__dot tracking-map-legend__dot--courier" />
            Repartidor
          </span>
          <span className="tracking-map-legend__item">
            <span className="tracking-map-legend__dot tracking-map-legend__dot--destination" />
            Destino
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
            Ya se ve el destino. Falta que el repartidor envie su primera
            ubicacion.
          </div>
        ) : (
          <div className="tracking-map-overlay__note">
            Ya llego la senal del repartidor. Falta capturar el destino para
            unir ambos puntos.
          </div>
        )}
      </div>
    </div>
  );
}
