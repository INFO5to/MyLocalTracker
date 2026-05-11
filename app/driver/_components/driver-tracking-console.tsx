"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderStatus, TrackingLocation } from "@/lib/tracking";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type DriverTrackingConsoleProps = {
  orderId: string;
  trackingCode: string;
  courierId: string | null;
  currentStatus: OrderStatus;
  trackingEnabled: boolean;
  destinationLocation: {
    latitude: number;
    longitude: number;
  } | null;
  initialLiveLocation: TrackingLocation | null;
};

type UploadLocationInput = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  speedMps: number | null;
  source: string;
};

const LOCATION_INTERVAL_MS = 5000;
const inTransitStatus: OrderStatus = "on_the_way";

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function getStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    preparing: "Preparando",
    ready: "Listo para salir",
    on_the_way: "En camino",
    delivered: "Entregado",
  };

  return labels[status];
}

function getBrowserPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export function DriverTrackingConsole({
  orderId,
  trackingCode,
  courierId,
  currentStatus,
  trackingEnabled,
  destinationLocation,
  initialLiveLocation,
}: DriverTrackingConsoleProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(
    currentStatus === inTransitStatus
      ? "Tracking automatico listo: deja esta pantalla abierta para enviar ubicacion cada 5 segundos."
      : "El tracking automatico se activara cuando el pedido pase a En camino.",
  );
  const [lastLocation, setLastLocation] = useState<TrackingLocation | null>(
    initialLiveLocation,
  );
  const intervalRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);

  const uploadLocation = useCallback(async (payload: UploadLocationInput) => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("No se pudo abrir el cliente de Supabase en el navegador.");
      return false;
    }

    const { error } = await supabase.from("courier_locations").insert({
      order_id: orderId,
      courier_id: courierId,
      tracking_code: trackingCode,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_meters: payload.accuracyMeters,
      speed_mps: payload.speedMps,
      heading_degrees: payload.headingDegrees,
      source: payload.source,
    });

    if (error) {
      setMessage(
        error.message ??
          "No se pudo registrar la ubicacion. Revisa la migracion de la Fase 2.",
      );
      return false;
    }

    const nextLocation: TrackingLocation = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracyMeters: payload.accuracyMeters,
      headingDegrees: payload.headingDegrees,
      speedMps: payload.speedMps,
      source: payload.source,
      recordedAtLabel: new Date().toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setLastLocation(nextLocation);
    setMessage(
      `Ubicacion enviada: ${formatCoordinate(payload.latitude)}, ${formatCoordinate(payload.longitude)}.`,
    );
    return true;
  }, [courierId, orderId, trackingCode]);

  const captureCurrentLocation = useCallback(async () => {
    if (!courierId) {
      setMessage("Asigna un repartidor al pedido antes de iniciar tracking.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setMessage(
        "Este dispositivo no expone geolocalizacion. Revisa permisos o prueba desde el celular del repartidor.",
      );
      return;
    }

    if (isCapturingRef.current) {
      return;
    }

    isCapturingRef.current = true;
    setIsSending(true);

    try {
      const position = await getBrowserPosition();

      await uploadLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters:
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy
            : null,
        speedMps:
          typeof position.coords.speed === "number" ? position.coords.speed : null,
        headingDegrees:
          typeof position.coords.heading === "number"
            ? position.coords.heading
            : null,
        source: "browser_geolocation",
      });
    } catch {
      setMessage(
        "No pude leer la ubicacion del navegador. Verifica permisos de ubicacion en el dispositivo.",
      );
    } finally {
      isCapturingRef.current = false;
      setIsSending(false);
    }
  }, [courierId, uploadLocation]);

  useEffect(() => {
    if (currentStatus !== inTransitStatus || !courierId) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsTracking(false);
      if (currentStatus === "delivered") {
        setMessage(
          "El pedido ya fue entregado. El tracking continuo se cerro automaticamente.",
        );
      }
      return;
    }

    if (intervalRef.current !== null) {
      return;
    }

    setIsTracking(true);
    setMessage("Tracking automatico activo: enviando ubicacion cada 5 segundos.");
    void captureCurrentLocation();

    intervalRef.current = window.setInterval(() => {
      void captureCurrentLocation();
    }, LOCATION_INTERVAL_MS);
  }, [captureCurrentLocation, courierId, currentStatus]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <article className="panel">
      <span className="eyebrow">Modo repartidor</span>
      <h2 className="section-title mt-4">Tracking del dispositivo</h2>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        Cuando el pedido esta En camino, esta vista envia coordenadas a Supabase
        cada 5 segundos automaticamente. Deja la pantalla abierta en el celular
        para reflejar el movimiento en el tracking publico.
      </p>

      <div className="soft-card-strong mt-6 text-sm leading-7 text-[color:var(--muted)]">
        <p>Pedido: {trackingCode}</p>
        <p>Estado actual: {getStatusLabel(currentStatus)}</p>
        <p>
          Tracking automatico:{" "}
          {isTracking
            ? "activo cada 5 segundos"
            : currentStatus === inTransitStatus
              ? "esperando permisos del navegador"
              : "en espera de En camino"}
        </p>
        <p>Tracking publico: {trackingEnabled ? "habilitado" : "pendiente"}</p>
        <p>Repartidor vinculado: {courierId ? "si" : "no"}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void captureCurrentLocation();
          }}
          disabled={isSending || !courierId}
          className="ios-button"
        >
          {isSending ? "Enviando..." : "Enviar ubicacion una vez"}
        </button>
      </div>

      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{message}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="soft-card-strong">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Ultima coordenada enviada
          </p>
          <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
            {lastLocation
              ? `${formatCoordinate(lastLocation.latitude)}, ${formatCoordinate(lastLocation.longitude)}`
              : "Sin puntos todavia"}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {lastLocation
              ? `Hora ${lastLocation.recordedAtLabel} por ${lastLocation.source}.`
              : "Pasa el pedido a En camino o envia una ubicacion manual para empezar."}
          </p>
        </div>

        <div className="soft-card-strong">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Destino del cliente
          </p>
          <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
            {destinationLocation
              ? `${formatCoordinate(destinationLocation.latitude)}, ${formatCoordinate(destinationLocation.longitude)}`
              : "Todavia sin coordenadas de entrega"}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Si capturaste latitud y longitud al crear el pedido, aqui se usa ese
            punto como destino del mapa.
          </p>
        </div>
      </div>
    </article>
  );
}
