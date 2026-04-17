import { redirect } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import { LoginForm } from "@/app/login/_components/login-form";
import { getOptionalInternalSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    message?: string;
  }>;
};

function sanitizeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const internalSession = await getOptionalInternalSession();
  const nextPath = sanitizeNextPath(params.next);

  if (internalSession) {
    redirect(nextPath);
  }

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="mx-auto mt-6 max-w-2xl">
        <LoginForm nextPath={nextPath} initialMessage={params.message} />
      </section>
    </main>
  );
}
