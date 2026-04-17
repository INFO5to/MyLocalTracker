import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const internalRoles = ["owner", "staff", "driver"] as const;

export type InternalRole = (typeof internalRoles)[number];

export type InternalProfile = {
  id: string;
  email: string;
  fullName: string;
  role: InternalRole;
  isActive: boolean;
};

export type InternalSession = {
  user: User;
  profile: InternalProfile;
};

function normalizeRole(value: unknown): InternalRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return internalRoles.includes(value as InternalRole)
    ? (value as InternalRole)
    : null;
}

function mapProfileRow(user: User, row: Record<string, unknown> | null) {
  if (!row) {
    return null;
  }

  const role = normalizeRole(row.role);

  if (!role || row.is_active === false) {
    return null;
  }

  return {
    id: user.id,
    email:
      typeof row.email === "string"
        ? row.email
        : user.email ?? "sin-correo@localtracker.app",
    fullName:
      typeof row.full_name === "string" && row.full_name.length > 0
        ? row.full_name
        : user.user_metadata.full_name ??
          user.email ??
          "Usuario interno",
    role,
    isActive: true,
  } satisfies InternalProfile;
}

export async function getOptionalInternalSession(): Promise<InternalSession | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return null;
  }

  const profile = mapProfileRow(user, (profileRow as Record<string, unknown> | null) ?? null);

  if (!profile) {
    return null;
  }

  return {
    user,
    profile,
  };
}

export async function requireInternalSession(
  allowedRoles: InternalRole[],
  nextPath = "/dashboard",
) {
  const session = await getOptionalInternalSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!allowedRoles.includes(session.profile.role)) {
    redirect("/login?message=Tu cuenta no tiene permisos para entrar aqui.");
  }

  return session;
}

export async function requireInternalActionAccess(allowedRoles: InternalRole[]) {
  const session = await getOptionalInternalSession();

  if (!session) {
    throw new Error("Tu sesion expiro. Vuelve a iniciar sesion.");
  }

  if (!allowedRoles.includes(session.profile.role)) {
    throw new Error("Tu cuenta no tiene permisos para ejecutar esta accion.");
  }

  return session;
}
