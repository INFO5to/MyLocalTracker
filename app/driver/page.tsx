import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import { requireInternalSession } from "@/lib/auth";

export default async function DriverHomePage() {
  const session = await requireInternalSession(
    ["owner", "staff", "driver"],
    "/driver",
  );

  if (session.profile.role === "owner" || session.profile.role === "staff") {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="mx-auto mt-6 max-w-4xl">
        <article className="panel panel-strong">
          <span className="eyebrow">Acceso driver</span>
          <h1 className="display-title mt-4 text-4xl sm:text-5xl">
            Tu cuenta de repartidor ya esta dentro del sistema.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            Desde aqui no operas pedidos generales. Tu rol esta pensado para
            entrar a una ruta concreta y emitir ubicaciones desde el modulo del
            pedido asignado.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="soft-card-strong">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
                Como entrar
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Usa el enlace interno que te comparta el negocio para abrir una
                ruta concreta, por ejemplo <strong>/driver/LT-XXXXXXX</strong>.
              </p>
            </div>
            <div className="soft-card-strong">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
                Que puedes hacer
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Emitir coordenadas, mover la orden en ruta y mantener vivo el
                mapa del cliente.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="ios-button-secondary">
              Volver al inicio
            </Link>
            <span className="link-chip">Rol restringido a rutas asignadas</span>
          </div>
        </article>
      </section>
    </main>
  );
}
