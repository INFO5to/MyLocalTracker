"use server";

import { redirect } from "next/navigation";
import {
  getOptionalInternalSession,
  resolveInternalPathForRole,
} from "@/lib/auth";
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

  const email = asString(formData.get("email")).toLowerCase();
  const password = asString(formData.get("password"));
  const nextPathInput = asString(formData.get("next"));
  const nextPath = nextPathInput ? sanitizeNextPath(nextPathInput) : null;

  if (!email || !password) {
    return {
      status: "error",
      message: "Correo y contrasena son obligatorios.",
    };
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
