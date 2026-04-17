"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function detectStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches;
}

function detectIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  const onChange = () => {
    callback();
  };

  mediaQuery.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);

  return () => {
    mediaQuery.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function subscribeBrowserIdentity() {
  return () => {};
}

export function InstallCta() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    detectStandalone,
    () => false,
  );
  const isIos = useSyncExternalStore(
    subscribeBrowserIdentity,
    detectIos,
    () => false,
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (isStandalone) {
    return null;
  }

  return (
    <div className="panel">
      <span className="eyebrow">PWA</span>
      <h3 className="section-title mt-4">Instala la app en el dispositivo</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        Esta base ya expone manifest e iconos para que el producto pueda
        instalarse como app web. Ideal para negocio, repartidor o cliente
        frecuente.
      </p>

      {deferredPrompt ? (
        <button
          type="button"
          onClick={() => {
            void handleInstall();
          }}
          className="ios-button mt-5"
        >
          Instalar LocalTracker
        </button>
      ) : (
        <p className="mt-5 text-sm leading-7 text-[color:var(--muted)]">
          {isIos
            ? 'En iPhone o iPad: usa Compartir > "Anadir a pantalla de inicio".'
            : "El boton de instalacion aparecera cuando el navegador lo habilite."}
        </p>
      )}
    </div>
  );
}
