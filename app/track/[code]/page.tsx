import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntervalRefresh } from "@/app/_components/interval-refresh";
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
    <main className="customer-track-shell">
      <IntervalRefresh intervalMs={5000} />

      <section className="customer-track-topbar">
        <div className="brand-mark" aria-hidden="true">
          LT
        </div>
        <div className="min-w-0">
          <span className="eyebrow">Seguimiento de pedido</span>
          <h1>{tracking.code}</h1>
          <p>
            {tracking.customerName} · {tracking.destination}
          </p>
        </div>
        <div className="customer-track-topbar__meta">
          <StatusPill status={tracking.status} />
          <span>{tracking.etaLabel}</span>
          <span>{tracking.lastUpdatedLabel}</span>
        </div>
      </section>

      <section className="customer-track-status-strip" aria-label="Estados del pedido">
        {orderSteps.map((step, index) => {
          const meta = getStatusMeta(step);
          const isComplete = index <= currentStep;
          const isCurrent = step === tracking.status;

          return (
            <article
              className={`customer-track-step ${isComplete ? "is-complete" : ""} ${
                isCurrent ? "is-current" : ""
              }`}
              key={step}
            >
              <span>{index + 1}</span>
              <strong>{meta.label}</strong>
            </article>
          );
        })}
      </section>

      <section className="customer-track-map-stage">
        <TrackingMap
          courierLabel={tracking.driver.name}
          destinationLabel={tracking.destination}
          courierLocation={tracking.liveLocation}
          destinationLocation={tracking.destinationLocation}
        />
      </section>

      <section className="customer-track-sheet">
        <article>
          <span className="eyebrow">Pedido</span>
          <h2>Resumen</h2>
          <div className="customer-track-detail-grid">
            <div>
              <span>Destino</span>
              <strong>{tracking.destination}</strong>
            </div>
            <div>
              <span>Repartidor</span>
              <strong>{tracking.driver.name}</strong>
            </div>
            <div>
              <span>Vehiculo</span>
              <strong>{tracking.driver.vehicle}</strong>
            </div>
            <div>
              <span>Contacto</span>
              <strong>{tracking.driver.phone}</strong>
            </div>
          </div>
        </article>

        <article>
          <span className="eyebrow">Estados</span>
          <h2>Ultimos movimientos</h2>
          <div className="customer-track-events">
            {tracking.timeline.slice(0, 4).map((event) => (
              <div key={event.id}>
                <strong>{event.title}</strong>
                <span>{event.occurredAtLabel}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="customer-track-items">
        <span>Items</span>
        <strong>{tracking.items.join(", ")}</strong>
      </section>
    </main>
  );
}
