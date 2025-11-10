export const normalizePhone = (phone: string) => {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
};

export const hashPhone = async (phone: string) => {
  const salt = process.env.PII_HASH_SALT ?? '';
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${phone}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const last4Digits = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4) || digits;
};

export const redactText = (text: string) =>
  text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')
    .replace(/\b(?:\d[ -]?){13,16}\b/g, '[card]')
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '[zip]');
