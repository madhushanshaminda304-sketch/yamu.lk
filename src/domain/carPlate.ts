export interface SriLankanPlateInfo {
  province: string;
  registration: string;
  full: string;
  masked: string;
  isEv: boolean;
  isValidFormat: boolean;
}

const SRI_LANKAN_PROVINCES = new Set([
  'WP', 'CP', 'SP', 'NP', 'NW', 'NC', 'UP', 'SG', 'EP'
]);

/**
 * Parses and formats a Sri Lankan vehicle registration plate string.
 * Supports standard format e.g. "WP CAB-1234", "CP KQ-5678", "SP EK-9901"
 * Handles unformatted variations like "wp cab 1234", "cp-kq-1234", "CAB-1234".
 */
export function formatSriLankanPlate(rawPlate: string): SriLankanPlateInfo {
  if (!rawPlate || typeof rawPlate !== 'string') {
    return {
      province: 'WP',
      registration: 'UNKNOWN',
      full: 'WP UNKNOWN',
      masked: 'WP •••-••••',
      isEv: false,
      isValidFormat: false,
    };
  }

  const cleaned = rawPlate.trim().toUpperCase();

  // Pattern 1: Starts with 2-letter province (WP, CP, SP, etc.)
  // Matches "WP CAB-1234", "WP-CAB-1234", "WP CAB 1234", "CP KQ 5678"
  const provMatch = cleaned.match(/^([A-Z]{2})[\s\-]+([A-Z]{1,3})[\s\-]*([0-9]{3,4})$/);
  if (provMatch && SRI_LANKAN_PROVINCES.has(provMatch[1])) {
    const province = provMatch[1];
    const letters = provMatch[2];
    const digits = provMatch[3];
    const registration = `${letters}-${digits}`;
    const isEv = letters.startsWith('E');
    return {
      province,
      registration,
      full: `${province} ${registration}`,
      masked: `${province} ${letters}-••••`,
      isEv,
      isValidFormat: true,
    };
  }

  // Pattern 2: Series without province (e.g. "CAB-1234", "KQ-5678")
  const seriesMatch = cleaned.match(/^([A-Z]{1,3})[\s\-]*([0-9]{3,4})$/);
  if (seriesMatch) {
    const province = 'WP'; // Default to Western Province
    const letters = seriesMatch[1];
    const digits = seriesMatch[2];
    const registration = `${letters}-${digits}`;
    const isEv = letters.startsWith('E');
    return {
      province,
      registration,
      full: `${province} ${registration}`,
      masked: `${province} ${letters}-••••`,
      isEv,
      isValidFormat: true,
    };
  }

  // Pattern 3: Legacy numeric series (e.g. "WP 65-1234", "300-1234")
  const legacyMatch = cleaned.match(/^(([A-Z]{2})[\s\-]*)?([0-9]{2,3})[\s\-]*([0-9]{4})$/);
  if (legacyMatch) {
    const province = legacyMatch[2] && SRI_LANKAN_PROVINCES.has(legacyMatch[2]) ? legacyMatch[2] : 'WP';
    const reg = `${legacyMatch[3]}-${legacyMatch[4]}`;
    return {
      province,
      registration: reg,
      full: `${province} ${reg}`,
      masked: `${province} ${legacyMatch[3]}-••••`,
      isEv: false,
      isValidFormat: true,
    };
  }

  // Fallback for non-standard or text strings
  const province = 'WP';
  const reg = rawPlate.trim();
  return {
    province,
    registration: reg,
    full: `${province} ${reg}`,
    masked: `${province} ••••`,
    isEv: false,
    isValidFormat: false,
  };
}
