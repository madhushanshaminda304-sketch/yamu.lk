export interface Hub {
  id: string;
  name: {
    en: string;
    si: string;
    ta: string;
    ru?: string;
  };
  district: string;
  province: string;
  landmarks: string[];
  isExpresswayInterchange?: boolean;
  lat: number;
  lng: number;
}

export interface CorridorStop {
  hubId: string;
  kmFromStart: number;
  minutesFromStart: number;
}

export interface Corridor {
  id: string;
  code: string;
  name: string;
  hasTolls: boolean;
  defaultTollLkr: number;
  stops: CorridorStop[];
}

export interface RouteOptionStop {
  hubId: string;
  kmFromOrigin: number;
  minutesFromOrigin: number;
  defaultLandmark: string;
}

export interface RouteOption {
  id: string;
  corridorId: string;
  corridorCode: string;
  corridorName: string;
  hasTolls: boolean;
  estimatedTollLkr: number;
  distanceKm: number;
  durationMinutes: number;
  intermediateHubs: string[];
  stops: RouteOptionStop[];
}

export const HUBS: readonly Hub[] = [
  {
    id: 'colombo',
    name: { en: 'Colombo', si: 'කොළඹ', ta: 'கொழும்பு' , ru: 'Коломбо' },
    district: 'Colombo',
    province: 'Western',
    landmarks: ['Fort Railway Station Main Entrance', 'Independence Square Arcade', 'Town Hall / Viharamahadevi Park', 'Bambalapitiya Majestic City'],
    lat: 6.9271,
    lng: 79.8612,
  },
  {
    id: 'makumbura',
    name: { en: 'Makumbura (Kottawa MMC)', si: 'මාකුඹුර බහුවිධ ප්‍රවාහන මධ්‍යස්ථානය', ta: 'மாகும்புர போக்குவரத்து நிலையம்' , ru: 'Макумбура (MMC)' },
    district: 'Colombo',
    province: 'Western',
    landmarks: ['Makumbura Multimodal Center (E01 Bay)', 'Kottawa Expressway Interchange'],
    isExpresswayInterchange: true,
    lat: 6.8412,
    lng: 79.9684,
  },
  {
    id: 'kadawatha',
    name: { en: 'Kadawatha Interchange', si: 'කඩවත හුවමාරුව', ta: 'கடவத்தை பரிமாற்றம்' , ru: 'Кадавате (развязка)' },
    district: 'Gampaha',
    province: 'Western',
    landmarks: ['Kadawatha Expressway Bus Stand', 'Kandy Road Flyover Junction'],
    isExpresswayInterchange: true,
    lat: 7.0019,
    lng: 79.9513,
  },
  {
    id: 'katunayake',
    name: { en: 'Katunayake (BIA Airport)', si: 'කටුනායක ගුවන්තොටුපළ', ta: 'கட்டுநாயக்க விமான நிலையம்' , ru: 'Катунаяке (аэропорт BIA)' },
    district: 'Gampaha',
    province: 'Western',
    landmarks: ['Bandaranaike International Airport Arrivals', '18th Mile Post E03 Exit'],
    isExpresswayInterchange: true,
    lat: 7.1804,
    lng: 79.8841,
  },
  {
    id: 'negombo',
    name: { en: 'Negombo', si: 'මීගමුව', ta: 'நீர்கொழும்பு' , ru: 'Негомбо' },
    district: 'Gampaha',
    province: 'Western',
    landmarks: ['Negombo Central Bus Terminal', 'Periyamulla Junction', 'Lewis Place Beach Road'],
    lat: 7.2008,
    lng: 79.8737,
  },
  {
    id: 'moratuwa',
    name: { en: 'Moratuwa / Panadura', si: 'මොරටුව / පානදුර', ta: 'மொரட்டுவ / பாணந்துறை' , ru: 'Моратува / Панадура' },
    district: 'Colombo',
    province: 'Western',
    landmarks: ['University of Moratuwa Gate', 'Panadura Clock Tower'],
    lat: 6.773,
    lng: 79.8816,
  },
  {
    id: 'kalutara',
    name: { en: 'Kalutara', si: 'කළුතර', ta: 'களுத்துறை' , ru: 'Калутара' },
    district: 'Kalutara',
    province: 'Western',
    landmarks: ['Kalutara Bodhiya Main Road', 'Kalutara South Station'],
    lat: 6.5854,
    lng: 79.9607,
  },
  {
    id: 'dodangoda',
    name: { en: 'Dodangoda (E01 Exit)', si: 'දොඩංගොඩ හුවමාරුව', ta: 'தொடங்கொட' , ru: 'Додангода (выезд E01)' },
    district: 'Kalutara',
    province: 'Western',
    landmarks: ['Dodangoda Expressway Interchange', 'Mathugama Road Junction'],
    isExpresswayInterchange: true,
    lat: 6.5442,
    lng: 80.0365,
  },
  {
    id: 'bentota',
    name: { en: 'Bentota / Aluthgama', si: 'බෙන්තොට / අලුත්ගම', ta: 'பெந்தோட்டை' , ru: 'Бентота / Алутгама' },
    district: 'Galle',
    province: 'Southern',
    landmarks: ['Aluthgama Bus Stand', 'Bentota Bridge Tourist Stop'],
    lat: 6.4213,
    lng: 79.9979,
  },
  {
    id: 'kurundugahahetekma',
    name: { en: 'Kurundugahahetekma (Elpitiya E01)', si: 'කුරුඳුගහහැතැප්ම හුවමාරුව', ta: 'குருந்துகஹஹெதெக்ம' , ru: 'Курундугахахетекма (E01)' },
    district: 'Galle',
    province: 'Southern',
    landmarks: ['Kurundugahahetekma E01 Interchange', 'Ambalangoda / Elpitiya Turnoff'],
    isExpresswayInterchange: true,
    lat: 6.2651,
    lng: 80.1432,
  },
  {
    id: 'hikkaduwa',
    name: { en: 'Hikkaduwa', si: 'හික්කඩුව', ta: 'ஹிக்கடுவை' , ru: 'Хиккадува' },
    district: 'Galle',
    province: 'Southern',
    landmarks: ['Hikkaduwa Railway Station', 'Coral Gardens Galle Road'],
    lat: 6.1395,
    lng: 80.1063,
  },
  {
    id: 'galle',
    name: { en: 'Galle', si: 'ගාල්ල', ta: 'காலி' , ru: 'Галле' },
    district: 'Galle',
    province: 'Southern',
    landmarks: ['Pinnaduwa E01 Interchange', 'Galle Fort Main Gate / Clock Tower', 'Karapitiya Teaching Hospital Junction'],
    isExpresswayInterchange: true,
    lat: 6.0535,
    lng: 80.221,
  },
  {
    id: 'weligama',
    name: { en: 'Weligama / Mirissa', si: 'වැලිගම / මිරිස්ස', ta: 'வெலிகம / மிரிஸ்ஸ' , ru: 'Велигама / Мирисса' },
    district: 'Matara',
    province: 'Southern',
    landmarks: ['Kokmaduwa E01 Interchange', 'Weligama Bay Surf Point', 'Mirissa Harbour Junction'],
    isExpresswayInterchange: true,
    lat: 5.9742,
    lng: 80.4294,
  },
  {
    id: 'matara',
    name: { en: 'Matara', si: 'මාතර', ta: 'மாத்தறை' , ru: 'Матара' },
    district: 'Matara',
    province: 'Southern',
    landmarks: ['Godagama E01 Interchange', 'Matara Bodhiya / Main Bus Stand', 'Ruhuna University Wellamadama Gate'],
    isExpresswayInterchange: true,
    lat: 5.9485,
    lng: 80.5353,
  },
  {
    id: 'tangalle',
    name: { en: 'Tangalle / Beliatta', si: 'තංගල්ල / බෙලිඅත්ත', ta: 'தங்காலை' , ru: 'Тангалле / Белиатта' },
    district: 'Hambantota',
    province: 'Southern',
    landmarks: ['Beliatta E01 Interchange & Station', 'Tangalle Town Clock Tower'],
    isExpresswayInterchange: true,
    lat: 6.0243,
    lng: 80.7941,
  },
  {
    id: 'hambantota',
    name: { en: 'Hambantota / Mattala', si: 'හම්බන්තොට', ta: 'ஹம்பாந்தோட்டை' , ru: 'Хамбантота / Маттала' },
    district: 'Hambantota',
    province: 'Southern',
    landmarks: ['Southern Expressway Mattala Exit', 'Hambantota Administrative Complex'],
    isExpresswayInterchange: true,
    lat: 6.1246,
    lng: 81.1185,
  },
  {
    id: 'mirigama',
    name: { en: 'Mirigama (E04 Interchange)', si: 'මීරිගම හුවමාරුව', ta: 'மீரிகம' , ru: 'Миригама (E04)' },
    district: 'Gampaha',
    province: 'Western',
    landmarks: ['Mirigama Central Expressway Entrance', 'Mirigama Railway Station'],
    isExpresswayInterchange: true,
    lat: 7.2452,
    lng: 80.1274,
  },
  {
    id: 'kegalle',
    name: { en: 'Kegalle', si: 'කෑගල්ල', ta: 'கேகாலை' , ru: 'Кегалле' },
    district: 'Kegalle',
    province: 'Sabaragamuwa',
    landmarks: ['Kegalle Clock Tower (A1)', 'Pinnawala Turnoff Rambukkana Road'],
    lat: 7.2513,
    lng: 80.3464,
  },
  {
    id: 'mawanella',
    name: { en: 'Mawanella / Kadugannawa', si: 'මාවනැල්ල / කඩුගන්නාව', ta: 'மாவனெல்லை' , ru: 'Маванелла / Кадуганнава' },
    district: 'Kegalle',
    province: 'Sabaragamuwa',
    landmarks: ['Mawanella Town Bus Stand', 'Kadugannawa Pass Viewpoint'],
    lat: 7.2535,
    lng: 80.4452,
  },
  {
    id: 'peradeniya',
    name: { en: 'Peradeniya', si: 'පේරාදෙණිය', ta: 'பேராதனை' , ru: 'Перадения' },
    district: 'Kandy',
    province: 'Central',
    landmarks: ['University of Peradeniya Galaha Junction', 'Royal Botanical Gardens Entrance'],
    lat: 7.2699,
    lng: 80.5938,
  },
  {
    id: 'kandy',
    name: { en: 'Kandy', si: 'මහනුවර', ta: 'கண்டி' , ru: 'Канди' },
    district: 'Kandy',
    province: 'Central',
    landmarks: ['Kandy City Centre (KCC) Main Entrance', 'Goods Shed Bus Terminal', 'Katugastota Bridge Junction'],
    lat: 7.2906,
    lng: 80.6337,
  },
  {
    id: 'nuwara_eliya',
    name: { en: 'Nuwara Eliya', si: 'නුවරඑළිය', ta: 'நுவரெலியா' , ru: 'Нувара-Элия' },
    district: 'Nuwara Eliya',
    province: 'Central',
    landmarks: ['Nuwara Eliya Red Post Office', 'Gregory Lake Car Park', 'Ramboda Falls Viewpoint'],
    lat: 6.9497,
    lng: 80.7891,
  },
  {
    id: 'ella',
    name: { en: 'Ella / Badulla', si: 'ඇල්ල / බදුල්ල', ta: 'எல்ல / பதுளை' , ru: 'Элла / Бадулла' },
    district: 'Badulla',
    province: 'Uva',
    landmarks: ['Ella Railway Station Junction', 'Bandarawela Town Center', 'Badulla Bus Stand'],
    lat: 6.8667,
    lng: 81.0466,
  },
  {
    id: 'kurunegala',
    name: { en: 'Kurunegala', si: 'කුරුණෑගල', ta: 'குருநாகல்' , ru: 'Курунегала' },
    district: 'Kurunegala',
    province: 'North Western',
    landmarks: ['Kurunegala E04 Expressway Exit', 'Kurunegala Central Bus Stand / Clock Tower'],
    isExpresswayInterchange: true,
    lat: 7.4818,
    lng: 80.3609,
  },
  {
    id: 'dambulla',
    name: { en: 'Dambulla / Sigiriya', si: 'දඹුල්ල / සීගිරිය', ta: 'தம்புள்ளை / சிகிரியா' , ru: 'Дамбулла / Сигирия' },
    district: 'Matale',
    province: 'Central',
    landmarks: ['Dambulla Economic Centre / Clock Tower', 'Inamaluwa Sigiriya Turnoff', 'Habarana Junction'],
    lat: 7.8742,
    lng: 80.6511,
  },
  {
    id: 'anuradhapura',
    name: { en: 'Anuradhapura', si: 'අනුරාධපුරය', ta: 'அனுராதபுரம்' , ru: 'Анурадхапура' },
    district: 'Anuradhapura',
    province: 'North Central',
    landmarks: ['Anuradhapura New Town Bus Stand', 'Mihintale Junction'],
    lat: 8.3114,
    lng: 80.4037,
  },
  {
    id: 'vavuniya',
    name: { en: 'Vavuniya / Kilinochchi', si: 'වවුනියාව', ta: 'வவுனியா / கிளிநொச்சி' , ru: 'Вавуния / Килиноччи' },
    district: 'Vavuniya',
    province: 'Northern',
    landmarks: ['Vavuniya A9 Horowpothana Junction', 'Kilinochchi Clock Tower'],
    lat: 8.7542,
    lng: 80.4982,
  },
  {
    id: 'jaffna',
    name: { en: 'Jaffna', si: 'යාපනය', ta: 'யாழ்ப்பாணம்' , ru: 'Джафна' },
    district: 'Jaffna',
    province: 'Northern',
    landmarks: ['Jaffna Central Bus Stand / Hospital Road', 'Nallur Kandaswamy Kovil Entrance', 'University of Jaffna Gate'],
    lat: 9.6615,
    lng: 80.0255,
  },
  {
    id: 'trincomalee',
    name: { en: 'Trincomalee', si: 'ත්‍රිකුණාමලය', ta: 'திருகோணமலை' , ru: 'Тринкомали' },
    district: 'Trincomalee',
    province: 'Eastern',
    landmarks: ['Trincomalee Clock Tower Bus Stand', 'Nilaveli Beach Turnoff'],
    lat: 8.5874,
    lng: 81.2152,
  },
  {
    id: 'ratnapura',
    name: { en: 'Ratnapura / Avissawella', si: 'රත්නපුර / අවිස්සාවේල්ල', ta: 'இரத்தினபுரி' , ru: 'Ратнапура / Ависсавелла' },
    district: 'Ratnapura',
    province: 'Sabaragamuwa',
    landmarks: ['Ratnapura Clock Tower (A4)', 'Avissawella High Level Road Junction'],
    lat: 6.7056,
    lng: 80.3847,
  },
] as const;

export const ALL_HUBS = HUBS;

export const CORRIDORS: readonly Corridor[] = [
  {
    id: 'e01-southern-expressway',
    code: 'E01 / E02',
    name: 'Southern Expressway (Tolls)',
    hasTolls: true,
    defaultTollLkr: 400,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'makumbura', kmFromStart: 18, minutesFromStart: 25 },
      { hubId: 'dodangoda', kmFromStart: 52, minutesFromStart: 50 },
      { hubId: 'kurundugahahetekma', kmFromStart: 85, minutesFromStart: 75 },
      { hubId: 'galle', kmFromStart: 116, minutesFromStart: 95 },
      { hubId: 'weligama', kmFromStart: 138, minutesFromStart: 112 },
      { hubId: 'matara', kmFromStart: 151, minutesFromStart: 125 },
      { hubId: 'tangalle', kmFromStart: 184, minutesFromStart: 150 },
      { hubId: 'hambantota', kmFromStart: 228, minutesFromStart: 185 },
    ],
  },
  {
    id: 'a2-coastal-highway',
    code: 'A2',
    name: 'Galle Road Coastal Highway (No Tolls)',
    hasTolls: false,
    defaultTollLkr: 0,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'moratuwa', kmFromStart: 21, minutesFromStart: 40 },
      { hubId: 'kalutara', kmFromStart: 44, minutesFromStart: 75 },
      { hubId: 'bentota', kmFromStart: 65, minutesFromStart: 105 },
      { hubId: 'hikkaduwa', kmFromStart: 98, minutesFromStart: 150 },
      { hubId: 'galle', kmFromStart: 119, minutesFromStart: 180 },
      { hubId: 'weligama', kmFromStart: 146, minutesFromStart: 215 },
      { hubId: 'matara', kmFromStart: 162, minutesFromStart: 240 },
      { hubId: 'tangalle', kmFromStart: 197, minutesFromStart: 285 },
      { hubId: 'hambantota', kmFromStart: 240, minutesFromStart: 335 },
    ],
  },
  {
    id: 'e04-central-kandy',
    code: 'E04 / A1',
    name: 'Central Expressway via Mirigama & Kurunegala (Tolls)',
    hasTolls: true,
    defaultTollLkr: 300,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'kadawatha', kmFromStart: 16, minutesFromStart: 22 },
      { hubId: 'mirigama', kmFromStart: 54, minutesFromStart: 50 },
      { hubId: 'kurunegala', kmFromStart: 94, minutesFromStart: 80 },
      { hubId: 'kandy', kmFromStart: 136, minutesFromStart: 145 },
      { hubId: 'nuwara_eliya', kmFromStart: 212, minutesFromStart: 265 },
      { hubId: 'ella', kmFromStart: 268, minutesFromStart: 350 },
    ],
  },
  {
    id: 'a1-kandy-hill-country',
    code: 'A1 / A5',
    name: 'Colombo–Kandy–Hill Country Highway (No Tolls)',
    hasTolls: false,
    defaultTollLkr: 0,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'kadawatha', kmFromStart: 16, minutesFromStart: 25 },
      { hubId: 'kegalle', kmFromStart: 78, minutesFromStart: 115 },
      { hubId: 'mawanella', kmFromStart: 91, minutesFromStart: 135 },
      { hubId: 'peradeniya', kmFromStart: 110, minutesFromStart: 165 },
      { hubId: 'kandy', kmFromStart: 116, minutesFromStart: 180 },
      { hubId: 'nuwara_eliya', kmFromStart: 192, minutesFromStart: 300 },
      { hubId: 'ella', kmFromStart: 248, minutesFromStart: 385 },
    ],
  },
  {
    id: 'e03-airport-northern-a9',
    code: 'E03 / A9',
    name: 'Airport Expressway + A9 Northern Corridor (Tolls)',
    hasTolls: true,
    defaultTollLkr: 350,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'katunayake', kmFromStart: 32, minutesFromStart: 30 },
      { hubId: 'negombo', kmFromStart: 39, minutesFromStart: 42 },
      { hubId: 'kurunegala', kmFromStart: 108, minutesFromStart: 120 },
      { hubId: 'dambulla', kmFromStart: 162, minutesFromStart: 180 },
      { hubId: 'anuradhapura', kmFromStart: 226, minutesFromStart: 250 },
      { hubId: 'vavuniya', kmFromStart: 280, minutesFromStart: 310 },
      { hubId: 'jaffna', kmFromStart: 418, minutesFromStart: 460 },
    ],
  },
  {
    id: 'a9-kandy-jaffna-east',
    code: 'A9 / A6',
    name: 'Central to Cultural Triangle, Trincomalee & Jaffna (No Tolls)',
    hasTolls: false,
    defaultTollLkr: 0,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'kadawatha', kmFromStart: 16, minutesFromStart: 25 },
      { hubId: 'mirigama', kmFromStart: 54, minutesFromStart: 65 },
      { hubId: 'kurunegala', kmFromStart: 94, minutesFromStart: 115 },
      { hubId: 'dambulla', kmFromStart: 148, minutesFromStart: 180 },
      { hubId: 'trincomalee', kmFromStart: 256, minutesFromStart: 305 },
    ],
  },
  {
    id: 'a4-high-level-sabaragamuwa',
    code: 'A4 / A18',
    name: 'High Level Road Sabaragamuwa & Uva Corridor (No Tolls)',
    hasTolls: false,
    defaultTollLkr: 0,
    stops: [
      { hubId: 'colombo', kmFromStart: 0, minutesFromStart: 0 },
      { hubId: 'makumbura', kmFromStart: 18, minutesFromStart: 30 },
      { hubId: 'ratnapura', kmFromStart: 101, minutesFromStart: 155 },
      { hubId: 'ella', kmFromStart: 215, minutesFromStart: 315 },
    ],
  },
] as const;

export function getHubById(hubId: string | null | undefined): Hub | undefined {
  if (!hubId || typeof hubId !== 'string') return undefined;
  const clean = hubId.toLowerCase().trim();
  return HUBS.find((h) => h.id.toLowerCase() === clean);
}

export function resolveHubKey(input: string | null | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback;

  const raw = input.trim();
  if (!raw) return fallback;

  // 1. Direct match with hub ID
  const lower = raw.toLowerCase();
  const directId = ALL_HUBS.find((h) => h.id.toLowerCase() === lower);
  if (directId) return directId.id;

  // 2. Strip emojis, symbols, and parenthetical suffixes like " (MMC/Exit)"
  const cleaned = raw
    .replace(/[\u{1F300}-\u{1F9FF}|⚡|📍|🚗|•]/gu, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .toLowerCase();

  if (!cleaned) return fallback;

  // 3. Match against hub ID or English name
  const byCleanId = ALL_HUBS.find((h) => h.id.toLowerCase() === cleaned);
  if (byCleanId) return byCleanId.id;

  const byNameEn = ALL_HUBS.find((h) => h.name.en.toLowerCase() === cleaned);
  if (byNameEn) return byNameEn.id;

  // 4. Exact match against Sinhala or Tamil name
  const byLocaleName = ALL_HUBS.find(
    (h) => h.name.si === raw.trim() || h.name.ta === raw.trim()
  );
  if (byLocaleName) return byLocaleName.id;

  // 5. Partial match / landmarks match
  const byPrefix = ALL_HUBS.find(
    (h) =>
      h.name.en.toLowerCase().startsWith(cleaned) ||
      cleaned.startsWith(h.name.en.toLowerCase()) ||
      h.landmarks.some((l) => l.toLowerCase().includes(cleaned) || cleaned.includes(l.toLowerCase()))
  );
  if (byPrefix) return byPrefix.id;

  return fallback;
}

function haversineKm(a: Hub, b: Hub): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Math.max(15, Math.round(R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c)) * 1.28));
}

export function findRouteOptions(originHubId: string, destinationHubId: string): RouteOption[] {
  if (!originHubId || !destinationHubId || originHubId === destinationHubId) {
    return [];
  }

  const matched: RouteOption[] = [];

  for (const corridor of CORRIDORS) {
    const fromIdx = corridor.stops.findIndex((s) => s.hubId === originHubId);
    const toIdx = corridor.stops.findIndex((s) => s.hubId === destinationHubId);

    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
      continue;
    }

    const forward = fromIdx < toIdx;
    const slice = forward
      ? corridor.stops.slice(fromIdx, toIdx + 1)
      : corridor.stops.slice(toIdx, fromIdx + 1).reverse();

    const originStop = slice[0];
    const destStop = slice[slice.length - 1];
    const distanceKm = Math.abs(destStop.kmFromStart - originStop.kmFromStart);
    const durationMinutes = Math.abs(destStop.minutesFromStart - originStop.minutesFromStart);

    const stops: RouteOptionStop[] = slice.map((s) => {
      const hub = getHubById(s.hubId);
      return {
        hubId: s.hubId,
        kmFromOrigin: Math.abs(s.kmFromStart - originStop.kmFromStart),
        minutesFromOrigin: Math.abs(s.minutesFromStart - originStop.minutesFromStart),
        defaultLandmark: hub?.landmarks[0] ?? s.hubId,
      };
    });

    const intermediateHubs = stops.slice(1, -1).map((s) => s.hubId);

    matched.push({
      id: `${corridor.id}:${originHubId}->${destinationHubId}`,
      corridorId: corridor.id,
      corridorCode: corridor.code,
      corridorName: corridor.name,
      hasTolls: corridor.hasTolls,
      estimatedTollLkr: corridor.hasTolls ? corridor.defaultTollLkr : 0,
      distanceKm,
      durationMinutes,
      intermediateHubs,
      stops,
    });
  }

  if (matched.length > 0) {
    return matched.sort((a, b) => a.durationMinutes - b.durationMinutes);
  }

  // Fallback direct inter-district route when hubs are on different corridors
  const originHub = getHubById(originHubId);
  const destHub = getHubById(destinationHubId);
  if (!originHub || !destHub) {
    return [];
  }

  const distanceKm = haversineKm(originHub, destHub);
  const durationMinutes = Math.round(distanceKm * 1.45);

  return [
    {
      id: `direct-a-road:${originHubId}->${destinationHubId}`,
      corridorId: 'direct-a-road',
      corridorCode: 'A-Road',
      corridorName: `${originHub.name.en} – ${destHub.name.en} Intercity Highway`,
      hasTolls: false,
      estimatedTollLkr: 0,
      distanceKm,
      durationMinutes,
      intermediateHubs: [],
      stops: [
        {
          hubId: originHubId,
          kmFromOrigin: 0,
          minutesFromOrigin: 0,
          defaultLandmark: originHub.landmarks[0],
        },
        {
          hubId: destinationHubId,
          kmFromOrigin: distanceKm,
          minutesFromOrigin: durationMinutes,
          defaultLandmark: destHub.landmarks[0],
        },
      ],
    },
  ];
}

export function getHubDisplayName(hub: Hub | null | undefined, localeCodeOrLang?: string): string {
  if (!hub) return '';
  const lang = (localeCodeOrLang ? localeCodeOrLang.slice(0, 2) : 'en') as 'en' | 'si' | 'ta' | 'ru';
  return (hub.name as Record<string, string | undefined>)[lang] || hub.name.en || hub.id;
}
