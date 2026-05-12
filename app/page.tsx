import Link from "next/link";
import { SiteHeader } from "@/app/_components/site-header";

export default async function Home() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="home-hero-stage home-hero-stage--public pb-8 pt-6">
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
      </section>
    </main>
  );
}
