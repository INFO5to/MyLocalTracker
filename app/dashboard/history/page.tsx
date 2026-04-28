import Link from "next/link";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { OrderSummaryCard } from "@/app/dashboard/_components/order-summary-card";
import { requireInternalSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/tracking";

export default async function DashboardHistoryPage() {
  await requireInternalSession(["owner", "staff"], "/dashboard/history");
  const dashboard = await getDashboardSnapshot();
  const deliveredOrders = dashboard.orders.filter((order) => order.status === "delivered");
  const latestDelivered = deliveredOrders[0] ?? null;
  const courierCount = new Set(
    deliveredOrders
      .map((order) => order.courierName)
      .filter((courierName) => courierName !== "Por asignar"),
  ).size;

  return (
    <main className="page-shell dashboard-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName="dashboard-history-orders"
        targets={[{ table: "orders" }, { table: "order_events" }]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Historial del turno</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Pedidos entregados, fuera del tablero operativo.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Esta vista queda reservada para pedidos cerrados. El dashboard
                principal se mantiene enfocado en ordenes activas y aqui revisas
                el cierre del turno sin contaminar la operacion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="link-chip">
              Volver a pedidos
            </Link>
            <Link href="/couriers" className="link-chip">
              Repartidores
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Entregados</p>
          <p className="metric-value mt-3">{deliveredOrders.length}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            Pedidos cerrados
          </p>
        </article>

        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Ultimo cierre</p>
          <p className="mt-3 text-2xl font-semibold">
            {latestDelivered?.lastUpdateLabel ?? "Sin registros"}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            Segun eventos
          </p>
        </article>

        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Repartidores</p>
          <p className="metric-value mt-3">{courierCount}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            Con entregas
          </p>
        </article>
      </section>

      <section className="panel mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="eyebrow">Pedidos entregados</span>
            <h2 className="section-title mt-4">Registro limpio del historial</h2>
          </div>
          <span className="link-chip">{deliveredOrders.length} registros</span>
        </div>

        <div className="history-page-list">
          {deliveredOrders.length === 0 ? (
            <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
              Todavia no hay pedidos entregados para mostrar en el historial.
            </div>
          ) : (
            deliveredOrders.map((order) => (
              <OrderSummaryCard key={order.code} order={order} compact />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
