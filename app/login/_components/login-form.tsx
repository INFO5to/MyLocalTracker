"use client";

import { useActionState, useState } from "react";
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

const roleModes = {
  owner: {
    label: "Dominante",
    title: "Control total del sistema",
    description:
      "Gestiona pedidos, repartidores y toda la operacion interna desde el panel principal.",
    emailPlaceholder: "dueno@localtracker.app",
    prefillEmail: "",
  },
  staff: {
    label: "Staff",
    title: "Operacion del turno",
    description:
      "Pensado para quien confirma pedidos, mueve estados y coordina el turno.",
    emailPlaceholder: "staff@localtracker.app",
    prefillEmail: "staff@localtracker.app",
  },
  driver: {
    label: "Driver",
    title: "Ruta y seguimiento vivo",
    description:
      "Usa este acceso para entrar a la capa interna del repartidor y emitir ubicaciones.",
    emailPlaceholder: "driver@localtracker.app",
    prefillEmail: "driver@localtracker.app",
  },
} as const;

type RoleMode = keyof typeof roleModes;

function UserAccessIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-16 w-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="24" r="10" />
      <path d="M15 50c3.8-8.7 11-13 17-13s13.2 4.3 17 13" />
    </svg>
  );
}

export function LoginForm({ nextPath, initialMessage }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    signInInternalAction,
    initialState,
  );
  const [selectedRole, setSelectedRole] = useState<RoleMode>("owner");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const message = state.message || initialMessage || "";
  const isError = state.status === "error" || Boolean(initialMessage);
  const roleMode = roleModes[selectedRole];

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="panel panel-strong flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <span className="eyebrow">Control principal</span>
          <div className="space-y-3">
            <h1 className="display-title text-4xl sm:text-5xl">
              El acceso interno ahora se siente como la puerta principal del sistema.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[color:var(--muted)]">
              Esta entrada esta reservada para negocio, staff y repartidores
              internos. El cliente final nunca pasa por aqui: solo usa su link
              privado de tracking.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Owner",
              text: "Administra modulos, usuarios y configuracion del negocio.",
            },
            {
              title: "Staff",
              text: "Opera pedidos, asigna repartidores y mueve estados.",
            },
            {
              title: "Driver",
              text: "Entra a su ruta interna para emitir ubicaciones en vivo.",
            },
          ].map((role) => (
            <div key={role.title} className="soft-card-strong">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--brand-deep)]">
                {role.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {role.text}
              </p>
            </div>
          ))}
        </div>
      </article>

      <form action={formAction} className="panel panel-strong">
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            className="access-avatar"
            aria-expanded={showRoleMenu}
            aria-controls="login-role-menu"
            onClick={() => {
              setShowRoleMenu((currentValue) => !currentValue);
            }}
          >
            <UserAccessIcon />
          </button>
          {showRoleMenu ? (
            <div
              id="login-role-menu"
              className="mt-4 flex flex-wrap justify-center gap-2"
            >
              {(
                Object.entries(roleModes) as Array<[RoleMode, (typeof roleModes)[RoleMode]]>
              ).map(([roleKey, roleValue]) => (
                <button
                  key={roleKey}
                  type="button"
                  className={
                    roleKey === selectedRole ? "ios-button" : "ios-button-secondary"
                  }
                  onClick={() => {
                    setSelectedRole(roleKey);
                    setEmailValue(roleValue.prefillEmail);
                    setShowRoleMenu(false);
                  }}
                >
                  {roleValue.label}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
            Acceso interno · {roleMode.label}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
            {roleMode.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-[color:var(--muted)]">
            {roleMode.description}
          </p>
        </div>

        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="role_hint" value={selectedRole} />

        <div className="mt-8 grid gap-4">
          <label className="field">
            <span className="field-label">Correo</span>
            <input
              className="field-input"
              type="email"
              name="email"
              value={emailValue}
              onChange={(event) => {
                setEmailValue(event.target.value);
              }}
              placeholder={roleMode.emailPlaceholder}
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
            className="ios-button"
          >
            {pending ? "Entrando..." : "Entrar al sistema"}
          </button>
          <span className="link-chip">Panel protegido por rol</span>
        </div>

        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          Si quieres manejar cuentas demo separadas, crea los usuarios en
          Supabase Auth con el rol correspondiente. Las restricciones de Owner,
          Staff y Driver ya se aplican dentro del sistema.
        </p>

        {message ? (
          <p
            aria-live="polite"
            className={`mt-4 text-sm ${isError ? "text-red-700" : "text-emerald-700"}`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
