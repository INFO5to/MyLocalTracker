"use client";

import { useState } from "react";
import { advanceOrderStatus } from "@/app/dashboard/actions";
import { CustomerShareActions } from "@/app/_components/customer-share-actions";

type OrderActionsDrawerProps = {
  orderId: string;
  trackingCode: string;
  currentStatus: string;
  nextStatusLabel: string | null;
  lastUpdateLabel: string;
  whatsappUrl: string | null;
  shareMessage: string;
  trackingUrl: string;
};

export function OrderActionsDrawer({
  orderId,
  trackingCode,
  currentStatus,
  nextStatusLabel,
  lastUpdateLabel,
  whatsappUrl,
  shareMessage,
  trackingUrl,
}: OrderActionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ios-icon-button"
        aria-label={isOpen ? "Ocultar gestion del pedido" : "Abrir gestion del pedido"}
        aria-expanded={isOpen}
        title={isOpen ? "Ocultar gestion del pedido" : "Abrir gestion del pedido"}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M5 12h14" />
          <path d="M5 7h14" />
          <path d="M5 17h14" />
        </svg>
      </button>

      {isOpen ? (
        <div className="soft-card-strong mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            {nextStatusLabel ? (
              <form action={advanceOrderStatus}>
                <input type="hidden" name="order_id" value={orderId} />
                <input type="hidden" name="tracking_code" value={trackingCode} />
                <input type="hidden" name="current_status" value={currentStatus} />
                <button type="submit" className="ios-button-ghost">
                  {nextStatusLabel}
                </button>
              </form>
            ) : (
              <span className="link-chip">Flujo completado</span>
            )}

            <span className="link-chip">{lastUpdateLabel}</span>
          </div>

          <CustomerShareActions
            whatsappUrl={whatsappUrl}
            message={shareMessage}
            trackingUrl={trackingUrl}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
