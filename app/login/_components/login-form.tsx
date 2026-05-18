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
    title: "Control principal",
    identifierLabel: "Correo",
    identifierPlaceholder: "dueno@localtracker.app",
    prefillIdentifier: "",
    inputType: "email" as const,
  },
  staff: {
    label: "Staff",
    title: "Panel de staff",
    identifierLabel: "Correo",
    identifierPlaceholder: "staff@localtracker.app",
    prefillIdentifier: "staff@localtracker.app",
    inputType: "email" as const,
  },
  driver: {
    label: "Driver",
    title: "Vista de repartidor",
    identifierLabel: "ID de repartidor",
    identifierPlaceholder: "DRV-001",
    prefillIdentifier: "",
    inputType: "text" as const,
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
  const [identifierValue, setIdentifierValue] = useState("");

  const message = state.message || initialMessage || "";
  const isError = state.status === "error" || Boolean(initialMessage);
  const roleMode = roleModes[selectedRole];

  return (
    <section className="login-stage">
      <form action={formAction} className="login-card">
        <div className="login-brand">
          <div className="brand-mark" aria-hidden="true">
            LT
          </div>
          <div>
            <span>LocalTracker</span>
            <strong>Acceso interno</strong>
          </div>
        </div>

        <div className="login-avatar-zone">
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
              className="login-role-menu"
            >
              {(
                Object.entries(roleModes) as Array<[RoleMode, (typeof roleModes)[RoleMode]]>
              ).map(([roleKey, roleValue]) => (
                <button
                  key={roleKey}
                  type="button"
                  className={`login-role-option ${
                    roleKey === selectedRole ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setSelectedRole(roleKey);
                    setIdentifierValue(roleValue.prefillIdentifier);
                    setShowRoleMenu(false);
                  }}
                >
                  {roleValue.label}
                </button>
              ))}
            </div>
          ) : null}
          <span className="login-role-label">{roleMode.label}</span>
          <h1>{roleMode.title}</h1>
        </div>

        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="role_hint" value={selectedRole} />

        <div className="login-fields">
          <label className="field">
            <span className="field-label">{roleMode.identifierLabel}</span>
            <input
              className="field-input"
              type={roleMode.inputType}
              name="identifier"
              value={identifierValue}
              onChange={(event) => {
                setIdentifierValue(event.target.value);
              }}
              placeholder={roleMode.identifierPlaceholder}
              autoComplete={selectedRole === "driver" ? "username" : "email"}
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

        <div className="login-actions">
          <button type="submit" disabled={pending} className="login-submit-button">
            {pending ? "Entrando..." : "Entrar al sistema"}
          </button>
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={`login-message ${isError ? "is-error" : "is-success"}`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
