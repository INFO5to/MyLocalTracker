import Link from "next/link";
import type { CSSProperties } from "react";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { requireInternalSession } from "@/lib/auth";
import { getDashboardSnapshot, getStatusMeta } from "@/lib/tracking";

export default async function ExecutivePage() {
  await requireInternalSession(["owner"], "/executive");

  const dashboard = await getDashboardSnapshot();
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

  return (
    <main className="page-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName="executive-dashboard"
        targets={[
          { table: "orders" },
          { table: "order_events" },
          { table: "couriers" },
          { table: "courier_locations" },
        ]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Vista ejecutiva</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Pulso real del turno sin entrar al detalle operativo.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Este modulo concentra la lectura ejecutiva: pedidos activos,
                rutas en curso, repartidores, historial cerrado y estado vivo de
                la operacion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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

      <section className="home-hero-stage mt-6 pb-8">
        <div className="home-dashboard-preview">
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

        <article className="panel">
          <span className="eyebrow">Lectura rapida</span>
          <h2 className="section-title mt-4">Que debe vigilar el administrador</h2>
          <div className="mt-6 space-y-3">
            {dashboard.highlights.map((highlight) => (
              <div
                key={highlight}
                className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]"
              >
                {highlight}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
