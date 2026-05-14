import Link from "next/link";
import type { CSSProperties } from "react";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { requireInternalSession } from "@/lib/auth";
import {
  getDashboardSnapshot,
  getExecutiveMovementSnapshot,
  getStatusMeta,
} from "@/lib/tracking";

type ExecutivePageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function ExecutivePage({ searchParams }: ExecutivePageProps) {
  await requireInternalSession(["owner"], "/executive");

  const params = await searchParams;
  const dashboard = await getDashboardSnapshot();
  const movement = await getExecutiveMovementSnapshot(params.date);
  const orders = dashboard.orders;
  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const inRouteOrders = activeOrders.filter((order) => order.status === "on_the_way");
  const previewOrders = activeOrders.slice(0, 4);
  const activeStatusBuckets = ([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "on_the_way",
  ] as const).map((status) => ({
    status,
    label: getStatusMeta(status).label,
    count: activeOrders.filter((order) => order.status === status).length,
  }));
  const maxActiveStatusCount = Math.max(
    1,
    ...activeStatusBuckets.map((bucket) => bucket.count),
  );
  const routePercent =
    activeOrders.length > 0
      ? Math.round((inRouteOrders.length / activeOrders.length) * 100)
      : 0;
  const maxWeeklyMovements = Math.max(
    1,
    ...movement.weeklyBuckets.map((bucket) => bucket.total),
  );
  const maxDailySummaryCount = Math.max(
    1,
    ...movement.eventTypeBuckets.map((bucket) => bucket.total),
  );

  return (
    <main className="page-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName="executive-dashboard"
        targets={[
          { table: "orders" },
          { table: "couriers" },
          { table: "courier_locations" },
        ]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Vista ejecutiva</span>
            <h1 className="display-title text-4xl sm:text-5xl">
              Pulso real del turno.
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/dashboard" className="link-chip">
              Ir a pedidos
            </Link>
            <Link href="/couriers" className="link-chip">
              Repartidores
            </Link>
            <Link href="/dashboard/history" className="link-chip">
              Historial
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Pedidos activos</p>
          <p className="metric-value mt-3">{activeOrders.length}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            {inRouteOrders.length} en camino
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Entregados</p>
          <p className="metric-value mt-3">{deliveredOrders.length}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            historial del turno
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Sin asignar</p>
          <p className="metric-value mt-3">
            {activeOrders.filter((order) => order.courierName === "Por asignar").length}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            requieren atencion
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm text-[color:var(--muted)]">Repartidores</p>
          <p className="metric-value mt-3">{dashboard.couriers.length}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
            {dashboard.couriers.filter((courier) => courier.isActive).length} disponibles
          </p>
        </article>
      </section>

      <section className="executive-command-grid mt-6 pb-8">
        <div className="home-dashboard-preview executive-operations-card">
          <div className="home-preview-topbar">
            <div>
              <span className="home-preview-dot" />
              <span className="home-preview-dot home-preview-dot--violet" />
              <span className="home-preview-dot home-preview-dot--mint" />
            </div>
            <span className="home-preview-search">Operacion en tiempo real</span>
          </div>

          <div className="home-preview-layout">
            <aside className="home-preview-sidebar">
              <span className="home-preview-sidebar__logo">LT</span>
              {["Pedidos", "Rutas", "Staff", "Ajustes"].map((item) => (
                <span key={item} className="home-preview-menu-pill">
                  {item}
                </span>
              ))}
            </aside>

            <div className="home-preview-content">
              <div className="home-preview-metrics">
                <div className="home-preview-metric home-preview-metric--brand">
                  <span>Pedidos activos</span>
                  <strong>{activeOrders.length}</strong>
                </div>
                <div className="home-preview-metric home-preview-metric--accent">
                  <span>En ruta</span>
                  <strong>{inRouteOrders.length}</strong>
                </div>
              </div>

              <div className="home-preview-analytics">
                <div className="home-status-chart" aria-label="Estados activos del turno">
                  {activeStatusBuckets.map((bucket) => (
                    <div key={bucket.status} className="home-status-row">
                      <span>{bucket.label}</span>
                      <div className="home-status-track">
                        <span
                          className="home-status-bar"
                          style={
                            {
                              "--status-width":
                                bucket.count > 0
                                  ? `${Math.max(
                                      10,
                                      Math.round(
                                        (bucket.count / maxActiveStatusCount) * 100,
                                      ),
                                    )}%`
                                  : "0%",
                            } as CSSProperties
                          }
                        />
                      </div>
                      <strong>{bucket.count}</strong>
                    </div>
                  ))}
                </div>
                <div className="home-donut-card">
                  <span
                    className="home-donut"
                    style={{ "--home-donut-value": `${routePercent}%` } as CSSProperties}
                  />
                  <strong>{routePercent}%</strong>
                  <small>activos en ruta</small>
                </div>
              </div>

              <div className="home-preview-table">
                {previewOrders.length === 0 ? (
                  <div className="home-preview-row">
                    <span>LT-0000</span>
                    <strong>Sin pedidos activos</strong>
                    <em>Turno limpio</em>
                  </div>
                ) : (
                  previewOrders.map((order) => (
                    <div key={order.code} className="home-preview-row">
                      <span>{order.code}</span>
                      <strong>{order.customerName}</strong>
                      <em>{getStatusMeta(order.status).label}</em>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <article className="panel executive-history-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="eyebrow">Historial operativo</span>
              <h2 className="section-title mt-4">Pedidos por fecha</h2>
            </div>
            <form action="/executive" className="executive-date-form">
              <input
                type="date"
                name="date"
                defaultValue={movement.selectedDate}
                className="executive-date-input"
                aria-label="Filtrar pedidos por fecha"
              />
              <button type="submit" className="ios-button-secondary">
                Ver dia
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-[color:var(--border)] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[color:var(--muted)]">Pedidos realizados</p>
                <p className="metric-value mt-2">{movement.totalSelectedEvents}</p>
              </div>
              <p className="text-right text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                {movement.selectedDateLabel}
              </p>
            </div>

            <div
              className="executive-week-chart mt-6"
              aria-label="Pedidos realizados en los ultimos siete dias"
            >
              {movement.weeklyBuckets.map((bucket) => (
                <div key={bucket.key} className="executive-week-column">
                  <span className="executive-week-value">{bucket.total}</span>
                  <span
                    className="executive-week-bar"
                    style={
                      {
                        "--week-height": `${Math.max(
                          bucket.total > 0 ? 18 : 4,
                          Math.round((bucket.total / maxWeeklyMovements) * 100),
                        )}%`,
                      } as CSSProperties
                    }
                  />
                  <span className="executive-week-label">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="soft-card-strong">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                Resumen del dia
              </p>
              <div className="mt-4 space-y-3">
                {movement.eventTypeBuckets.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">
                    Sin pedidos registrados.
                  </p>
                ) : (
                  movement.eventTypeBuckets.map((bucket) => (
                    <div key={bucket.key} className="executive-type-row">
                      <span>{bucket.label}</span>
                      <span className="executive-type-track">
                        <span
                          style={
                            {
                              "--type-width": `${Math.max(
                                12,
                                Math.round(
                                  (bucket.total / maxDailySummaryCount) * 100,
                                ),
                              )}%`,
                            } as CSSProperties
                          }
                        />
                      </span>
                      <strong>{bucket.total}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="soft-card-strong">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                Pedidos del dia
              </p>
              <div className="mt-4 space-y-2">
                {movement.selectedEvents.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">
                    No hay pedidos para esta fecha.
                  </p>
                ) : (
                  movement.selectedEvents.map((event) => (
                    <div key={event.id} className="executive-event-row">
                      <span>{event.trackingCode}</span>
                      <strong>{event.title}</strong>
                      <em>{event.occurredAtLabel}</em>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
