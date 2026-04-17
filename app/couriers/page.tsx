import { RealtimeRefresh } from "@/app/_components/realtime-refresh";
import { SiteHeader } from "@/app/_components/site-header";
import { CourierManagementPanel } from "@/app/couriers/_components/courier-management-panel";
import { requireInternalSession } from "@/lib/auth";
import { getCourierRoster } from "@/lib/tracking";

export default async function CouriersPage() {
  await requireInternalSession(["owner", "staff"], "/couriers");
  const couriers = await getCourierRoster();
  const activeCouriers = couriers.filter((courier) => courier.isActive);
  const restingCouriers = couriers.filter((courier) => !courier.isActive);

  return (
    <main className="page-shell">
      <SiteHeader />
      <RealtimeRefresh channelName="courier-roster" targets={[{ table: "couriers" }]} />

      <section className="panel panel-strong mt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className="eyebrow">Modulo de repartidores</span>
            <div className="space-y-3">
              <h1 className="display-title text-4xl sm:text-5xl">
                Un roster vivo para el turno, separado del tablero de pedidos.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
                Aqui se administran las altas, los descansos y los datos base
                de cada repartidor. La vista de pedidos queda libre para operar
                ordenes sin sentir todo amontonado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="link-chip border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              {activeCouriers.length} disponibles
            </span>
            <span className="link-chip">
              {restingCouriers.length} en descanso
            </span>
          </div>
        </div>
      </section>

      <CourierManagementPanel couriers={couriers} />
    </main>
  );
}
