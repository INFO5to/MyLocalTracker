"use client";

import { useActionState, useState } from "react";
import {
  createOrderAction,
  type CreateOrderActionState,
} from "@/app/dashboard/actions";
import { formatMexicanWhatsappFieldValue } from "@/lib/phone";
import type { CourierOption } from "@/lib/tracking";

type CreateOrderFormProps = {
  couriers: CourierOption[];
};

const initialState: CreateOrderActionState = {
  status: "idle",
  message: "",
};

export function CreateOrderForm({ couriers }: CreateOrderFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const [customerPhone, setCustomerPhone] = useState("+521 ");

  return (
    <form action={formAction} className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Nuevo pedido</span>
          <h2 className="section-title mt-4">Crear pedido desde el panel</h2>
        </div>
        <span className="link-chip">Evento inicial automatico</span>
      </div>

      <input type="hidden" name="business_name" value="LocalTracker" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
            placeholder="Av. Reforma 214, Centro"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Latitud destino</span>
          <input
            className="field-input"
            type="number"
            step="0.000001"
            name="delivery_lat"
            placeholder="19.432608"
          />
        </label>

        <label className="field">
          <span className="field-label">Longitud destino</span>
          <input
            className="field-input"
            type="number"
            step="0.000001"
            name="delivery_lng"
            placeholder="-99.133209"
          />
        </label>

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
                {courier.fullName} · {courier.vehicleLabel}
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
          className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-70"
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
  );
}
