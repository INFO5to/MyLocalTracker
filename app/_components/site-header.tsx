import Link from "next/link";
import { signOutInternalAction } from "@/app/auth/actions";
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

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/" className="link-chip">
          Inicio
        </Link>
        {internalSession ? (
          <>
            <Link href="/dashboard" className="link-chip">
              Dashboard
            </Link>
            <form action={signOutInternalAction}>
              <button type="submit" className="link-chip">
                Cerrar sesion
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="link-chip">
            Acceso interno
          </Link>
        )}
      </nav>
    </header>
  );
}
