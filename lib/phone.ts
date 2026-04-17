function digitsOnly(input: string) {
  return input.replace(/\D/g, "");
}

export function normalizeMexicanWhatsappPhone(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const digits = digitsOnly(trimmed);

  if (!digits) {
    return null;
  }

  if (digits.startsWith("521") && digits.length === 13) {
    return `+${digits}`;
  }

  if (digits.startsWith("52") && digits.length === 12) {
    return `+521${digits.slice(2)}`;
  }

  if (digits.length === 10) {
    return `+521${digits}`;
  }

  if (trimmed.startsWith("+") && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.length >= 11) {
    return `+${digits}`;
  }

  return null;
}

export function formatMexicanWhatsappFieldValue(input: string) {
  const digits = digitsOnly(input);
  let localDigits = digits;

  if (localDigits.startsWith("521")) {
    localDigits = localDigits.slice(3);
  } else if (localDigits.startsWith("52")) {
    localDigits = localDigits.slice(2);
  }

  localDigits = localDigits.slice(0, 10);

  const parts = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 10),
  ].filter(Boolean);

  return parts.length > 0 ? `+521 ${parts.join(" ")}` : "+521 ";
}
