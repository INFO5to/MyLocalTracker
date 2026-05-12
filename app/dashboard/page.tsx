import Link from "next/link";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { CreateOrderForm } from "@/app/dashboard/_components/create-order-form";
import { OrderSummaryCard } from "@/app/dashboard/_components/order-summary-card";
import { requireInternalSession } from "@/lib/auth";
import { getDashboardSnapshot, type DashboardOrder } from "@/lib/tracking";

function OrdersPanel({
  title,
  eyebrow,
  description,
  orders,
}: {
  title: string;
  eyebrow: string;
  description: string;
  orders: DashboardOrder[];
}) {
  return (
    <article className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title mt-4">{title}</h2>
        </div>
        <span className="link-chip">{orders.length} registros</span>
      </div>

      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
        {description}
      </p>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
            Todavia no hay pedidos en esta seccion.
          </div>
        ) : (
          orders.map((order) => (
            <OrderSummaryCard key={order.code} order={order} />
          ))
        )}
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  await requireInternalSession(["owner", "staff"], "/dashboard");
  const dashboard = await getDashboardSnapshot();
  const latestOrder = dashboard.orders[0] ?? null;
  const activeOrders = dashboard.orders.filter((order) => order.status !== "delivered");
  const deliveredOrders = dashboard.orders.filter((order) => order.status === "delivered");

  return (
    <main className="page-shell dashboard-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName="dashboard-orders"
        targets={[{ table: "orders" }, { table: "order_events" }]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Modulo de pedidos</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Pedidos, ETA y estados en una sola vista limpia del turno.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Esta pantalla se queda enfocada solo en ordenes. La gestion de
                repartidores vive en su propio modulo para que el tablero de
                pedidos respire mejor y sea mas rapido de leer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/couriers" className="link-chip">
              Ir a repartidores
            </Link>
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

      <section className="mt-6">
        <CreateOrderForm
          couriers={dashboard.couriers.filter((courier) => courier.isActive)}
          historyHref="/dashboard/history"
          historyCount={deliveredOrders.length}
        />
      </section>

      <section className="mt-6">
        <OrdersPanel
          eyebrow="Pedidos activos"
          title="Turno en movimiento"
          description="Aqui quedan los pedidos que todavia estan en operacion: pendientes, confirmados, preparando, listos o en camino."
          orders={activeOrders}
        />
      </section>
    </main>
  );
}
