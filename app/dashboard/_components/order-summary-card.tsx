import Link from "next/link";
import { StatusPill } from "@/app/_components/status-pill";
import { OrderActionsDrawer } from "@/app/dashboard/_components/order-actions-drawer";
import { buildCustomerTrackingMessage, buildWhatsappDeepLink } from "@/lib/manual-share";
import { buildTrackingUrl } from "@/lib/public-url";
import type { DashboardOrder } from "@/lib/tracking";

type OrderSummaryCardProps = {
  order: DashboardOrder;
  compact?: boolean;
};

export function OrderSummaryCard({ order, compact = false }: OrderSummaryCardProps) {
  const trackingUrl = buildTrackingUrl(order.publicToken);
  const shareMessage = buildCustomerTrackingMessage({
    customerName: order.customerName,
    businessName: order.businessName,
    trackingCode: order.code,
    trackingUrl,
  });
  const whatsappUrl = buildWhatsappDeepLink({
    customerPhone: order.customerPhone,
    message: shareMessage,
  });

  if (compact) {
    return (
      <article className="history-order-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {order.code}
            </p>
            <StatusPill status={order.status} />
          </div>
          <h3 className="mt-2 text-lg font-semibold">{order.customerName}</h3>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{order.address}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
            <span>{order.courierName}</span>
            <span>{order.totalLabel}</span>
            <span>{order.lastUpdateLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link href={`/track/${order.publicToken}`} className="link-chip">
            Tracking
          </Link>
          <Link href={`/driver/${order.code}`} className="link-chip">
            Repartidor
          </Link>
          <OrderActionsDrawer
            orderId={order.id}
            trackingCode={order.code}
            currentStatus={order.status}
            nextStatusLabel={order.nextStatusLabel}
            lastUpdateLabel={order.lastUpdateLabel}
            whatsappUrl={whatsappUrl}
            shareMessage={shareMessage}
            trackingUrl={trackingUrl}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="soft-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {order.code}
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            {order.customerName}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {order.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={order.status} />
          <OrderActionsDrawer
            orderId={order.id}
            trackingCode={order.code}
            currentStatus={order.status}
            nextStatusLabel={order.nextStatusLabel}
            lastUpdateLabel={order.lastUpdateLabel}
            whatsappUrl={whatsappUrl}
            shareMessage={shareMessage}
            trackingUrl={trackingUrl}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
        <span>Repartidor: {order.courierName}</span>
        <span>{order.etaLabel}</span>
        <span>{order.totalLabel}</span>
      </div>

      <div className="mt-5 flex w-full max-w-xs flex-col gap-3">
        <Link href={`/track/${order.publicToken}`} className="ios-button">
          Abrir tracking
        </Link>
        <Link
          href={`/driver/${order.code}`}
          className="ios-button-secondary"
        >
          Vista repartidor
        </Link>
      </div>
    </article>
  );
}
