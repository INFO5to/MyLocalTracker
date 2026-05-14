"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  createOrderAction,
  type CreateOrderActionState,
} from "@/app/dashboard/actions";
import {
  DestinationMapPicker,
  type DestinationPoint,
} from "@/app/dashboard/_components/destination-map-picker";
import { formatMexicanWhatsappFieldValue } from "@/lib/phone";
import type { CourierOption } from "@/lib/tracking";

type CreateOrderFormProps = {
  couriers: CourierOption[];
  historyHref: string;
  historyCount: number;
};

const initialState: CreateOrderActionState = {
  status: "idle",
  message: "",
};

const MIN_ADDRESS_SEARCH_LENGTH = 8;

type AddressSearchStatus = {
  tone: "idle" | "loading" | "success" | "error";
  message: string;
};

type GeocodingResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

function isValidDestinationPoint(point: DestinationPoint) {
  const latitude = point.latitude.trim();
  const longitude = point.longitude.trim();

  if (!latitude || !longitude) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  return Math.abs(lat) >= 0.01 || Math.abs(lng) >= 0.01;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m20 20-4.2-4.2M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-20 w-20"
      fill="none"
    >
      <path
        d="M32 4.5c15.2 0 27.5 12.3 27.5 27.5S47.2 59.5 32 59.5 4.5 47.2 4.5 32 16.8 4.5 32 4.5Z"
        fill="#df554c"
      />
      <path
        d="M19.5 16.5h25A4.5 4.5 0 0 1 49 21v27a4.5 4.5 0 0 1-4.5 4.5h-25A4.5 4.5 0 0 1 15 48V21a4.5 4.5 0 0 1 4.5-4.5Z"
        fill="#f7fafc"
      />
      <path
        d="M23 13h18a4 4 0 0 1 4 4v2.5H19V17a4 4 0 0 1 4-4Z"
        fill="#254455"
      />
      <path
        d="M23 30h14M23 39h10"
        stroke="#254455"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="m31 47 5 5 10-14"
        stroke="#43aa96"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M44 27h9v20h-9z" fill="#e0bd4f" />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-20 w-20"
      fill="none"
    >
      <path
        d="M32 4.5c15.2 0 27.5 12.3 27.5 27.5S47.2 59.5 32 59.5 4.5 47.2 4.5 32 16.8 4.5 32 4.5Z"
        fill="#df554c"
      />
      <path
        d="M21 12h22v6c0 5.4-3.6 9.2-7.6 12 4 2.8 7.6 6.6 7.6 12v10H21V42c0-5.4 3.6-9.2 7.6-12-4-2.8-7.6-6.6-7.6-12v-6Z"
        fill="#f7fafc"
      />
      <path
        d="M18 12h28M18 52h28"
        stroke="#254455"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M25 20h14l-7 8-7-8ZM25 47c2.8-5 11.2-5 14 0H25Z"
        fill="#d9bd55"
      />
      <path
        d="M42 30a11 11 0 1 1-5 15.2"
        stroke="#254455"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M47 34v8h7"
        stroke="#43aa96"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CreateOrderForm({
  couriers,
  historyHref,
  historyCount,
}: CreateOrderFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const [customerPhone, setCustomerPhone] = useState("+521 ");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [destinationPoint, setDestinationPoint] = useState<DestinationPoint>({
    latitude: "",
    longitude: "",
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [addressSearchStatus, setAddressSearchStatus] =
    useState<AddressSearchStatus>({
      tone: "idle",
      message: "Escribe el domicilio y la lupa intentara ubicarlo en el mapa.",
    });
  const searchAbortRef = useRef<AbortController | null>(null);
  const hasDestinationPoint = isValidDestinationPoint(destinationPoint);
  const toggleLabel = isOpen ? "Ocultar formulario" : "Nuevo pedido";

  const searchDestinationAddress = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < MIN_ADDRESS_SEARCH_LENGTH) {
      setAddressSearchStatus({
        tone: "idle",
        message: "Escribe una direccion mas completa para buscarla en el mapa.",
      });
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setAddressSearchStatus({
      tone: "loading",
      message: "Buscando destino en el mapa...",
    });

    try {
      const searchParams = new URLSearchParams({
        addressdetails: "1",
        countrycodes: "mx",
        format: "jsonv2",
        limit: "1",
        q: normalizedQuery,
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo consultar el mapa.");
      }

      const [firstResult] = (await response.json()) as GeocodingResult[];
      const latitude = Number(firstResult?.lat);
      const longitude = Number(firstResult?.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setAddressSearchStatus({
          tone: "error",
          message:
            "No encontre ese domicilio. Puedes afinarlo o marcar el punto manualmente.",
        });
        return;
      }

      setDestinationPoint({
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      });
      setShowMapPicker(true);
      setAddressSearchStatus({
        tone: "success",
        message: firstResult.display_name
          ? `Destino ubicado: ${firstResult.display_name}`
          : "Destino ubicado en el mapa.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setAddressSearchStatus({
        tone: "error",
        message:
          "No pude buscar el domicilio ahora. El mapa manual sigue disponible.",
      });
    }
  }, []);

  useEffect(() => {
    const normalizedAddress = deliveryAddress.trim();

    if (normalizedAddress.length < MIN_ADDRESS_SEARCH_LENGTH) {
      searchAbortRef.current?.abort();
      setAddressSearchStatus({
        tone: "idle",
        message: "Escribe el domicilio y la lupa intentara ubicarlo en el mapa.",
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchDestinationAddress(normalizedAddress);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [deliveryAddress, searchDestinationAddress]);

  return (
    <section className="panel panel-strong new-order-shell">
      <div className="new-order-launcher">
        <div className="new-order-actions">
          <button
            type="button"
            className="order-launch-button"
            aria-expanded={isOpen}
            aria-controls="new-order-form-panel"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="order-launch-button__icon">
              <ClipboardCheckIcon />
            </span>
            <span className="order-launch-button__title">Pedidos</span>
          </button>

          <Link href={historyHref} className="history-launch-button">
            <span className="history-launch-button__icon">
              <StopwatchIcon />
            </span>
            <span className="history-launch-button__title">Historial</span>
            <span className="launch-count-pill">{historyCount} entregados</span>
          </Link>
        </div>

        <div className="min-w-0">
          <span className="eyebrow">Nuevo pedido</span>
          <h2 className="section-title mt-4">Acciones rapidas del turno</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            Crea una orden desde Pedidos o revisa el Historial en una pantalla
            separada. Asi el tablero principal se queda libre para lo que sigue vivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <span className="link-chip">Evento inicial automatico</span>
          <button
            type="button"
            className={isOpen ? "ios-button-secondary" : "ios-button"}
            aria-expanded={isOpen}
            aria-controls="new-order-form-panel"
            onClick={() => setIsOpen((current) => !current)}
          >
            {toggleLabel}
          </button>
        </div>
      </div>

      <form
        id="new-order-form-panel"
        action={formAction}
        className="new-order-form-panel"
        hidden={!isOpen}
      >
        <input type="hidden" name="business_name" value="LocalTracker" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">Cliente</span>
            <input
              className="field-input"
              type="text"
              name="customer_name"
              placeholder="Mariana Torres"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Telefono cliente (WhatsApp)</span>
            <input
              className="field-input"
              type="tel"
              name="customer_phone"
              inputMode="numeric"
              autoComplete="tel"
              value={customerPhone}
              onChange={(event) => {
                setCustomerPhone(formatMexicanWhatsappFieldValue(event.target.value));
              }}
              placeholder="+521 392 158 8994"
            />
          </label>

          <label className="field sm:col-span-2">
            <span className="field-label">Direccion de entrega</span>
            <div className="address-search-field">
              <input
                className="field-input field-input--with-action"
                type="text"
                name="delivery_address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchDestinationAddress(deliveryAddress);
                  }
                }}
                placeholder="Av. Reforma 214, Centro"
                required
              />
              <button
                type="button"
                className="address-search-button"
                aria-label="Buscar direccion en el mapa"
                onClick={() => searchDestinationAddress(deliveryAddress)}
              >
                <SearchIcon />
              </button>
            </div>
            <p
              className={`address-search-status address-search-status--${addressSearchStatus.tone}`}
              aria-live="polite"
            >
              {addressSearchStatus.message}
            </p>
          </label>

          <div className="destination-field-card sm:col-span-2">
            <input
              type="hidden"
              name="delivery_lat"
              value={hasDestinationPoint ? destinationPoint.latitude : ""}
            />
            <input
              type="hidden"
              name="delivery_lng"
              value={hasDestinationPoint ? destinationPoint.longitude : ""}
            />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="field-label">Destino en mapa</span>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Captura la direccion como siempre. Si quieres que el cliente
                  vea el punto exacto, marcalo directamente en el mapa.
                </p>
                {hasDestinationPoint ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--brand-deep)]">
                    Punto guardado: {destinationPoint.latitude},{" "}
                    {destinationPoint.longitude}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="ios-button-secondary"
                  onClick={() => setShowMapPicker((current) => !current)}
                >
                  {showMapPicker ? "Ocultar mapa" : "Marcar en mapa"}
                </button>
                {hasDestinationPoint ? (
                  <button
                    type="button"
                    className="ios-button-quiet"
                    onClick={() =>
                      setDestinationPoint({ latitude: "", longitude: "" })
                    }
                  >
                    Quitar punto
                  </button>
                ) : null}
              </div>
            </div>

            {showMapPicker ? (
              <div className="mt-4">
                <DestinationMapPicker
                  addressLabel={deliveryAddress}
                  latitude={hasDestinationPoint ? destinationPoint.latitude : ""}
                  longitude={hasDestinationPoint ? destinationPoint.longitude : ""}
                  onChange={setDestinationPoint}
                />
              </div>
            ) : null}
          </div>

          <label className="field sm:col-span-2">
            <span className="field-label">Items</span>
            <input
              className="field-input"
              type="text"
              name="items"
              placeholder="2 baguettes, 1 cold brew, 1 ensalada"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Total</span>
            <input
              className="field-input"
              type="number"
              step="0.01"
              min="0"
              name="total_amount"
              placeholder="268"
            />
          </label>

          <label className="field">
            <span className="field-label">ETA estimada</span>
            <input
              className="field-input"
              type="number"
              min="0"
              name="eta_minutes"
              placeholder="18"
            />
          </label>

          <label className="field">
            <span className="field-label">Repartidor</span>
            <select className="field-input" name="courier_id" defaultValue="">
              <option value="">Sin asignar</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.fullName} - {courier.vehicleLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Notas</span>
            <textarea
              className="field-input min-h-24 resize-y"
              name="notes"
              placeholder="Entregar en recepcion, tocar timbre, etc."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="ios-button"
          >
            {pending ? "Creando pedido..." : "Crear pedido"}
          </button>

          {state.message ? (
            <p
              aria-live="polite"
              className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}
            >
              {state.message}
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          Las coordenadas son opcionales, pero si las capturas el cliente podra ver
          tambien el destino en el mapa durante el tracking en vivo.
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
          El telefono de WhatsApp se captura con prefijo fijo <strong>+521</strong>{" "}
          para Mexico y se guarda ya normalizado para Twilio.
        </p>
      </form>
    </section>
  );
}
