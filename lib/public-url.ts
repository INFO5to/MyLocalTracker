import os from "node:os";

export type TrackingBaseUrlInfo = {
  value: string;
  mode: "localhost" | "lan" | "public";
  source: "tracking_env" | "app_env" | "derived_lan" | "default_localhost";
  note: string;
};

function normalizeHttpUrl(input: string | undefined) {
  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isLocalhost(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function isPrivateIpv4(hostname: string) {
  return (
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function getPreferredPort() {
  const envUrl =
    normalizeHttpUrl(process.env.TRACKING_PUBLIC_BASE_URL) ??
    normalizeHttpUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (envUrl) {
    const parsed = new URL(envUrl);
    return parsed.port || (parsed.protocol === "https:" ? "443" : "3000");
  }

  return process.env.PORT || "3000";
}

function deriveLanUrl() {
  const networkInterfaces = os.networkInterfaces();
  const preferredPort = getPreferredPort();

  for (const addresses of Object.values(networkInterfaces)) {
    for (const address of addresses ?? []) {
      if (
        address.family === "IPv4" &&
        !address.internal &&
        isPrivateIpv4(address.address)
      ) {
        return `http://${address.address}:${preferredPort}`;
      }
    }
  }

  return null;
}

function buildNote(mode: TrackingBaseUrlInfo["mode"], value: string) {
  if (mode === "public") {
    return `Los mensajes al cliente ya salen con una URL publica real: ${value}`;
  }

  if (mode === "lan") {
    return `Los links de tracking saldran con ${value}. Funcionan en celulares conectados a la misma red Wi-Fi que tu PC.`;
  }

  return `Los links siguen apuntando a ${value}. Eso no abrira en el celular del cliente; para pruebas usa la misma red Wi-Fi o configura TRACKING_PUBLIC_BASE_URL.`;
}

function classifyBaseUrl(
  value: string,
  source: TrackingBaseUrlInfo["source"],
): TrackingBaseUrlInfo {
  const parsed = new URL(value);
  const hostname = parsed.hostname.toLowerCase();
  const mode = isLocalhost(hostname)
    ? "localhost"
    : isPrivateIpv4(hostname)
      ? "lan"
      : "public";

  return {
    value,
    source,
    mode,
    note: buildNote(mode, value),
  };
}

export function getTrackingBaseUrlInfo(): TrackingBaseUrlInfo {
  const trackingEnvUrl = normalizeHttpUrl(process.env.TRACKING_PUBLIC_BASE_URL);

  if (trackingEnvUrl) {
    return classifyBaseUrl(trackingEnvUrl, "tracking_env");
  }

  const appEnvUrl = normalizeHttpUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (appEnvUrl) {
    const appEnvInfo = classifyBaseUrl(appEnvUrl, "app_env");

    if (appEnvInfo.mode !== "localhost") {
      return appEnvInfo;
    }

    const derivedLanUrl = deriveLanUrl();

    if (derivedLanUrl) {
      return classifyBaseUrl(derivedLanUrl, "derived_lan");
    }

    return appEnvInfo;
  }

  const fallbackLanUrl = deriveLanUrl();

  if (fallbackLanUrl) {
    return classifyBaseUrl(fallbackLanUrl, "derived_lan");
  }

  return classifyBaseUrl("http://localhost:3000", "default_localhost");
}

export function buildTrackingUrl(trackingCode: string) {
  return new URL(
    `/track/${encodeURIComponent(trackingCode)}`,
    `${getTrackingBaseUrlInfo().value}/`,
  ).toString();
}
