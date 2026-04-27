"use server";

import { redirect } from "next/navigation";
import {
  getOptionalInternalSession,
  resolveInternalPathForRole,
} from "@/lib/auth";
import { normalizeDriverLoginId } from "@/lib/driver-login";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  status: "idle" | "error";
  message: string;
};

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function signInInternalAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Falta configurar Supabase antes de iniciar sesion.",
    };
  }

  const roleHint = asString(formData.get("role_hint")).toLowerCase();
  const identifier = asString(formData.get("identifier"));
  const password = asString(formData.get("password"));
  const nextPathInput = asString(formData.get("next"));
  const nextPath = nextPathInput ? sanitizeNextPath(nextPathInput) : null;

  if (!identifier || !password) {
    return {
      status: "error",
      message:
        roleHint === "driver"
          ? "ID de repartidor y contrasena son obligatorios."
          : "Correo y contrasena son obligatorios.",
    };
  }

  let email = identifier.toLowerCase();

  if (roleHint === "driver") {
    const normalizedDriverLoginId = normalizeDriverLoginId(identifier);
    const { data: resolvedDriver, error: resolveError } = await supabase
      .rpc("resolve_driver_login", {
        login_id: normalizedDriverLoginId,
      })
      .maybeSingle();

    if (resolveError) {
      return {
        status: "error",
        message: "No pude resolver el ID del repartidor en este momento.",
      };
    }

    const resolvedEmail =
      resolvedDriver &&
      typeof resolvedDriver === "object" &&
      "email" in resolvedDriver &&
      typeof resolvedDriver.email === "string"
        ? resolvedDriver.email
        : "";

    if (!resolvedEmail) {
      return {
        status: "error",
        message:
          "No encontramos un repartidor enlazado con ese ID de acceso.",
      };
    }

    email = resolvedEmail.toLowerCase();
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message ?? "No se pudo iniciar sesion.",
    };
  }

  const internalSession = await getOptionalInternalSession();

  if (!internalSession) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message:
        "La cuenta existe, pero aun no tiene permisos internos en LocalTracker.",
    };
  }

  redirect(resolveInternalPathForRole(internalSession.profile.role, nextPath));
}

export async function signOutInternalAction() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
