"use client";

import { divIcon, type Marker as LeafletMarker } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import type { DestinationPoint } from "@/app/dashboard/_components/destination-map-picker";

type MapPoint = [number, number];

type DestinationMapPickerVisualProps = {
  addressLabel: string;
  latitude: string;
  longitude: string;
  onChange: (point: DestinationPoint) => void;
};

const defaultCenter: MapPoint = [19.432608, -99.133209];

const destinationPickerIcon = divIcon({
  className: "tracking-map-marker",
  html: '<span class="tracking-map-marker__core tracking-map-marker__core--destination"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function parsePoint(latitude: string, longitude: string): MapPoint | null {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}

function toDestinationPoint([latitude, longitude]: MapPoint): DestinationPoint {
  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
  };
}

function ClickHandler({
  onChange,
}: {
  onChange: (point: DestinationPoint) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(toDestinationPoint([event.latlng.lat, event.latlng.lng]));
    },
  });

  return null;
}

export function DestinationMapPickerVisual({
  addressLabel,
  latitude,
  longitude,
  onChange,
}: DestinationMapPickerVisualProps) {
  const selectedPoint = parsePoint(latitude, longitude);
  const center = selectedPoint ?? defaultCenter;

  return (
    <div className="destination-map-picker">
      <MapContainer
        center={center}
        zoom={selectedPoint ? 16 : 13}
        scrollWheelZoom={false}
        className="destination-map-picker__canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />

        {selectedPoint ? (
          <Marker
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target as LeafletMarker;
                const point = marker.getLatLng();
                onChange(toDestinationPoint([point.lat, point.lng]));
              },
            }}
            icon={destinationPickerIcon}
            position={selectedPoint}
          >
            <Popup>
              <strong>Destino del pedido</strong>
              <br />
              {addressLabel || "Direccion capturada"}
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="destination-map-picker__hint">
        {selectedPoint ? (
          <>
            Destino marcado. Puedes arrastrar el punto si quieres afinarlo.
          </>
        ) : (
          <>
            Toca el mapa para marcar el destino. Si no lo marcas, el pedido se
            crea solo con direccion.
          </>
        )}
      </div>
    </div>
  );
}
