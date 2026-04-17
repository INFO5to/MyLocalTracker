import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InstallCta } from "@/app/_components/install-cta";
import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { StatusPill } from "@/app/_components/status-pill";
import { TrackingMap } from "@/app/_components/tracking-map";
import { TrackingShareCard } from "@/app/_components/tracking-share-card";
import { advanceOrderStatus } from "@/app/dashboard/actions";
import { DriverTrackingConsole } from "@/app/driver/_components/driver-tracking-console";
import { requireInternalSession } from "@/lib/auth";
import { buildTrackingUrl } from "@/lib/public-url";
import {
  getInternalTrackingOrderByCode,
  getNextStatusLabel,
  getStatusMeta,
} from "@/lib/tracking";

type DriverPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({
  params,
}: DriverPageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Modo repartidor ${code.toUpperCase()}`,
    description: `Control operativo y tracking del repartidor para ${code.toUpperCase()}.`,
  };
}

export default async function DriverPage({ params }: DriverPageProps) {
  const { code } = await params;
  await requireInternalSession(["owner", "staff", "driver"], `/driver/${code}`);
  const tracking = await getInternalTrackingOrderByCode(code);

  if (!tracking) {
    notFound();
  }

  const nextStatusLabel = getNextStatusLabel(tracking.status);
  const trackingUrl = buildTrackingUrl(tracking.publicToken);
  const trackingReady =
    tracking.status === "on_the_way" || tracking.status === "delivered";

  return (
    <main className="page-shell">
      <SiteHeader />
      <RealtimeRefresh
        channelName={`driver-${tracking.code}`}
        targets={[
          {
            table: "orders",
            filter: `tracking_code=eq.${tracking.code}`,
          },
          {
            table: "order_events",
            filter: `tracking_code=eq.${tracking.code}`,
          },
          {
            table: "courier_locations",
            filter: `tracking_code=eq.${tracking.code}`,
          },
        ]}
      />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Ruta del repartidor</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Opera la salida del pedido y envia coordenadas en vivo.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Esta pantalla esta pensada para el telefono del repartidor. Desde
                aqui puede iniciar el tracking, mandar su ubicacion a Supabase y
                mover el pedido por las ultimas etapas del flujo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusPill status={tracking.status} />
            <Link href={`/track/${tracking.publicToken}`} className="link-chip">
              Abrir tracking publico
            </Link>
            <Link href="/dashboard" className="link-chip">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow">Pedido activo</span>
              <h2 className="section-title mt-4">{tracking.code}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Cliente: {tracking.customerName}. Destino: {tracking.destination}.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-white/75 p-4 text-sm text-[color:var(--muted)]">
              <p className="text-xs uppercase tracking-[0.22em]">Ultima senal</p>
              <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                {tracking.liveLocation?.recordedAtLabel ?? tracking.lastUpdatedLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="link-chip">{getStatusMeta(tracking.status).label}</span>
            <span className="link-chip">ETA {tracking.etaLabel}</span>
            <span className="link-chip">Repartidor {tracking.driver.name}</span>
          </div>

          <div className="mt-6">
            <TrackingMap
              courierLabel={tracking.driver.name}
              destinationLabel={tracking.destination}
              courierLocation={tracking.liveLocation}
              destinationLocation={tracking.destinationLocation}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {tracking.route.map((stop) => (
              <div
                key={stop.label}
                className="rounded-[1.4rem] border border-[rgba(23,32,51,0.08)] bg-white/72 p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {stop.kind}
                </p>
                <p className="mt-2 font-semibold">{stop.label}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{stop.window}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="panel">
            <span className="eyebrow">Flujo del pedido</span>
            <h2 className="section-title mt-4">Ultimas acciones operativas</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Para que el tracking se sienta vivo, primero lleva el pedido a{" "}
              <strong>En camino</strong>. Eso deja la sesion lista para mandar
              ubicaciones del dispositivo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {nextStatusLabel ? (
                <form action={advanceOrderStatus}>
                  <input type="hidden" name="order_id" value={tracking.id} />
                  <input type="hidden" name="tracking_code" value={tracking.code} />
                  <input
                    type="hidden"
                    name="current_status"
                    value={tracking.status}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
                  >
                    {nextStatusLabel}
                  </button>
                </form>
              ) : (
                <span className="link-chip border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                  El pedido ya completo el flujo
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {tracking.timeline.slice(0, 4).map((event) => (
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

          <TrackingShareCard
            trackingCode={tracking.code}
            trackingUrl={trackingUrl}
            trackingReady={trackingReady}
          />

          <DriverTrackingConsole
            orderId={tracking.id}
            trackingCode={tracking.code}
            courierId={tracking.driver.id}
            currentStatus={tracking.status}
            trackingEnabled={tracking.trackingEnabled}
            destinationLocation={tracking.destinationLocation}
            initialLiveLocation={tracking.liveLocation}
          />

          <InstallCta />
        </div>
      </section>
    </main>
  );
}
