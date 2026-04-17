import { saveCourierAction } from "@/app/dashboard/actions";
import type { CourierOption } from "@/lib/tracking";

type CourierPanelProps = {
  couriers: CourierOption[];
};

function CourierStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
      style={{
        background: isActive
          ? "color-mix(in srgb, var(--success) 18%, transparent 82%)"
          : "color-mix(in srgb, var(--warning) 16%, transparent 84%)",
        borderColor: isActive
          ? "color-mix(in srgb, var(--success) 24%, transparent 76%)"
          : "color-mix(in srgb, var(--warning) 24%, transparent 76%)",
        color: isActive
          ? "color-mix(in srgb, var(--success) 58%, var(--foreground) 42%)"
          : "color-mix(in srgb, var(--warning) 34%, var(--foreground) 66%)",
      }}
    >
      <span
        className="status-dot"
        style={{
          backgroundColor: isActive ? "var(--success)" : "var(--warning)",
        }}
      />
      {isActive ? "Disponible" : "En descanso"}
    </span>
  );
}

export function CourierPanel({ couriers }: CourierPanelProps) {
  return (
    <article className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Repartidores</span>
          <h2 className="section-title mt-4">Panel de repartidores</h2>
        </div>
        <span className="link-chip">{couriers.length} registros</span>
      </div>

      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        Aqui puedes registrar nuevos repartidores, editar sus datos y dejarlos
        disponibles o en descanso para el turno actual.
      </p>

      <div className="soft-card mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
              Alta nueva
            </p>
            <h3 className="mt-2 text-xl font-semibold">Registrar repartidor</h3>
          </div>
          <CourierStatusBadge isActive />
        </div>

        <form action={saveCourierAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="field">
            <span className="field-label">Nombre completo</span>
            <input
              className="field-input"
              type="text"
              name="full_name"
              placeholder="Luis Vega"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Telefono</span>
            <input
              className="field-input"
              type="tel"
              name="phone"
              placeholder="+52 55 1234 5678"
            />
          </label>

          <label className="field">
            <span className="field-label">Vehiculo</span>
            <input
              className="field-input"
              type="text"
              name="vehicle_type"
              placeholder="Moto"
            />
          </label>

          <label className="field">
            <span className="field-label">Placa</span>
            <input
              className="field-input"
              type="text"
              name="vehicle_plate"
              placeholder="RP-08"
            />
          </label>

          <label className="field md:col-span-2">
            <span className="field-label">Estado del turno</span>
            <select className="field-input" name="is_active" defaultValue="true">
              <option value="true">Disponible</option>
              <option value="false">En descanso</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="ios-button">
              Guardar repartidor
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 space-y-4">
        {couriers.length === 0 ? (
          <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
            Todavia no hay repartidores registrados en la base.
          </div>
        ) : (
          couriers.map((courier) => (
            <div key={courier.id} className="soft-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    Registro interno
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {courier.fullName}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Actualizado a las {courier.updatedAtLabel}
                  </p>
                </div>
                <CourierStatusBadge isActive={courier.isActive} />
              </div>

              <form action={saveCourierAction} className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="courier_id" value={courier.id} />

                <label className="field">
                  <span className="field-label">Nombre completo</span>
                  <input
                    className="field-input"
                    type="text"
                    name="full_name"
                    defaultValue={courier.fullName}
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Telefono</span>
                  <input
                    className="field-input"
                    type="tel"
                    name="phone"
                    defaultValue={courier.phone === "Sin telefono" ? "" : courier.phone}
                    placeholder="+52 55 1234 5678"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Vehiculo</span>
                  <input
                    className="field-input"
                    type="text"
                    name="vehicle_type"
                    defaultValue={courier.vehicleType}
                    placeholder="Moto"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Placa</span>
                  <input
                    className="field-input"
                    type="text"
                    name="vehicle_plate"
                    defaultValue={courier.vehiclePlate}
                    placeholder="RP-08"
                  />
                </label>

                <label className="field md:col-span-2">
                  <span className="field-label">Estado del turno</span>
                  <select
                    className="field-input"
                    name="is_active"
                    defaultValue={courier.isActive ? "true" : "false"}
                  >
                    <option value="true">Disponible</option>
                    <option value="false">En descanso</option>
                  </select>
                </label>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="ios-button">
                    Guardar cambios
                  </button>
                  <span className="ios-button-quiet">
                    {courier.phone}
                  </span>
                  <span className="ios-button-quiet">
                    {courier.vehicleLabel}
                  </span>
                </div>
              </form>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
