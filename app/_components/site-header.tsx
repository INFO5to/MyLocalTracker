import Link from "next/link";
import { signOutInternalAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { getOptionalInternalSession } from "@/lib/auth";

function MotorcycleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6.5" cy="16.5" r="2.7" />
      <circle cx="17.5" cy="16.5" r="2.7" />
      <path d="M9 16.5h4.4l2.2-4.8h2.7" />
      <path d="M10.8 9.2H8l1.6 3.6" />
      <path d="M12.2 9.2h4.3l-1.5 3.2" />
    </svg>
  );
}

export async function SiteHeader() {
  const internalSession = await getOptionalInternalSession();
  const internalRole = internalSession?.profile.role ?? null;
  const canAccessOperations =
    internalRole === "owner" || internalRole === "staff";

  return (
    <header className="panel panel-strong sticky top-4 z-20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] text-lg font-bold text-white">
          LT
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            LocalTracker
          </p>
          <p className="font-semibold text-[color:var(--foreground)]">
            Tracking en tiempo real para negocios pequenos
          </p>
        </div>
      </Link>

      <div className="flex flex-col gap-3 sm:items-end">
        <ThemeToggle />

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="ios-button-quiet">
            Inicio
          </Link>
          {internalSession ? (
            <>
              {canAccessOperations ? (
                <>
                  <Link href="/dashboard" className="ios-button-secondary">
                    Pedidos
                  </Link>
                  <Link href="/couriers" className="ios-button-secondary">
                    <MotorcycleIcon />
                    Repartidores
                  </Link>
                </>
              ) : null}
              <form action={signOutInternalAction}>
                <button type="submit" className="ios-button-ghost">
                  Cerrar sesion
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="ios-button-secondary">
              Acceso interno
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
