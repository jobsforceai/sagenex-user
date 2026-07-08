export const normalizePhoneNumber = (value: string) => {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits || /^0+$/.test(digits)) {
    return { ok: false as const, error: "Enter a valid phone number." };
  }

  const normalized = raw.startsWith("+")
    ? `+${digits}`
    : digits.length === 10
      ? `+91${digits}`
      : `+${digits}`;

  if (!/^\+[1-9]\d{9,14}$/.test(normalized)) {
    return { ok: false as const, error: "Enter a 10-digit mobile number or include country code." };
  }

  return { ok: true as const, phone: normalized };
};

export const isValidPhoneNumber = (value: string) => normalizePhoneNumber(value).ok;
