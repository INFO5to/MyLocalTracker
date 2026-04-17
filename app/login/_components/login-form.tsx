"use client";

import { useActionState } from "react";
import {
  signInInternalAction,
  type LoginActionState,
} from "@/app/auth/actions";

type LoginFormProps = {
  nextPath: string;
  initialMessage?: string;
};

const initialState: LoginActionState = {
  status: "idle",
  message: "",
};

export function LoginForm({ nextPath, initialMessage }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    signInInternalAction,
    initialState,
  );

  const message = state.message || initialMessage || "";
  const isError = state.status === "error" || Boolean(initialMessage);

  return (
    <form action={formAction} className="panel panel-strong">
      <div className="space-y-4">
        <span className="eyebrow">Acceso interno</span>
        <div className="space-y-3">
          <h1 className="display-title text-4xl sm:text-5xl">
            Entra al panel operativo de LocalTracker.
          </h1>
          <p className="max-w-xl text-base leading-7 text-[color:var(--muted)]">
            Esta vista es solo para negocio, staff o repartidores internos. El
            cliente final entra unicamente por su link de tracking.
          </p>
        </div>
      </div>

      <input type="hidden" name="next" value={nextPath} />

      <div className="mt-6 grid gap-4">
        <label className="field">
          <span className="field-label">Correo</span>
          <input
            className="field-input"
            type="email"
            name="email"
            placeholder="equipo@localtracker.app"
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Contrasena</span>
          <input
            className="field-input"
            type="password"
            name="password"
            placeholder="********"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[color:var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Entrando..." : "Entrar al panel"}
        </button>

        {message ? (
          <p
            aria-live="polite"
            className={`text-sm ${isError ? "text-red-700" : "text-emerald-700"}`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
