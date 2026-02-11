const VIETNAMESE_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
};

function normalizeVietnamese(str: string): string {
  return str.toLowerCase().split('').map(c => VIETNAMESE_MAP[c] || c).join('');
}

function toAcronym(name: string, maxLen = 6): string {
  const normalized = normalizeVietnamese(name);
  const words = normalized.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, maxLen).toUpperCase();
  }
  let acronym = words.map(w => w[0]).join('');
  if (acronym.length < 3 && words.length >= 2) {
    acronym = words[0].substring(0, 2) + words.slice(1).map(w => w[0]).join('');
  }
  return acronym.substring(0, maxLen).toUpperCase();
}

const MATERIAL_MAP: Record<string, string> = {
  'bat trang': 'BT',
  'binh duong': 'BD',
  'su': 'SU',
  'nhua': 'NH',
  'go': 'GO',
  'xi mang': 'XM',
  'thuy tinh': 'TT',
  'gom': 'GM',
  'dat nung': 'DN',
  'composite': 'CP',
  'inox': 'IX',
};

const COLOR_MAP: Record<string, string> = {
  'trang': 'WH',
  'den': 'BK',
  'xam': 'GR',
  'do': 'RD',
  'xanh': 'BL',
  'vang': 'YL',
  'nau': 'BR',
  'hong': 'PK',
  'tim': 'PP',
  'cam': 'OR',
};

const SIZE_MAP: Record<string, string> = {
  'nho': 'S',
  'trung': 'M',
  'lon': 'L',
  'sieu lon': 'XL',
  'mini': 'XS',
};

function extractToken(nameNormalized: string, map: Record<string, string>): string | null {
  for (const [key, code] of Object.entries(map)) {
    if (nameNormalized.includes(key)) return code;
  }
  return null;
}

export function generatePotTypeSku(nameVi: string): string {
  const norm = normalizeVietnamese(nameVi);
  const material = extractToken(norm, MATERIAL_MAP) || toAcronym(nameVi, 3);
  const color = extractToken(norm, COLOR_MAP) || '';
  const size = extractToken(norm, SIZE_MAP) || '';
  const parts = ['PT', material];
  if (color) parts.push(color);
  if (size) parts.push(size);
  return parts.join('-');
}

export function generateDecorationTypeSku(nameVi: string): string {
  const acronym = toAcronym(nameVi, 4);
  return `DC-${acronym}`;
}

export function generatePremadePotSku(nameVi: string, potTypeName?: string): string {
  const acronym = toAcronym(nameVi, 4);
  if (potTypeName) {
    const norm = normalizeVietnamese(potTypeName);
    const material = extractToken(norm, MATERIAL_MAP);
    if (material) return `PP-${acronym}-${material}`;
  }
  return `PP-${acronym}`;
}

export function generateCatalogItemSku(speciesNameVi: string, color: string): string {
  const speciesAcronym = toAcronym(speciesNameVi, 4);
  const colorNorm = normalizeVietnamese(color);
  const colorCode = extractToken(colorNorm, COLOR_MAP) || toAcronym(color, 2);
  return `OR-${speciesAcronym}-${colorCode}`;
}

export async function ensureUniqueSku(
  baseSku: string,
  checkExists: (sku: string) => Promise<boolean>,
): Promise<string> {
  let sku = baseSku;
  let suffix = 1;
  while (await checkExists(sku)) {
    sku = `${baseSku}-${suffix}`;
    suffix++;
  }
  return sku;
}
