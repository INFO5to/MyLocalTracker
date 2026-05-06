"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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

function ClipboardCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-16 w-16"
      fill="none"
    >
      <path
        d="M22 13h-3.5A6.5 6.5 0 0 0 12 19.5v31A6.5 6.5 0 0 0 18.5 57h27A6.5 6.5 0 0 0 52 50.5v-31A6.5 6.5 0 0 0 45.5 13H42"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 17h20v-2.5A7.5 7.5 0 0 0 34.5 7h-5A7.5 7.5 0 0 0 22 14.5V17Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m25 36 6 6 11-16"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 28h10M23 48h18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-16 w-16"
      fill="none"
    >
      <path
        d="M24 7h16M32 7v8M50 13l5 5M51 19l-4 4"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 57c12.7 0 23-10.3 23-23S44.7 11 32 11 9 21.3 9 34s10.3 23 23 23Z"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M13 34a19 19 0 0 1 19-19"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M32 24v10h12"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 34h-4M49 34h-4M32 17v4M32 47v4M44 22l-3 3M23 43l-3 3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
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
  const hasDestinationPoint = isValidDestinationPoint(destinationPoint);
  const toggleLabel = isOpen ? "Ocultar formulario" : "Nuevo pedido";

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
            <input
              className="field-input"
              type="text"
              name="delivery_address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Av. Reforma 214, Centro"
              required
            />
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
