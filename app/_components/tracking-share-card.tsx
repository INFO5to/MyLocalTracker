"use client";

import { useState } from "react";

type TrackingShareCardProps = {
  trackingCode: string;
  trackingUrl: string;
  trackingReady: boolean;
};

export function TrackingShareCard({
  trackingCode,
  trackingUrl,
  trackingReady,
}: TrackingShareCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <article className="panel">
      <span className="eyebrow">Link para cliente</span>
      <h2 className="section-title mt-4">Tracking publico listo para compartir</h2>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        {trackingReady
          ? `El pedido ${trackingCode} ya esta listo para mandar al cliente. Copia este link y pegalo manualmente en WhatsApp.`
          : `El link ya existe, pero conviene compartirlo cuando el pedido pase a En camino para que el cliente vea movimiento real en el mapa.`}
      </p>

      <div className="mt-6 rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          URL publica
        </p>
        <input
          className="field-input mt-3"
          type="text"
          readOnly
          value={trackingUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
        >
          Copiar link
        </button>
        <a
          href={trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[rgba(23,32,51,0.08)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:-translate-y-0.5"
        >
          Abrir tracking publico
        </a>
      </div>

      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
        {copyState === "copied"
          ? "Link copiado. Ya puedes pegarlo en WhatsApp."
          : copyState === "failed"
            ? "No pude copiarlo automaticamente. Seleccionalo y copialo manualmente."
            : "Este mismo link es el que debe abrir el cliente en su celular."}
      </p>
    </article>
  );
}
