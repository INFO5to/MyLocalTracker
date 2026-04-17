import { buildTrackingUrl } from "@/lib/public-url";
import { normalizeMexicanWhatsappPhone } from "@/lib/phone";
import { getStatusMeta, type OrderStatus } from "@/lib/tracking";

type CustomerOrderNotificationInput = {
  businessName: string;
  customerName: string;
  customerPhone: string | null;
  trackingCode: string;
  trackingToken: string;
  status: OrderStatus;
};

type NotificationChannel = "whatsapp" | "sms" | null;

type NotificationResult = {
  channel: NotificationChannel;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

const notifiableStatuses = new Set<OrderStatus>(["on_the_way", "delivered"]);

function shouldNotifyForStatus(status: OrderStatus) {
  return notifiableStatuses.has(status);
}

function formatWhatsappDestination(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");

  // Twilio/WhatsApp expects Mexico mobile numbers with +521.
  if (digits.startsWith("52") && !digits.startsWith("521") && digits.length === 12) {
    return `+521${digits.slice(2)}`;
  }

  return phone;
}

function buildNotificationBody(input: CustomerOrderNotificationInput) {
  const statusLabel = getStatusMeta(input.status).label;
  const trackingUrl = buildTrackingUrl(input.trackingToken);

  return `Hola ${input.customerName}, tu pedido ${input.trackingCode} de ${input.businessName} ahora esta ${statusLabel}. Sigue tu pedido aqui: ${trackingUrl}`;
}

async function sendTwilioMessage(payload: URLSearchParams) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return {
      ok: false,
      reason: "Faltan las credenciales base de Twilio.",
    };
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      cache: "no-store",
    },
  );

  if (response.ok) {
    return {
      ok: true,
    };
  }

  let reason = "Twilio rechazo la solicitud de mensajeria.";

  try {
    const errorPayload = (await response.json()) as {
      message?: string;
      code?: number;
    };

    if (errorPayload.message) {
      reason = `${errorPayload.message}${errorPayload.code ? ` (code ${errorPayload.code})` : ""}`;
    }

    if (errorPayload.code === 63038) {
      reason =
        "Twilio alcanzo el limite diario de 5 mensajes para esta cuenta o sandbox (code 63038).";
    }

    if (errorPayload.code === 63015) {
      reason =
        "El numero destino aun no esta habilitado en el sandbox de WhatsApp o no coincide con el formato esperado por Twilio (code 63015).";
    }
  } catch {
    // Ignore JSON parsing failures and use the generic reason.
  }

  return {
    ok: false,
    reason,
  };
}

export async function notifyCustomerOrderStatus(
  input: CustomerOrderNotificationInput,
): Promise<NotificationResult> {
  if (!shouldNotifyForStatus(input.status)) {
    return {
      channel: null,
      status: "skipped",
      reason: "El estado actual no dispara notificacion al cliente.",
    };
  }

  if (!input.customerPhone) {
    return {
      channel: null,
      status: "skipped",
      reason: "El pedido no tiene telefono del cliente.",
    };
  }

  const normalizedPhone = normalizeMexicanWhatsappPhone(input.customerPhone);

  if (!normalizedPhone) {
    return {
      channel: null,
      status: "skipped",
      reason: "El telefono del cliente no esta en un formato util para mensajeria.",
    };
  }

  const body = buildNotificationBody(input);
  const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  const twilioWhatsappContentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;

  if (twilioWhatsappFrom) {
    const whatsappPayload = new URLSearchParams({
      To: `whatsapp:${formatWhatsappDestination(normalizedPhone)}`,
      From: twilioWhatsappFrom.startsWith("whatsapp:")
        ? twilioWhatsappFrom
        : `whatsapp:${twilioWhatsappFrom}`,
    });

    if (twilioWhatsappContentSid) {
      whatsappPayload.set("ContentSid", twilioWhatsappContentSid);
      whatsappPayload.set(
        "ContentVariables",
        JSON.stringify({
          1: input.customerName,
          2: input.trackingCode,
          3: input.businessName,
          4: getStatusMeta(input.status).label,
          5: buildTrackingUrl(input.trackingToken),
        }),
      );
    } else {
      whatsappPayload.set("Body", body);
    }

    const whatsappResult = await sendTwilioMessage(whatsappPayload);

    if (whatsappResult.ok) {
      return {
        channel: "whatsapp",
        status: "sent",
      };
    }

    const smsFrom = process.env.TWILIO_SMS_FROM;

    if (!smsFrom) {
      return {
        channel: "whatsapp",
        status: "failed",
        reason: whatsappResult.reason,
      };
    }
  }

  const twilioSmsFrom = process.env.TWILIO_SMS_FROM;

  if (!twilioSmsFrom) {
    return {
      channel: null,
      status: "skipped",
      reason: "No hay configurado un canal de salida para WhatsApp ni para SMS.",
    };
  }

  const smsPayload = new URLSearchParams({
    To: normalizedPhone,
    From: twilioSmsFrom,
    Body: body,
  });

  const smsResult = await sendTwilioMessage(smsPayload);

  if (smsResult.ok) {
    return {
      channel: "sms",
      status: "sent",
    };
  }

  return {
    channel: "sms",
    status: "failed",
    reason: smsResult.reason,
  };
}
