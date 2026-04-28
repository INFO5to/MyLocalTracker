import Link from "next/link";
import { InstallCta } from "@/app/_components/install-cta";
import { SiteHeader } from "@/app/_components/site-header";

export default async function Home() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="grid gap-6 pb-8 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="public-hero-panel flex flex-col justify-between gap-8">
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

        <div className="panel flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Vistas separadas
              </p>
              <h2 className="section-title mt-2">
                Cada actor entra donde le toca.
              </h2>
            </div>
          </div>

          <div className="grid gap-3">
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
                className="soft-card-strong"
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
