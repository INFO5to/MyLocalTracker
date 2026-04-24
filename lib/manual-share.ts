export function buildCustomerTrackingMessage(input: {
  customerName: string;
  businessName: string;
  trackingCode: string;
  trackingUrl: string;
}) {
  return `Hola ${input.customerName}, tu pedido ${input.trackingCode} de ${input.businessName} ya salio a ruta. Puedes seguirlo aqui: ${input.trackingUrl}`;
}

export function buildWhatsappDeepLink(input: {
  customerPhone: string | null;
  message: string;
}) {
  if (!input.customerPhone) {
    return null;
  }

  const digits = input.customerPhone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(input.message)}`;
}
