const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const PLATE_PATTERN = /^[A-Z0-9]+$/;
const DEVICE_ID_PATTERN = /^pi-viratrak-[0-9]{2,3}$/;

export function formatName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function formatPlate(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export function formatPhone(value: string) {
  const trimmed = value.trim();
  return `${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}

export function validateName(value: string, label: string) {
  const formatted = formatName(value);
  if (!formatted) return `${label} is required.`;
  if (!NAME_PATTERN.test(formatted))
    return `${label} may contain only letters, spaces, apostrophes, and hyphens.`;
  return null;
}

export function validateEmail(value: string) {
  const formatted = value.trim().toLowerCase();
  if (!formatted) return "Email is required.";
  if (!EMAIL_PATTERN.test(formatted))
    return "Enter a valid email address without spaces.";
  return null;
}

export function validatePassword(value: string) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return "Password must include uppercase, lowercase, number, and special character.";
  }
  return null;
}

export function validatePhone(value: string) {
  const formatted = formatPhone(value);
  if (!formatted) return "Phone number is required.";
  if (!PHONE_PATTERN.test(formatted))
    return "Phone number must contain 7 to 15 digits.";
  return null;
}

export function validatePlate(value: string) {
  const formatted = formatPlate(value);
  if (!formatted) return "Vehicle plate number is required.";
  if (formatted.length < 6) return "Vehicle plate must be 6 to 8 characters.";
  if (formatted.length > 8)
    return "Vehicle plate must be 8 characters or fewer.";
  if (!PLATE_PATTERN.test(formatted))
    return "Vehicle plate must contain only letters and numbers.";
  return null;
}

export function validateDeviceId(value: string | null) {
  if (!value?.trim()) return "Device ID is required.";
  if (!DEVICE_ID_PATTERN.test(value.trim()))
    return "Device ID must use the pi-viratrak- prefix followed by 2 or 3 digits.";
  return null;
}

export function formatLocalPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length > 6)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length > 3) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return digits;
}

export function assertValid(condition: string | null): void {
  if (condition) throw new Error(condition);
}
