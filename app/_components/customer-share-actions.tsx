"use client";

import { useState } from "react";

type CustomerShareActionsProps = {
  whatsappUrl: string | null;
  message: string;
  trackingUrl: string;
  compact?: boolean;
};

export function CustomerShareActions({
  whatsappUrl,
  message,
  trackingUrl,
  compact = false,
}: CustomerShareActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "message" | "link" | "failed">(
    "idle",
  );

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("message");
    } catch {
      setCopyState("failed");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopyState("link");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className={compact ? "space-y-3" : "mt-4 space-y-3"}>
      <div className="flex flex-wrap gap-3">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="ios-button"
          >
            Enviar por WhatsApp
          </a>
        ) : (
          <button type="button" className="ios-button" disabled>
            WhatsApp sin numero
          </button>
        )}

        <button
          type="button"
          onClick={copyMessage}
          className="ios-button-secondary"
        >
          Copiar mensaje
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="ios-button-ghost"
        >
          Copiar link
        </button>
      </div>

      <p className="text-sm leading-7 text-[color:var(--muted)]">
        {copyState === "message"
          ? "Mensaje copiado. Ya puedes pegarlo manualmente en WhatsApp."
          : copyState === "link"
            ? "Link copiado. Puedes compartirlo donde quieras."
            : copyState === "failed"
              ? "No pude copiarlo automaticamente. Usa el boton de WhatsApp o copialo manualmente."
              : whatsappUrl
                ? "Este flujo evita depender de Twilio Trial: abre WhatsApp con el texto y el link listos."
                : "Agrega un telefono valido al pedido para habilitar el envio manual por WhatsApp."}
      </p>
    </div>
  );
}
