import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
  getDriverHomeSnapshot,
  getInternalTrackingOrderByCode,
  getNextStatusLabel,
  getStatusMeta,
  orderSteps,
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
  const session = await requireInternalSession(
    ["owner", "staff", "driver"],
    `/driver/${code}`,
  );
  let allowedCourierId: string | null = null;

  if (session.profile.role === "driver") {
    const snapshot = await getDriverHomeSnapshot(session.profile.id);
    allowedCourierId = snapshot.courier?.id ?? null;
  }

  const tracking = await getInternalTrackingOrderByCode(code, {
    allowedCourierId,
  });

  if (!tracking) {
    notFound();
  }

  const nextStatusLabel = getNextStatusLabel(tracking.status);
  const trackingUrl = buildTrackingUrl(tracking.publicToken);
  const trackingReady =
    tracking.status === "on_the_way" || tracking.status === "delivered";
  const currentStatusIndex = orderSteps.indexOf(tracking.status);

  return (
    <main className="page-shell dashboard-shell">
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
                Pedido {tracking.code}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                {tracking.customerName} · {tracking.destination}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusPill status={tracking.status} />
            <Link href={`/track/${tracking.publicToken}`} className="ios-button-secondary">
              Abrir tracking publico
            </Link>
            <Link
              href={session.profile.role === "driver" ? "/driver" : "/dashboard"}
              className="ios-button-quiet"
            >
              {session.profile.role === "driver"
                ? "Volver a vista de repartidor"
                : "Volver al dashboard"}
            </Link>
          </div>
        </div>
      </section>

      <section className="driver-status-strip mt-6" aria-label="Estado del pedido">
        {orderSteps.map((status, index) => {
          const meta = getStatusMeta(status);
          const state =
            status === tracking.status
              ? "current"
              : index < currentStatusIndex
                ? "done"
                : "pending";

          return (
            <div
              key={status}
              className="driver-status-step"
              data-state={state}
              style={{ "--status-color": meta.dot } as CSSProperties}
            >
              <span className="driver-status-step__dot">{index + 1}</span>
              <div>
                <p>{meta.label}</p>
                <small>
                  {state === "current"
                    ? "Ahora"
                    : state === "done"
                      ? "Listo"
                      : "Pendiente"}
                </small>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <article className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow">Pedido activo</span>
              <h2 className="section-title mt-4">Mapa de entrega</h2>
            </div>
            <div className="soft-card-strong text-sm text-[color:var(--muted)]">
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
            <span className="link-chip">Cliente {tracking.customerName}</span>
          </div>

          <div className="driver-map-stage mt-6">
            <TrackingMap
              courierLabel={tracking.driver.name}
              destinationLabel={tracking.destination}
              courierLocation={tracking.liveLocation}
              destinationLocation={tracking.destinationLocation}
            />
          </div>

          <DriverTrackingConsole
            orderId={tracking.id}
            trackingCode={tracking.code}
            courierId={tracking.driver.id}
            currentStatus={tracking.status}
            destinationLocation={tracking.destinationLocation}
            initialLiveLocation={tracking.liveLocation}
          />
        </article>

        <div className="space-y-6">
          <article className="panel">
            <span className="eyebrow">Flujo del pedido</span>
            <h2 className="section-title mt-4">Siguiente accion</h2>

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
                    className="ios-button"
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
            customerName={tracking.customerName}
            customerPhone={tracking.customerPhone}
            businessName={tracking.businessName}
          />

          <InstallCta />
        </div>
      </section>
    </main>
  );
}
