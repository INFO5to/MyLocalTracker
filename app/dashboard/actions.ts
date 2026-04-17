"use server";

import { refresh, revalidatePath } from "next/cache";
import { requireInternalActionAccess } from "@/lib/auth";
import { notifyCustomerOrderStatus } from "@/lib/notifications";
import { normalizeMexicanWhatsappPhone } from "@/lib/phone";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getNextOrderStatus, getStatusMeta, type OrderStatus } from "@/lib/tracking";

export type CreateOrderActionState = {
  status: "idle" | "success" | "error";
  message: string;
  trackingCode?: string;
};

function parseBooleanFlag(value: string) {
  return value === "true";
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEta(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCoordinate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createOrderAction(
  _prevState: CreateOrderActionState,
  formData: FormData,
): Promise<CreateOrderActionState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Falta configurar Supabase en .env.local antes de crear pedidos reales.",
    };
  }

  await requireInternalActionAccess(["owner", "staff"]);

  const customerName = asString(formData.get("customer_name"));
  const customerPhone = asString(formData.get("customer_phone"));
  const deliveryAddress = asString(formData.get("delivery_address"));
  const notes = asString(formData.get("notes"));
  const itemsRaw = asString(formData.get("items"));
  const totalAmountRaw = asString(formData.get("total_amount"));
  const etaMinutesRaw = asString(formData.get("eta_minutes"));
  const deliveryLatRaw = asString(formData.get("delivery_lat"));
  const deliveryLngRaw = asString(formData.get("delivery_lng"));
  const courierId = asString(formData.get("courier_id"));
  const businessName = asString(formData.get("business_name")) || "LocalTracker";
  const customerPhoneDigits = customerPhone.replace(/\D/g, "");
  const hasCustomerPhoneInput = customerPhoneDigits.length > 3;
  const normalizedCustomerPhone = hasCustomerPhoneInput
    ? normalizeMexicanWhatsappPhone(customerPhone)
    : null;

  if (!customerName || !deliveryAddress || !itemsRaw) {
    return {
      status: "error",
      message: "Cliente, direccion e items son obligatorios.",
    };
  }

  const totalAmount = parseAmount(totalAmountRaw);
  const etaMinutes = parseEta(etaMinutesRaw);
  const deliveryLat = parseCoordinate(deliveryLatRaw);
  const deliveryLng = parseCoordinate(deliveryLngRaw);

  if (totalAmount === null || totalAmount < 0) {
    return {
      status: "error",
      message: "El total debe ser un numero valido.",
    };
  }

  if (etaMinutesRaw && (etaMinutes === null || etaMinutes < 0)) {
    return {
      status: "error",
      message: "La ETA debe ser un numero valido.",
    };
  }

  if ((deliveryLatRaw && deliveryLat === null) || (deliveryLngRaw && deliveryLng === null)) {
    return {
      status: "error",
      message: "Las coordenadas deben ser numeros validos.",
    };
  }

  if ((deliveryLatRaw && !deliveryLngRaw) || (!deliveryLatRaw && deliveryLngRaw)) {
    return {
      status: "error",
      message: "Si capturas coordenadas, agrega latitud y longitud completas.",
    };
  }

  if (deliveryLat !== null && Math.abs(deliveryLat) > 90) {
    return {
      status: "error",
      message: "La latitud debe estar entre -90 y 90.",
    };
  }

  if (deliveryLng !== null && Math.abs(deliveryLng) > 180) {
    return {
      status: "error",
      message: "La longitud debe estar entre -180 y 180.",
    };
  }

  if (hasCustomerPhoneInput && !normalizedCustomerPhone) {
    return {
      status: "error",
      message:
        "El telefono de WhatsApp debe venir en formato mexicano valido. Usa 10 digitos y la app lo guardara como +521.",
    };
  }

  const items = itemsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (items.length === 0) {
    return {
      status: "error",
      message: "Agrega al menos un item separado por comas.",
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      business_name: businessName,
      customer_name: customerName,
      customer_phone: normalizedCustomerPhone,
      delivery_address: deliveryAddress,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      courier_id: courierId || null,
      notes: notes || null,
      items,
      total_amount: totalAmount,
      eta_minutes: etaMinutes,
      status: "pending",
    })
    .select("tracking_code")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message:
        error?.message ??
        "No se pudo crear el pedido. Revisa que ya hayas corrido la migracion SQL.",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  refresh();

  return {
    status: "success",
    message: `Pedido creado correctamente con tracking ${data.tracking_code}.`,
    trackingCode: data.tracking_code,
  };
}

export async function advanceOrderStatus(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  await requireInternalActionAccess(["owner", "staff", "driver"]);

  const orderId = asString(formData.get("order_id"));
  const trackingCode = asString(formData.get("tracking_code"));
  const currentStatus = asString(formData.get("current_status")) as OrderStatus;
  const nextStatus = getNextOrderStatus(currentStatus);

  if (!orderId || !trackingCode || !nextStatus) {
    return;
  }

  const { data: updatedOrder, error } = await supabase
    .from("orders")
    .update({
      status: nextStatus,
      is_tracking_enabled: nextStatus === "on_the_way",
    })
    .eq("id", orderId)
    .eq("tracking_code", trackingCode)
    .eq("status", currentStatus)
    .select(
      "tracking_code, public_tracking_token, customer_name, customer_phone, business_name, status",
    )
    .single();

  if (error || !updatedOrder) {
    throw new Error(
      error.message ??
        `No se pudo avanzar el pedido a ${getStatusMeta(nextStatus).label}.`,
    );
  }

  try {
    const notificationResult = await notifyCustomerOrderStatus({
      businessName:
        typeof updatedOrder.business_name === "string"
          ? updatedOrder.business_name
          : "LocalTracker",
      customerName:
        typeof updatedOrder.customer_name === "string"
          ? updatedOrder.customer_name
          : "Cliente",
      customerPhone:
        typeof updatedOrder.customer_phone === "string"
          ? updatedOrder.customer_phone
          : null,
      trackingCode:
        typeof updatedOrder.tracking_code === "string"
          ? updatedOrder.tracking_code
          : trackingCode,
      trackingToken:
        typeof updatedOrder.public_tracking_token === "string"
          ? updatedOrder.public_tracking_token
          : trackingCode,
      status: nextStatus,
    });

    if (notificationResult.status === "failed") {
      console.error(
        `[notifications] No se pudo enviar el aviso ${notificationResult.channel ?? "sin canal"} para ${trackingCode}: ${notificationResult.reason ?? "sin detalle"}`,
      );
    } else if (notificationResult.status === "skipped") {
      console.warn(
        `[notifications] No se envio aviso para ${trackingCode}: ${notificationResult.reason ?? "sin detalle"}`,
      );
    }
  } catch (notificationError) {
    console.error(
      `[notifications] Error inesperado al intentar avisar al cliente de ${trackingCode}:`,
      notificationError,
    );
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/driver/${trackingCode}`);
  revalidatePath(
    `/track/${
      typeof updatedOrder.public_tracking_token === "string"
        ? updatedOrder.public_tracking_token
        : trackingCode
    }`,
  );
  refresh();
}

export async function saveCourierAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }

  await requireInternalActionAccess(["owner", "staff"]);

  const courierId = asString(formData.get("courier_id"));
  const fullName = asString(formData.get("full_name"));
  const phone = asString(formData.get("phone"));
  const vehicleType = asString(formData.get("vehicle_type"));
  const vehiclePlate = asString(formData.get("vehicle_plate"));
  const isActive = parseBooleanFlag(asString(formData.get("is_active")));

  if (!fullName) {
    throw new Error("El nombre del repartidor es obligatorio.");
  }

  const payload = {
    full_name: fullName,
    phone: phone || null,
    vehicle_type: vehicleType || null,
    vehicle_plate: vehiclePlate || null,
    is_active: isActive,
  };

  const query = courierId
    ? supabase.from("couriers").update(payload).eq("id", courierId)
    : supabase.from("couriers").insert(payload);

  const { error } = await query;

  if (error) {
    throw new Error(
      error.message ?? "No se pudo guardar el repartidor en Supabase.",
    );
  }

  revalidatePath("/dashboard");
  refresh();
}
