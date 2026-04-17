import Link from "next/link";
import { InstallCta } from "@/app/_components/install-cta";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import { advanceOrderStatus } from "@/app/dashboard/actions";
import { CreateOrderForm } from "@/app/dashboard/_components/create-order-form";
import { requireInternalSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/tracking";

export default async function DashboardPage() {
  await requireInternalSession(["owner", "staff"], "/dashboard");
  const dashboard = await getDashboardSnapshot();
  const latestOrder = dashboard.orders[0] ?? null;

  return (
    <main className="page-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName="dashboard-orders"
        targets={[{ table: "orders" }, { table: "order_events" }]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Centro operativo</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Panel para ver pedidos, ETA y cuellos de botella en vivo.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Esta pantalla esta pensada para duenos o personal operativo. Si
                las variables de Supabase estan presentes, los refrescos en vivo
                se activan automaticamente con Realtime.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {latestOrder ? (
              <Link href={`/track/${latestOrder.publicToken}`} className="link-chip">
                Abrir ultimo tracking
              </Link>
            ) : null}
            <span className="link-chip border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              Sesion conectada a Supabase
            </span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <p className="text-sm text-[color:var(--muted)]">{metric.label}</p>
            <p className="metric-value mt-3">{metric.value}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
              {metric.caption}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Pedidos activos</span>
              <h2 className="section-title mt-4">Tablero del turno actual</h2>
            </div>
            <p className="text-sm text-[color:var(--muted)]">
              {dashboard.orders.length} pedidos visibles
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.orders.map((order) => (
              <article
                key={order.code}
                className="rounded-[1.7rem] border border-white/60 bg-white/75 p-5"
              >
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
                  <span>Repartidor: {order.courierName}</span>
                  <span>{order.etaLabel}</span>
                  <span>{order.totalLabel}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/track/${order.publicToken}`}
                    className="rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
                  >
                    Abrir tracking
                  </Link>
                  <Link
                    href={`/driver/${order.code}`}
                    className="rounded-full border border-[rgba(23,32,51,0.08)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                  >
                    Vista repartidor
                  </Link>
                  {order.nextStatus && order.nextStatusLabel ? (
                    <form action={advanceOrderStatus}>
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="tracking_code" value={order.code} />
                      <input
                        type="hidden"
                        name="current_status"
                        value={order.status}
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-[rgba(23,32,51,0.08)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                      >
                        {order.nextStatusLabel}
                      </button>
                    </form>
                  ) : null}
                  <span className="link-chip">{order.lastUpdateLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <CreateOrderForm couriers={dashboard.couriers} />

          <article className="panel">
            <span className="eyebrow">Link publico</span>
            <h2 className="section-title mt-4">Base actual del tracking compartido</h2>
            <div className="mt-6 rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                {dashboard.trackingBaseUrl.mode === "public"
                  ? "URL publica"
                  : dashboard.trackingBaseUrl.mode === "lan"
                    ? "URL de red local"
                    : "URL local"}
              </p>
              <p className="mt-3 break-all text-base font-semibold text-[color:var(--foreground)]">
                {dashboard.trackingBaseUrl.value}
              </p>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                {dashboard.trackingBaseUrl.note}
              </p>
            </div>
          </article>

          <article className="panel">
            <span className="eyebrow">Alertas del turno</span>
            <h2 className="section-title mt-4">Donde conviene poner atencion</h2>
            <div className="mt-6 space-y-3">
              {dashboard.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4 text-sm leading-7 text-[color:var(--muted)]"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <span className="eyebrow">Roadmap inmediato</span>
            <h2 className="section-title mt-4">Siguiente capa natural del MVP</h2>
            <div className="mt-6 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
              <p>1. Mantener dashboard y vista repartidor solo para usuarios internos.</p>
              <p>2. Dejar el tracking del cliente solo por token privado del pedido.</p>
              <p>3. Endurecer politicas RLS por rol en Supabase.</p>
              <p>4. Salir del sandbox de WhatsApp hacia un canal de produccion.</p>
            </div>
          </article>

          <InstallCta />
        </div>
      </section>
    </main>
  );
}
