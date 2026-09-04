const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const PLATE_PATTERN = /^[A-Z0-9]+$/;

export function formatName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function formatPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPhone(value: string) {
  const trimmed = value.trim();
  return `${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}

export function validateName(value: string, label: string) {
  const formatted = formatName(value);
  if (!formatted) return `${label} is required.`;
  if (!NAME_PATTERN.test(formatted)) return `${label} may contain only letters, spaces, apostrophes, and hyphens.`;
  return null;
}

export function validateEmail(value: string) {
  const formatted = value.trim().toLowerCase();
  if (!formatted) return "Email is required.";
  if (!EMAIL_PATTERN.test(formatted)) return "Enter a valid email address without spaces.";
  return null;
}

export function validateUsername(value: string) {
  const formatted = value.trim();
  if (!formatted) return "Username is required.";
  if (!USERNAME_PATTERN.test(formatted)) return "Username may contain only letters, numbers, and underscores.";
  return null;
}

export function validatePassword(value: string) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return "Password must include uppercase, lowercase, number, and special character.";
  }
  return null;
}

export function validatePhone(value: string) {
  const formatted = formatPhone(value);
  if (!formatted) return "Phone number is required.";
  if (!PHONE_PATTERN.test(formatted)) return "Phone number must contain 7 to 15 digits.";
  return null;
}

export function validatePlate(value: string) {
  const formatted = formatPlate(value);
  if (!formatted) return "Vehicle plate number is required.";
  if (!PLATE_PATTERN.test(formatted)) return "Vehicle plate must contain only letters and numbers.";
  return null;
}

export function assertValid(condition: string | null): void {
  if (condition) throw new Error(condition);
}
