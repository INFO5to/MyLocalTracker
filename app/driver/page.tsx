import { redirect } from "next/navigation";
import Link from "next/link";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { requireInternalSession } from "@/lib/auth";
import { StatusPill } from "@/app/_components/status-pill";
import { getDriverHomeSnapshot, getStatusMeta } from "@/lib/tracking";

export default async function DriverHomePage() {
  const session = await requireInternalSession(
    ["owner", "staff", "driver"],
    "/driver",
  );

  if (session.profile.role === "owner" || session.profile.role === "staff") {
    redirect("/dashboard");
  }

  const snapshot = await getDriverHomeSnapshot(session.profile.id);
  const courier = snapshot.courier;
  const activeInRoute = snapshot.activeOrders.filter(
    (order) => order.status === "on_the_way",
  ).length;

  return (
    <main className="page-shell dashboard-shell">
      <SiteHeader />
      {courier ? (
        <RealtimeRefresh
          channelName={`driver-home-${courier.id}`}
          targets={[
            {
              table: "orders",
              filter: `courier_id=eq.${courier.id}`,
            },
            {
              table: "courier_locations",
              filter: `courier_id=eq.${courier.id}`,
            },
            {
              table: "couriers",
              filter: `id=eq.${courier.id}`,
            },
          ]}
        />
      ) : null}

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Vista de Repartidor</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Tus pedidos asignados viven en un panel hecho solo para ruta.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Aqui no ves el dashboard del negocio. Solo tu estado del turno,
                tus pedidos activos y tu historial reciente de entregas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="link-chip border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              {snapshot.activeOrders.length} activos
            </span>
            <span className="link-chip">{activeInRoute} en ruta</span>
          </div>
        </div>
      </section>

      {!courier ? (
        <section className="mx-auto mt-6 max-w-4xl">
          <article className="panel">
            <span className="eyebrow">Vinculacion pendiente</span>
            <h2 className="section-title mt-4">Tu cuenta aun no esta enlazada a un repartidor.</h2>
            <div className="mt-6 grid gap-3">
              {snapshot.highlights.map((highlight) => (
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
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="metric-card">
              <p className="text-sm text-[color:var(--muted)]">Pedidos activos</p>
              <p className="metric-value mt-3">{snapshot.activeOrders.length}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                asignados a ti
              </p>
            </article>
            <article className="metric-card">
              <p className="text-sm text-[color:var(--muted)]">En ruta</p>
              <p className="metric-value mt-3">{activeInRoute}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                seguimiento vivo
              </p>
            </article>
            <article className="metric-card">
              <p className="text-sm text-[color:var(--muted)]">Entregados</p>
              <p className="metric-value mt-3">{snapshot.deliveredOrders.length}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                historial reciente
              </p>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-6">
              <article className="panel">
                <span className="eyebrow">Tu perfil de ruta</span>
                <h2 className="section-title mt-4">{courier.fullName}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="soft-card-strong">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Estado
                    </p>
                    <p className="mt-2 font-semibold">{courier.statusLabel}</p>
                  </div>
                  <div className="soft-card-strong">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Contacto
                    </p>
                    <p className="mt-2 font-semibold">{courier.phone}</p>
                  </div>
                  <div className="soft-card-strong sm:col-span-2 xl:col-span-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Vehiculo
                    </p>
                    <p className="mt-2 font-semibold">{courier.vehicleLabel}</p>
                  </div>
                </div>
              </article>

              <article className="panel">
                <span className="eyebrow">Recordatorios</span>
                <h2 className="section-title mt-4">Como usar tu panel</h2>
                <div className="mt-6 space-y-3">
                  {snapshot.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="space-y-6">
              <article className="panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="eyebrow">Pedidos activos</span>
                    <h2 className="section-title mt-4">Tus rutas del turno</h2>
                  </div>
                  <span className="link-chip">{snapshot.activeOrders.length} visibles</span>
                </div>

                <div className="mt-6 space-y-4">
                  {snapshot.activeOrders.length === 0 ? (
                    <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
                      No tienes pedidos activos asignados por ahora.
                    </div>
                  ) : (
                    snapshot.activeOrders.map((order) => (
                      <article key={order.code} className="soft-card">
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
                          <StatusPill status={order.status} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                          <span>{order.etaLabel}</span>
                          <span>{order.totalLabel}</span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Link
                            href={`/driver/${order.code}`}
                            className="ios-button"
                          >
                            Abrir ruta
                          </Link>
                          <Link
                            href={`/track/${order.publicToken}`}
                            className="ios-button-secondary"
                          >
                            Ver tracking cliente
                          </Link>
                          <span className="link-chip">{getStatusMeta(order.status).label}</span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <article className="panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="eyebrow">Entregados</span>
                    <h2 className="section-title mt-4">Cierres recientes</h2>
                  </div>
                  <span className="link-chip">{snapshot.deliveredOrders.length} entregados</span>
                </div>

                <div className="mt-6 space-y-3">
                  {snapshot.deliveredOrders.length === 0 ? (
                    <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
                      Aun no hay entregas registradas en tu panel.
                    </div>
                  ) : (
                    snapshot.deliveredOrders.slice(0, 6).map((order) => (
                      <div key={order.code} className="soft-card-strong">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                              {order.code}
                            </p>
                            <p className="mt-2 font-semibold">{order.customerName}</p>
                          </div>
                          <span className="link-chip">{order.lastUpdateLabel}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
