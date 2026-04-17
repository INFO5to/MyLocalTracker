import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntervalRefresh } from "@/app/_components/interval-refresh";
import { InstallCta } from "@/app/_components/install-cta";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import { TrackingMap } from "@/app/_components/tracking-map";
import {
  getPublicTrackingOrder,
  getStatusMeta,
  orderSteps,
} from "@/lib/tracking";

type TrackPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({
  params,
}: TrackPageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Tracking ${code.toUpperCase()}`,
    description: `Estado en tiempo real del pedido ${code.toUpperCase()}.`,
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { code } = await params;
  const tracking = await getPublicTrackingOrder(code);

  if (!tracking) {
    notFound();
  }

  const currentStep = orderSteps.indexOf(tracking.status);

  return (
    <main className="page-shell">
      <SiteHeader />
      <IntervalRefresh intervalMs={5000} />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Tracking publico</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                {tracking.businessName}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Pedido {tracking.code} para {tracking.customerName}.
                Aqui el cliente ve estado, ETA, repartidor y eventos sin tener
                que entrar al panel interno.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusPill status={tracking.status} />
            <span className="link-chip">Datos desde Supabase</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow">Estado actual</span>
              <h2 className="section-title mt-4">
                {getStatusMeta(tracking.status).label}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                ETA actual: {tracking.etaLabel}. Repartidor asignado:{" "}
                {tracking.driver.name}.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/60 bg-white/75 p-4 text-sm text-[color:var(--muted)]">
              <p className="text-xs uppercase tracking-[0.22em]">
                Ultima actualizacion
              </p>
              <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                {tracking.lastUpdatedLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {orderSteps.map((step, index) => (
              <div
                key={step}
                data-active={index <= currentStep}
                className="step-card"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="status-dot"
                    style={{
                      backgroundColor:
                        index <= currentStep ? "var(--brand)" : "#c7cfdc",
                    }}
                  />
                  <p className="text-sm font-semibold">
                    {getStatusMeta(step).label}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {getStatusMeta(step).description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <TrackingMap
              courierLabel={tracking.driver.name}
              destinationLabel={tracking.destination}
              courierLocation={tracking.liveLocation}
              destinationLocation={tracking.destinationLocation}
            />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {tracking.route.map((stop) => (
              <div key={stop.label} className="route-stop">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    {stop.kind}
                  </p>
                  <p className="mt-1 font-semibold">{stop.label}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                  {stop.window}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
            <span>
              Tracking activo: {tracking.trackingEnabled ? "si" : "aun no"}
            </span>
            <span>
              Ultima posicion: {tracking.liveLocation?.recordedAtLabel ?? "pendiente"}
            </span>
            <span>
              Coordenadas destino:{" "}
              {tracking.destinationLocation ? "capturadas" : "pendientes"}
            </span>
          </div>
        </article>

        <div className="space-y-6">
          <article className="panel">
            <span className="eyebrow">Pedido</span>
            <h2 className="section-title mt-4">Resumen para el cliente</h2>
            <div className="mt-6 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
              <p>Destino: {tracking.destination}</p>
              <p>Repartidor: {tracking.driver.name}</p>
              <p>Vehiculo: {tracking.driver.vehicle}</p>
              <p>Contacto: {tracking.driver.phone}</p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Items
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tracking.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[rgba(23,32,51,0.06)] px-3 py-1 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="panel">
            <span className="eyebrow">Eventos</span>
            <h2 className="section-title mt-4">Linea de tiempo</h2>
            <div className="mt-6 space-y-3">
              {tracking.timeline.map((event) => (
                <div key={event.id} className="timeline-item">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{event.title}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-deep)]">
                      {event.occurredAtLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <InstallCta />
        </div>
      </section>
    </main>
  );
}
