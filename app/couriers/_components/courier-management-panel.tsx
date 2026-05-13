import { saveCourierAction } from "@/app/dashboard/actions";
import type { CourierOption } from "@/lib/tracking";

type CourierManagementPanelProps = {
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

function CourierDetailCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)] xl:hidden">
        {label}
      </p>
      <p className="text-sm font-medium text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function CourierAddIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-16 w-16"
      fill="none"
    >
      <path
        d="M20 44h24M24 36h16M18 24h28"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 16h36a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M44 8v16M36 16h16"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CourierManagementPanel({
  couriers,
}: CourierManagementPanelProps) {
  const activeCouriers = couriers.filter((courier) => courier.isActive);
  const restingCouriers = couriers.filter((courier) => !courier.isActive);
  const roster = [...couriers].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    return left.fullName.localeCompare(right.fullName, "es");
  });

  return (
    <section className="mt-6 space-y-6">
      <details className="panel panel-strong courier-create-fold">
        <summary className="courier-create-summary">
          <div className="courier-create-button">
            <span className="courier-create-button__icon">
              <CourierAddIcon />
            </span>
            <span className="courier-create-button__title">Nuevo repartidor</span>
          </div>

          <div className="min-w-0">
            <span className="eyebrow">Alta rapida</span>
            <h2 className="section-title mt-4">Agregar o preparar un repartidor.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
              Abre este modulo solo cuando necesites registrar o activar a alguien
              para el turno.
            </p>
          </div>

          <div className="courier-create-stats">
            <span>{couriers.length} total</span>
            <span>{activeCouriers.length} disponibles</span>
            <span>{restingCouriers.length} descanso</span>
          </div>
        </summary>

          <form
            action={saveCourierAction}
            className="courier-create-form grid gap-4 border-t pt-6 md:grid-cols-2"
          >
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
              <span className="field-label">ID de acceso</span>
              <input
                className="field-input"
                type="text"
                name="driver_login_id"
                placeholder="DRV-001"
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

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="ios-button">
                Guardar repartidor
              </button>
              <span className="link-chip border-none bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                Tabla viva del roster
              </span>
            </div>
          </form>
      </details>

      <article className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Tabla operativa</span>
            <h3 className="section-title mt-4">Repartidores del turno</h3>
          </div>
          <span className="link-chip">{couriers.length} registros</span>
        </div>

        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          Cada fila se abre para editar datos sin mezclar la tabla con el
          modulo de pedidos.
        </p>

        <div className="soft-card-strong mt-6 hidden xl:block">
            <div
              className="grid items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]"
              style={{
                gridTemplateColumns:
                  "1.05fr 0.8fr 1fr 0.75fr 0.75fr 0.9fr 0.7fr 0.55fr",
              }}
            >
            <span>Repartidor</span>
            <span>ID acceso</span>
            <span>Telefono</span>
            <span>Vehiculo</span>
            <span>Placa</span>
            <span>Estado</span>
            <span>Actualizado</span>
            <span className="text-right">Accion</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {roster.length === 0 ? (
            <div className="soft-card-strong text-sm leading-7 text-[color:var(--muted)]">
              Todavia no hay repartidores registrados en la base.
            </div>
          ) : (
            roster.map((courier) => (
              <details
                key={courier.id}
                className="soft-card group overflow-hidden border-[color:var(--border)]"
              >
                <summary className="list-none cursor-pointer">
                  <div
                    className="grid gap-4 xl:items-center"
                    style={{
                      gridTemplateColumns:
                        "repeat(1, minmax(0, 1fr))",
                    }}
                  >
                    <div
                      className="hidden xl:grid xl:items-center xl:gap-4"
                      style={{
                        gridTemplateColumns:
                          "1.05fr 0.8fr 1fr 0.75fr 0.75fr 0.9fr 0.7fr 0.55fr",
                      }}
                    >
                      <CourierDetailCell
                        label="Repartidor"
                        value={courier.fullName}
                      />
                      <CourierDetailCell
                        label="ID acceso"
                        value={courier.driverLoginId}
                      />
                      <CourierDetailCell label="Telefono" value={courier.phone} />
                      <CourierDetailCell
                        label="Vehiculo"
                        value={courier.vehicleType || "Sin vehiculo"}
                      />
                      <CourierDetailCell
                        label="Placa"
                        value={courier.vehiclePlate || "Sin placa"}
                      />
                      <div>
                        <CourierStatusBadge isActive={courier.isActive} />
                      </div>
                      <CourierDetailCell
                        label="Actualizado"
                        value={courier.updatedAtLabel}
                      />
                      <div className="text-right">
                        <span className="ios-button-quiet min-h-0 px-0 py-0 text-[color:var(--brand-deep)]">
                          Editar
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 xl:hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                            Repartidor
                          </p>
                          <h4 className="mt-2 text-lg font-semibold">
                            {courier.fullName}
                          </h4>
                        </div>
                        <CourierStatusBadge isActive={courier.isActive} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <CourierDetailCell
                          label="ID acceso"
                          value={courier.driverLoginId}
                        />
                        <CourierDetailCell label="Telefono" value={courier.phone} />
                        <CourierDetailCell
                          label="Vehiculo"
                          value={courier.vehicleType || "Sin vehiculo"}
                        />
                        <CourierDetailCell
                          label="Placa"
                          value={courier.vehiclePlate || "Sin placa"}
                        />
                        <CourierDetailCell
                          label="Actualizado"
                          value={courier.updatedAtLabel}
                        />
                      </div>

                      <span className="ios-button-quiet min-h-0 self-start px-0 py-0 text-[color:var(--brand-deep)]">
                        Editar registro
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                  <form
                    action={saveCourierAction}
                    className="grid gap-4 md:grid-cols-2"
                  >
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
                        defaultValue={
                          courier.phone === "Sin telefono" ? "" : courier.phone
                        }
                        placeholder="+52 55 1234 5678"
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">ID de acceso</span>
                      <input
                        className="field-input"
                        type="text"
                        name="driver_login_id"
                        defaultValue={courier.driverLoginId}
                        placeholder="DRV-001"
                        required
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
                      <span className="ios-button-quiet min-h-0 px-0 py-0 text-[color:var(--muted)]">
                        {courier.vehicleLabel}
                      </span>
                    </div>
                  </form>
                </div>
              </details>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
