import Link from "next/link";
import type { CSSProperties } from "react";
import { InstallCta } from "@/app/_components/install-cta";
import { SiteHeader } from "@/app/_components/site-header";
import { getDashboardSnapshot, getStatusMeta } from "@/lib/tracking";

export default async function Home() {
  const dashboard = await getDashboardSnapshot();
  const orders = dashboard.orders;
  const inRouteOrders = orders.filter((order) => order.status === "on_the_way");
  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const previewOrders = orders.slice(0, 3);
  const activePercent =
    orders.length > 0 ? Math.round((activeOrders.length / orders.length) * 100) : 0;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="home-hero-stage pb-8 pt-6">
        <div className="public-hero-panel home-hero-copy">
          <span className="home-orb home-orb--coral" aria-hidden="true" />
          <span className="home-orb home-orb--violet" aria-hidden="true" />

          <div className="space-y-5">
            <span className="eyebrow">Seguimiento de pedidos en tiempo real</span>
            <div className="space-y-4">
              <h1 className="display-title">
                Una app limpia para operar entregas, rutas y clientes en vivo.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
                LocalTracker separa cada experiencia: el negocio opera en un
                panel interno, el repartidor actualiza ubicacion y el cliente ve
                un mapa privado sin entrar al sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="home-primary-button">
              Entrar al control principal
            </Link>
            <Link href="/login" className="home-secondary-button">
              Acceso repartidor
            </Link>
            <span className="home-secondary-button border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              Cliente solo ve su tracking
            </span>
          </div>
        </div>

        <div className="home-dashboard-preview">
          <div className="home-preview-topbar">
            <div>
              <span className="home-preview-dot" />
              <span className="home-preview-dot home-preview-dot--violet" />
              <span className="home-preview-dot home-preview-dot--mint" />
            </div>
            <span className="home-preview-search">Buscar pedido, ruta o cliente</span>
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
                  <span>Total pedidos</span>
                  <strong>{orders.length}</strong>
                </div>
                <div className="home-preview-metric home-preview-metric--accent">
                  <span>En ruta</span>
                  <strong>{inRouteOrders.length}</strong>
                </div>
              </div>

              <div className="home-preview-analytics">
                <div className="home-line-chart" aria-hidden="true">
                  <span className="home-chart-line home-chart-line--one" />
                  <span className="home-chart-line home-chart-line--two" />
                  <span className="home-chart-point" />
                </div>
                <div className="home-donut-card">
                  <span
                    className="home-donut"
                    style={{ "--home-donut-value": `${activePercent}%` } as CSSProperties}
                  />
                  <strong>{activePercent}%</strong>
                  <small>operacion activa</small>
                </div>
              </div>

              <div className="home-preview-table">
                {previewOrders.length === 0 ? (
                  <div className="home-preview-row">
                    <span>LT-0000</span>
                    <strong>Sin pedidos</strong>
                    <em>Esperando</em>
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

          <div className="home-actor-stack">
            {[
              {
                title: "Negocio",
                text: "Accede con login al dashboard para crear pedidos, asignar repartidor y cambiar estados.",
              },
              {
                title: "Repartidor",
                text: "Usa la vista interna de ruta para emitir coordenadas y activar el tracking vivo.",
              },
              {
                title: "Cliente",
                text: "Solo abre un link privado del pedido y nunca ve el panel operativo.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="home-role-card"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-4 sm:grid-cols-3">
        {[
          ["Pedidos", "Estados, ETA y links listos para compartir."],
          ["Ruta", "El mapa se actualiza con la ubicacion del repartidor."],
          ["Cliente", "Una vista privada, clara y sin ruido operativo."],
        ].map(([title, text]) => (
          <article key={title} className="home-preview-card">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
              {title}
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {text}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 py-8 lg:grid-cols-[1fr_1fr]">
        <article className="panel">
          <span className="eyebrow">Flujo real</span>
          <h2 className="section-title mt-4">Como se vive el producto</h2>
          <div className="mt-6 space-y-4">
            {[
              "1. El equipo interno crea el pedido desde un panel protegido por login.",
              "2. Cuando el pedido pasa a En camino, se comparte el link privado del cliente.",
              "3. El cliente abre una sola vista publica con mapa, ETA y eventos de su pedido.",
              "4. El repartidor sigue emitiendo ubicaciones y el tracking se actualiza en vivo.",
            ].map((item) => (
              <div
                key={item}
                className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <span className="eyebrow">Sprint actual</span>
          <h2 className="section-title mt-4">Base cerrada para seguir endureciendo</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Supabase como backend operativo y realtime.",
              "Tracking en vivo con mapa y ruta del repartidor.",
              "Link publico listo para compartir al cliente.",
              "Panel interno con autenticacion y roles basicos.",
              "Token publico por pedido para no exponer el panel ni otros pedidos.",
            ].map((item) => (
              <div
                key={item}
                className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <InstallCta />
          </div>
        </article>
      </section>
    </main>
  );
}
