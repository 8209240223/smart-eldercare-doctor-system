const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const checksums = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

export function normalizeIdCard(value: string) {
  return value.trim().toUpperCase();
}

export function extractBirthDateFromIdCard(value: string) {
  const normalized = normalizeIdCard(value);
  if (!/^\d{17}[\dX]$/.test(normalized)) return undefined;
  const raw = normalized.slice(6, 14);
  const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  const date = new Date(`${formatted}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== formatted ? undefined : formatted;
}

export function validateIdCard(value: string) {
  const normalized = normalizeIdCard(value);
  if (!extractBirthDateFromIdCard(normalized)) return false;
  const sum = normalized.slice(0, 17).split("").reduce(
    (total, digit, index) => total + Number(digit) * weights[index],
    0,
  );
  return checksums[sum % 11] === normalized[17];
}
