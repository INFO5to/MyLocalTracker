import { getTrackingBaseUrlInfo, type TrackingBaseUrlInfo } from "@/lib/public-url";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const orderSteps = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "on_the_way",
  "delivered",
] as const;

export type OrderStatus = (typeof orderSteps)[number];

type StatusMeta = {
  label: string;
  description: string;
  tone: "slate" | "amber" | "orange" | "teal" | "green";
  dot: string;
};

export type CourierOption = {
  id: string;
  fullName: string;
  phone: string;
  vehicleLabel: string;
  isActive: boolean;
};

export type DashboardMetric = {
  label: string;
  value: string;
  caption: string;
};

export type DashboardOrder = {
  id: string;
  code: string;
  publicToken: string;
  customerName: string;
  address: string;
  courierName: string;
  courierPhone: string;
  courierVehicle: string;
  status: OrderStatus;
  etaLabel: string;
  totalLabel: string;
  lastUpdateLabel: string;
  nextStatus: OrderStatus | null;
  nextStatusLabel: string | null;
};

export type DashboardSnapshot = {
  metrics: DashboardMetric[];
  orders: DashboardOrder[];
  highlights: string[];
  couriers: CourierOption[];
  trackingBaseUrl: TrackingBaseUrlInfo;
};

export type TrackingTimelineEvent = {
  id: string;
  title: string;
  description: string;
  occurredAtLabel: string;
};

export type TrackingRouteStop = {
  kind: string;
  label: string;
  window: string;
};

export type TrackingLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  speedMps: number | null;
  source: string;
  recordedAtLabel: string;
};

export type PublicTrackingOrder = {
  id: string;
  code: string;
  publicToken: string;
  businessName: string;
  customerName: string;
  status: OrderStatus;
  destination: string;
  etaLabel: string;
  lastUpdatedLabel: string;
  trackingEnabled: boolean;
  destinationLocation: {
    latitude: number;
    longitude: number;
  } | null;
  liveLocation: TrackingLocation | null;
  driver: {
    id: string | null;
    name: string;
    phone: string;
    vehicle: string;
  };
  items: string[];
  route: TrackingRouteStop[];
  timeline: TrackingTimelineEvent[];
};

type GenericRecord = Record<string, unknown>;
const appTimeZone = process.env.APP_TIME_ZONE ?? "America/Mexico_City";

const statusMetaMap: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Pendiente",
    description: "Pedido recibido y a la espera de confirmacion.",
    tone: "slate",
    dot: "#64748b",
  },
  confirmed: {
    label: "Confirmado",
    description: "El negocio acepto la orden y preparo el flujo interno.",
    tone: "amber",
    dot: "#f59e0b",
  },
  preparing: {
    label: "Preparando",
    description: "La orden esta en cocina o en proceso de armado.",
    tone: "orange",
    dot: "#f97316",
  },
  ready: {
    label: "Listo para salir",
    description: "La orden ya esta empacada y espera salida.",
    tone: "teal",
    dot: "#0f766e",
  },
  on_the_way: {
    label: "En camino",
    description: "El repartidor ya va rumbo al cliente.",
    tone: "teal",
    dot: "#14b8a6",
  },
  delivered: {
    label: "Entregado",
    description: "El pedido se marco como entregado.",
    tone: "green",
    dot: "#16a34a",
  },
};

function coerceRelationRecord(value: unknown): GenericRecord | null {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return firstValue && typeof firstValue === "object"
      ? (firstValue as GenericRecord)
      : null;
  }

  if (value && typeof value === "object") {
    return value as GenericRecord;
  }

  return null;
}

function buildVehicleLabel(row: GenericRecord | null) {
  if (!row) {
    return "Sin vehiculo";
  }

  const vehicleType =
    typeof row.vehicle_type === "string" && row.vehicle_type.length > 0
      ? row.vehicle_type
      : "";
  const vehiclePlate =
    typeof row.vehicle_plate === "string" && row.vehicle_plate.length > 0
      ? row.vehicle_plate
      : "";

  if (vehicleType && vehiclePlate) {
    return `${vehicleType} - ${vehiclePlate}`;
  }

  if (vehicleType) {
    return vehicleType;
  }

  if (vehiclePlate) {
    return vehiclePlate;
  }

  return "Sin vehiculo";
}

function parseMaybeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatEta(value: unknown) {
  const parsed = parseMaybeNumber(value);

  if (parsed !== null) {
    return `${parsed} min ETA`;
  }

  return "Sin ETA";
}

function formatMoney(value: unknown) {
  const parsed = parseMaybeNumber(value);

  if (parsed !== null) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(parsed);
  }

  return "$0 MXN";
}

function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== "string") {
    return "pending";
  }

  const normalized = value.toLowerCase() as OrderStatus;

  if (orderSteps.includes(normalized)) {
    return normalized;
  }

  return "pending";
}

function formatUpdateTimestamp(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return `Actualizado ${new Date(value).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: appTimeZone,
    })}`;
  }

  return "Sin actualizacion";
}

function formatClockTimestamp(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return new Date(value).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: appTimeZone,
    });
  }

  return "Sin hora";
}

function mapLocationRowToTrackingLocation(row: GenericRecord | null) {
  if (!row) {
    return null;
  }

  const latitude = parseMaybeNumber(row.latitude);
  const longitude = parseMaybeNumber(row.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracyMeters: parseMaybeNumber(row.accuracy_meters),
    headingDegrees: parseMaybeNumber(row.heading_degrees),
    speedMps: parseMaybeNumber(row.speed_mps),
    source: typeof row.source === "string" ? row.source : "browser",
    recordedAtLabel: formatClockTimestamp(row.recorded_at),
  };
}

function mapCourierRowToOption(row: GenericRecord): CourierOption {
  return {
    id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
    fullName:
      typeof row.full_name === "string" ? row.full_name : "Repartidor",
    phone: typeof row.phone === "string" ? row.phone : "Sin telefono",
    vehicleLabel: buildVehicleLabel(row),
    isActive: row.is_active !== false,
  };
}

function mapOrderRowToDashboardOrder(row: GenericRecord): DashboardOrder {
  const status = normalizeStatus(row.status);
  const courier = coerceRelationRecord(row.courier);

  return {
    id:
      typeof row.id === "string"
        ? row.id
        : typeof row.tracking_code === "string"
          ? row.tracking_code
          : crypto.randomUUID(),
    code:
      typeof row.tracking_code === "string"
        ? row.tracking_code
        : "SIN-CODIGO",
    publicToken:
      typeof row.public_tracking_token === "string"
        ? row.public_tracking_token
        : typeof row.tracking_code === "string"
          ? row.tracking_code
          : crypto.randomUUID(),
    customerName:
      typeof row.customer_name === "string"
        ? row.customer_name
        : "Cliente sin nombre",
    address:
      typeof row.delivery_address === "string"
        ? row.delivery_address
        : "Direccion pendiente",
    courierName:
      courier && typeof courier.full_name === "string"
        ? courier.full_name
        : "Por asignar",
    courierPhone:
      courier && typeof courier.phone === "string"
        ? courier.phone
        : "Sin telefono",
    courierVehicle: buildVehicleLabel(courier),
    status,
    etaLabel: formatEta(row.eta_minutes),
    totalLabel: formatMoney(row.total_amount),
    lastUpdateLabel: formatUpdateTimestamp(row.updated_at),
    nextStatus: getNextOrderStatus(status),
    nextStatusLabel: getNextStatusLabel(status),
  };
}

function buildDashboardSnapshot(
  orders: DashboardOrder[],
  couriers: CourierOption[],
  issueMessage?: string,
): DashboardSnapshot {
  const trackingBaseUrl = getTrackingBaseUrlInfo();
  const inMotion = orders.filter((order) => order.status === "on_the_way");
  const preparing = orders.filter((order) => order.status === "preparing");
  const unassigned = orders.filter((order) => order.courierName === "Por asignar");

  let highlights: string[];
  const notificationsConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SMS_FROM),
  );

  if (issueMessage) {
    highlights = [
      issueMessage,
      "La app seguira mostrando solo datos reales. Revisa tus tablas o permisos si falta informacion.",
      "Los pedidos existentes en Supabase apareceran aqui apenas la lectura vuelva a responder.",
      trackingBaseUrl.note,
    ];
  } else if (orders.length > 0) {
    highlights = [
      "Los cambios de estado ya trabajan solo sobre pedidos reales en Supabase.",
      "Cuando el pedido pase a En camino, el tracking publico usara las ubicaciones registradas del repartidor.",
      trackingBaseUrl.note,
      notificationsConfigured
        ? "La mensajeria al cliente esta lista para usar el canal configurado."
        : "Las notificaciones al cliente estan desactivadas hasta configurar Twilio para WhatsApp o SMS.",
    ];
  } else {
    highlights = [
      "La base de Supabase ya responde. Crea tu primer pedido desde este panel.",
      "Los repartidores activos se leen desde la tabla couriers.",
      trackingBaseUrl.note,
      notificationsConfigured
        ? "Al crear un pedido y avanzar estados, el cliente podra recibir avisos segun el canal configurado."
        : "Configura Twilio si quieres que el cliente reciba avisos automaticos por WhatsApp o SMS.",
    ];
  }

  return {
    metrics: [
      {
        label: "Pedidos activos",
        value: String(orders.length),
        caption:
          orders.length > 0 ? `${inMotion.length} en camino` : "sin pedidos aun",
      },
      {
        label: "Preparando",
        value: String(preparing.length),
        caption: "segun ultimo refresh",
      },
      {
        label: "Sin asignar",
        value: String(unassigned.length),
        caption: "listos para operacion",
      },
      {
        label: "Repartidores",
        value: String(couriers.length),
        caption: "activos",
      },
    ],
    orders,
    highlights,
    couriers,
    trackingBaseUrl,
  };
}

export function getStatusMeta(status: OrderStatus) {
  return statusMetaMap[status];
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const currentIndex = orderSteps.indexOf(status);

  if (currentIndex === -1 || currentIndex === orderSteps.length - 1) {
    return null;
  }

  return orderSteps[currentIndex + 1];
}

export function getNextStatusLabel(status: OrderStatus) {
  const nextStatus = getNextOrderStatus(status);

  if (!nextStatus) {
    return null;
  }

  return `Mover a ${getStatusMeta(nextStatus).label}`;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildDashboardSnapshot(
      [],
      [],
      "Supabase no esta configurado en este entorno.",
    );
  }

  try {
    const [ordersResult, couriersResult] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, tracking_code, public_tracking_token, customer_name, delivery_address, status, eta_minutes, total_amount, updated_at, courier:couriers(full_name, phone, vehicle_type, vehicle_plate)",
        )
        .order("updated_at", { ascending: false })
        .limit(24),
      supabase
        .from("couriers")
        .select("id, full_name, phone, vehicle_type, vehicle_plate, is_active")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ]);

    if (ordersResult.error || couriersResult.error) {
      throw ordersResult.error ?? couriersResult.error;
    }

    const orders = (ordersResult.data ?? []).map((row) =>
      mapOrderRowToDashboardOrder(row as GenericRecord),
    );
    const couriers = (couriersResult.data ?? []).map((row) =>
      mapCourierRowToOption(row as GenericRecord),
    );

    return buildDashboardSnapshot(orders, couriers);
  } catch {
    return buildDashboardSnapshot(
      [],
      [],
      "No pude leer los pedidos reales desde Supabase.",
    );
  }
}

function mapEventRowToTimelineEvent(row: GenericRecord, fallbackKey: string) {
  return {
    id:
      typeof row.id === "string"
        ? row.id
        : `${fallbackKey}-${typeof row.created_at === "string" ? row.created_at : "evento"}`,
    title: typeof row.title === "string" ? row.title : "Evento del pedido",
    description:
      typeof row.description === "string"
        ? row.description
        : "Actualizacion registrada en la operacion.",
    occurredAtLabel: formatClockTimestamp(row.created_at),
  } satisfies TrackingTimelineEvent;
}

function buildTrackingOrderFromSources(
  lookupValue: string,
  orderRow: GenericRecord,
  latestLocationRow: GenericRecord | null,
  eventsRows: GenericRecord[],
) {
  const courier = coerceRelationRecord(orderRow.courier);
  const courierName =
    courier && typeof courier.full_name === "string"
      ? courier.full_name
      : typeof orderRow.courier_full_name === "string"
        ? orderRow.courier_full_name
        : "Por asignar";
  const courierPhone =
    courier && typeof courier.phone === "string"
      ? courier.phone
      : typeof orderRow.courier_phone === "string"
        ? orderRow.courier_phone
        : "Sin telefono";
  const courierVehicle = buildVehicleLabel(
    courier ?? {
      vehicle_type: orderRow.courier_vehicle_type,
      vehicle_plate: orderRow.courier_vehicle_plate,
    },
  );
  const rawItems = Array.isArray(orderRow.items) ? orderRow.items : [];
  const latestLocation = latestLocationRow
    ? mapLocationRowToTrackingLocation(latestLocationRow)
    : null;
  const destinationLatitude = parseMaybeNumber(orderRow.delivery_lat);
  const destinationLongitude = parseMaybeNumber(orderRow.delivery_lng);
  const etaLabel = formatEta(orderRow.eta_minutes).replace(" ETA", "");
  const lastUpdatedValue =
    latestLocationRow?.recorded_at ?? orderRow.updated_at ?? orderRow.live_recorded_at;

  return {
    id: typeof orderRow.id === "string" ? orderRow.id : crypto.randomUUID(),
    code:
      typeof orderRow.tracking_code === "string"
        ? orderRow.tracking_code
        : lookupValue,
    publicToken:
      typeof orderRow.public_tracking_token === "string"
        ? orderRow.public_tracking_token
        : typeof orderRow.tracking_code === "string"
          ? orderRow.tracking_code
          : lookupValue,
    businessName:
      typeof orderRow.business_name === "string"
        ? orderRow.business_name
        : "LocalTracker",
    customerName:
      typeof orderRow.customer_name === "string"
        ? orderRow.customer_name
        : "Cliente",
    status: normalizeStatus(orderRow.status),
    destination:
      typeof orderRow.delivery_address === "string"
        ? orderRow.delivery_address
        : "Destino pendiente",
    etaLabel,
    lastUpdatedLabel: formatClockTimestamp(lastUpdatedValue),
    trackingEnabled: orderRow.is_tracking_enabled === true,
    destinationLocation:
      destinationLatitude !== null && destinationLongitude !== null
        ? {
            latitude: destinationLatitude,
            longitude: destinationLongitude,
          }
        : null,
    liveLocation: latestLocation,
    driver: {
      id: typeof orderRow.courier_id === "string" ? orderRow.courier_id : null,
      name: courierName,
      phone: courierPhone,
      vehicle: courierVehicle,
    },
    items: rawItems
      .filter((item): item is string => typeof item === "string")
      .slice(0, 8),
    route: [
      {
        kind: "Negocio",
        label:
          typeof orderRow.business_name === "string"
            ? orderRow.business_name
            : "LocalTracker",
        window: "Origen",
      },
      {
        kind: "Repartidor",
        label: courierName,
        window: "En seguimiento",
      },
      {
        kind: "Destino",
        label:
          typeof orderRow.delivery_address === "string"
            ? orderRow.delivery_address
            : "Cliente",
        window: etaLabel,
      },
    ],
    timeline: eventsRows.map((event) =>
      mapEventRowToTimelineEvent(event, lookupValue),
    ),
  } satisfies PublicTrackingOrder;
}

export async function getInternalTrackingOrderByCode(
  code: string,
): Promise<PublicTrackingOrder | null> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [orderResult, latestLocationResult, eventsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, tracking_code, public_tracking_token, business_name, customer_name, status, delivery_address, eta_minutes, updated_at, is_tracking_enabled, delivery_lat, delivery_lng, items, courier_id, courier:couriers(full_name, phone, vehicle_type, vehicle_plate)",
      )
      .eq("tracking_code", normalizedCode)
      .maybeSingle(),
    supabase
      .from("courier_locations")
      .select(
        "latitude, longitude, accuracy_meters, speed_mps, heading_degrees, source, recorded_at",
      )
      .eq("tracking_code", normalizedCode)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("order_events")
      .select("id, title, description, created_at")
      .eq("tracking_code", normalizedCode)
      .order("created_at", { ascending: false }),
  ]);

  if (orderResult.error || !orderResult.data) {
    return null;
  }

  return buildTrackingOrderFromSources(
    normalizedCode,
    orderResult.data as GenericRecord,
    (latestLocationResult.data as GenericRecord | null) ?? null,
    ((eventsResult.data ?? []) as GenericRecord[]).map((event) => event),
  );
}

export async function getPublicTrackingOrder(
  code: string,
): Promise<PublicTrackingOrder | null> {
  const trackingToken = code.trim();

  if (!trackingToken) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: rpcOrderRow, error: rpcOrderError } = await supabase
    .rpc("get_public_tracking_order", {
      lookup_token: trackingToken,
    })
    .maybeSingle();

  if (!rpcOrderError && rpcOrderRow) {
    const { data: rpcEventsData } = await supabase.rpc("get_public_tracking_events", {
      lookup_token: trackingToken,
    });
    const rpcOrderRecord = rpcOrderRow as GenericRecord;

    return buildTrackingOrderFromSources(
      trackingToken,
      rpcOrderRecord,
      {
        latitude: rpcOrderRecord.live_latitude,
        longitude: rpcOrderRecord.live_longitude,
        accuracy_meters: rpcOrderRecord.live_accuracy_meters,
        speed_mps: rpcOrderRecord.live_speed_mps,
        heading_degrees: rpcOrderRecord.live_heading_degrees,
        source: rpcOrderRecord.live_source,
        recorded_at: rpcOrderRecord.live_recorded_at,
      },
      ((rpcEventsData ?? []) as GenericRecord[]).map((event) => event),
    );
  }

  const normalizedCode = trackingToken.toUpperCase();
  const [orderResult, latestLocationResult, eventsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, tracking_code, public_tracking_token, business_name, customer_name, status, delivery_address, eta_minutes, updated_at, is_tracking_enabled, delivery_lat, delivery_lng, items, courier_id, courier:couriers(full_name, phone, vehicle_type, vehicle_plate)",
      )
      .or(
        `public_tracking_token.eq.${trackingToken},tracking_code.eq.${normalizedCode}`,
      )
      .maybeSingle(),
    supabase
      .from("courier_locations")
      .select(
        "latitude, longitude, accuracy_meters, speed_mps, heading_degrees, source, recorded_at",
      )
      .or(
        `tracking_code.eq.${normalizedCode},tracking_code.eq.${trackingToken}`,
      )
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("order_events")
      .select("id, title, description, created_at")
      .or(
        `tracking_code.eq.${normalizedCode},tracking_code.eq.${trackingToken}`,
      )
      .order("created_at", { ascending: false }),
  ]);

  if (orderResult.error || !orderResult.data) {
    return null;
  }

  return buildTrackingOrderFromSources(
    trackingToken,
    orderResult.data as GenericRecord,
    (latestLocationResult.data as GenericRecord | null) ?? null,
    ((eventsResult.data ?? []) as GenericRecord[]).map((event) => event),
  );
}
