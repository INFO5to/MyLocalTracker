"use client";

import { useEffect, useRef, useState } from "react";
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

function formatCoordinate(value: number) {
  return value.toFixed(5);
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
    trackingEnabled
      ? "El pedido ya esta marcado en ruta. Puedes empezar a emitir ubicaciones cada 5 segundos."
      : "Marca el pedido como En camino y luego inicia el tracking continuo.",
  );
  const [lastLocation, setLastLocation] = useState<TrackingLocation | null>(
    initialLiveLocation,
  );
  const intervalRef = useRef<number | null>(null);

  function stopTracking() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
  }

  async function uploadLocation(payload: UploadLocationInput) {
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
  }

  async function captureCurrentLocation() {
    if (!courierId) {
      setMessage("Asigna un repartidor al pedido antes de iniciar tracking.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setMessage(
        "Este dispositivo no expone geolocalizacion. Usa la simulacion para probar el mapa.",
      );
      return;
    }

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
        "No pude leer la ubicacion del navegador. Verifica permisos o usa la simulacion.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function simulateMovement() {
    if (!courierId) {
      setMessage("Asigna un repartidor antes de simular la ruta.");
      return;
    }

    setIsSending(true);

    try {
      const baseLatitude =
        lastLocation?.latitude ?? destinationLocation?.latitude ?? 19.432608;
      const baseLongitude =
        lastLocation?.longitude ?? destinationLocation?.longitude ?? -99.133209;
      const latitudeOffset = (Math.random() - 0.5) * 0.0022;
      const longitudeOffset = (Math.random() - 0.5) * 0.0022;

      await uploadLocation({
        latitude: baseLatitude + latitudeOffset,
        longitude: baseLongitude + longitudeOffset,
        accuracyMeters: 8,
        speedMps: 4.5,
        headingDegrees: Math.floor(Math.random() * 360),
        source: "simulated_test",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function startTracking() {
    if (isTracking) {
      return;
    }

    setIsTracking(true);
    setMessage("Tracking continuo activo. La app enviara una ubicacion cada 5 segundos.");
    await captureCurrentLocation();

    intervalRef.current = window.setInterval(() => {
      void captureCurrentLocation();
    }, LOCATION_INTERVAL_MS);
  }

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
        Esta vista envia coordenadas a Supabase cada 5 segundos mientras el pedido
        va en ruta. Deja la pantalla abierta en el celular para ver el movimiento
        reflejado en el tracking publico.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4 text-sm leading-7 text-[color:var(--muted)]">
        <p>Pedido: {trackingCode}</p>
        <p>Estado actual: {currentStatus}</p>
        <p>
          Tracking continuo: {trackingEnabled ? "listo para activarse" : "aun no iniciado"}
        </p>
        <p>Repartidor vinculado: {courierId ? "si" : "no"}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void captureCurrentLocation();
          }}
          disabled={isSending || !courierId}
          className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Enviando..." : "Enviar ubicacion una vez"}
        </button>

        {isTracking ? (
          <button
            type="button"
            onClick={() => {
              stopTracking();
              setMessage("Tracking continuo detenido.");
            }}
            className="rounded-full border border-[rgba(23,32,51,0.08)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:-translate-y-0.5"
          >
            Detener tracking continuo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void startTracking();
            }}
            disabled={!courierId}
            className="rounded-full border border-[rgba(23,32,51,0.08)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Iniciar tracking cada 5s
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            void simulateMovement();
          }}
          disabled={isSending || !courierId}
          className="rounded-full border border-[rgba(23,32,51,0.08)] bg-[rgba(15,118,110,0.08)] px-5 py-3 text-sm font-semibold text-[color:var(--accent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Simular avance de prueba
        </button>
      </div>

      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{message}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4">
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
              : "Usa ubicacion actual o simulacion para empezar."}
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4">
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
