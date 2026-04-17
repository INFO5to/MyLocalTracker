import Link from "next/link";
import { signOutInternalAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { getOptionalInternalSession } from "@/lib/auth";

export async function SiteHeader() {
  const internalSession = await getOptionalInternalSession();

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
              <Link href="/dashboard" className="ios-button-secondary">
                Dashboard
              </Link>
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
