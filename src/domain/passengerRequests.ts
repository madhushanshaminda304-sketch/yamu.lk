/**
 * Passenger Ride Requests & Weekday Commute Domain
 * Enables two-way carpool matching so verified passengers can post seat requests
 * and drivers can fill empty seats with zero hesitation.
 */

export interface PassengerRideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  avatarInitials: string;
  isNicVerified: boolean;
  originHubId: string;
  originName: string;
  destinationHubId: string;
  destinationName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  seatsNeeded: number;
  targetContributionLkr: number;
  settlementPreference: 'lankaqr' | 'cash_lkr';
  pickupLandmark: string;
  specialNotes?: string;
  status: 'open' | 'matched' | 'fulfilled';
  createdAt: string;
  isCommute?: boolean;
}

export const SEEDED_PASSENGER_REQUESTS: readonly PassengerRideRequest[] = [
  {
    id: 'req-nethmi-galle',
    passengerId: 'usr-nethmi',
    passengerName: 'Nethmi Perera',
    passengerPhone: '+94773344556',
    avatarInitials: 'NP',
    isNicVerified: true,
    originHubId: 'makumbura',
    originName: 'Makumbura MMC (Kottawa)',
    destinationHubId: 'galle',
    destinationName: 'Galle (Pinnaduwa Interchange)',
    date: '2026-11-06',
    time: '17:30',
    seatsNeeded: 1,
    targetContributionLkr: 1750,
    settlementPreference: 'lankaqr',
    pickupLandmark: 'MMC Main Departure Concourse Gate 1',
    specialNotes: 'Traveling home for weekend, light backpack only. Willing to scan LankaQR immediately.',
    status: 'open',
    createdAt: '2026-11-03T08:15:00.000Z',
  },
  {
    id: 'req-charith-kandy',
    passengerId: 'usr-charith',
    passengerName: 'Charith Wickramasinghe',
    passengerPhone: '+94714455667',
    avatarInitials: 'CW',
    isNicVerified: true,
    originHubId: 'colombo',
    originName: 'Colombo Fort / Pettah',
    destinationHubId: 'kandy',
    destinationName: 'Kandy Clock Tower',
    date: '2026-11-04',
    time: '07:00',
    seatsNeeded: 1,
    targetContributionLkr: 1850,
    settlementPreference: 'lankaqr',
    pickupLandmark: 'Opposite Lake House / Fort Railway Station',
    specialNotes: 'Morning office assignment in Kandy. Split E04 expressway toll & fuel.',
    status: 'open',
    createdAt: '2026-11-03T09:20:00.000Z',
  },
  {
    id: 'req-dilini-kurunegala',
    passengerId: 'usr-dilini',
    passengerName: 'Dr. Dilini Senanayake',
    passengerPhone: '+94765566778',
    avatarInitials: 'DS',
    isNicVerified: true,
    originHubId: 'kadawatha',
    originName: 'Kadawatha Interchange',
    destinationHubId: 'kurunegala',
    destinationName: 'Kurunegala Interchange',
    date: '2026-11-06',
    time: '16:30',
    seatsNeeded: 2,
    targetContributionLkr: 1200,
    settlementPreference: 'lankaqr',
    pickupLandmark: 'Kadawatha Highway entrance slip road',
    specialNotes: 'Hospital weekend shift. Myself and colleague traveling together.',
    status: 'open',
    createdAt: '2026-11-03T10:05:00.000Z',
  },
  {
    id: 'req-suren-galle',
    passengerId: 'usr-suren',
    passengerName: 'Suren Mendis',
    passengerPhone: '+94726677889',
    avatarInitials: 'SM',
    isNicVerified: true,
    originHubId: 'katunayake',
    originName: 'Katunayake BIA Airport',
    destinationHubId: 'galle',
    destinationName: 'Galle Fort',
    date: '2026-11-07',
    time: '11:30',
    seatsNeeded: 1,
    targetContributionLkr: 2500,
    settlementPreference: 'cash_lkr',
    pickupLandmark: 'Airport Arrivals Gate 2 pickup lane',
    specialNotes: 'Arriving on flight UL 504. One medium suitcase. Through-ticket E03+E02+E01.',
    status: 'open',
    createdAt: '2026-11-03T11:45:00.000Z',
  },
  {
    id: 'req-dinuka-colombo',
    passengerId: 'usr-dinuka',
    passengerName: 'Dinuka Fernando',
    passengerPhone: '+94778899001',
    avatarInitials: 'DF',
    isNicVerified: true,
    originHubId: 'makumbura',
    originName: 'Malabe IT Park / Kottawa',
    destinationHubId: 'colombo',
    destinationName: 'Colombo WTC / Fort',
    date: '2026-11-04',
    time: '08:00',
    seatsNeeded: 1,
    targetContributionLkr: 600,
    settlementPreference: 'lankaqr',
    pickupLandmark: 'SLIIT Malabe Main Entrance',
    specialNotes: 'Mon-Fri daily office commute. Prefer regular carpool buddies.',
    status: 'open',
    createdAt: '2026-11-03T12:00:00.000Z',
    isCommute: true,
  },
];

export function filterPassengerRequests(
  requests: readonly PassengerRideRequest[],
  originHubId?: string | null,
  destinationHubId?: string | null,
  _date?: string | null
): PassengerRideRequest[] {
  if (!originHubId && !destinationHubId) {
    return [...requests];
  }

  const o = originHubId?.toLowerCase().trim();
  const d = destinationHubId?.toLowerCase().trim();

  return requests.filter((r) => {
    const matchOrigin = !o || r.originHubId.toLowerCase() === o || (o === 'colombo' && r.originHubId === 'makumbura');
    const matchDestination = !d || r.destinationHubId.toLowerCase() === d || (d === 'colombo' && r.destinationHubId === 'makumbura');
    return matchOrigin && matchDestination;
  });
}

export function createPassengerRequest(input: {
  passengerId?: string;
  passengerName: string;
  passengerPhone: string;
  isNicVerified?: boolean;
  originHubId: string;
  originName: string;
  destinationHubId: string;
  destinationName: string;
  date: string;
  time: string;
  seatsNeeded: number;
  targetContributionLkr: number;
  settlementPreference?: 'lankaqr' | 'cash_lkr';
  pickupLandmark: string;
  specialNotes?: string;
  isCommute?: boolean;
}): PassengerRideRequest {
  const avatarInitials = input.passengerName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'LK';

  return {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    passengerId: input.passengerId || `usr-${Date.now()}`,
    passengerName: input.passengerName,
    passengerPhone: input.passengerPhone,
    avatarInitials,
    isNicVerified: input.isNicVerified ?? true,
    originHubId: input.originHubId,
    originName: input.originName,
    destinationHubId: input.destinationHubId,
    destinationName: input.destinationName,
    date: input.date,
    time: input.time,
    seatsNeeded: Math.max(1, Math.min(4, input.seatsNeeded)),
    targetContributionLkr: Math.max(200, input.targetContributionLkr),
    settlementPreference: input.settlementPreference ?? 'lankaqr',
    pickupLandmark: input.pickupLandmark,
    specialNotes: input.specialNotes,
    status: 'open',
    createdAt: new Date().toISOString(),
    isCommute: input.isCommute,
  };
}

export interface CommuteCorridorProfile {
  id: string;
  title: string;
  corridorCode: string;
  originHubId: string;
  originName: string;
  destinationHubId: string;
  destinationName: string;
  distanceOneWayKm: number;
  tollOneWayLkr: number;
  isTollFree: boolean;
  highlights: string;
}

export const COMMUTE_CORRIDORS: readonly CommuteCorridorProfile[] = [
  {
    id: 'malabe-colombo',
    title: 'Malabe / Kaduwela ↔ Colombo WTC',
    corridorCode: 'Baseline / Parliament',
    originHubId: 'makumbura',
    originName: 'Malabe IT Hub / SLIIT',
    destinationHubId: 'colombo',
    destinationName: 'Colombo Fort / WTC',
    distanceOneWayKm: 16,
    tollOneWayLkr: 0,
    isTollFree: true,
    highlights: 'Heavy IT park and ministry weekday traffic bypass',
  },
  {
    id: 'negombo-colombo-e03',
    title: 'Negombo / Ja-Ela ↔ Colombo via E03',
    corridorCode: 'E03 Expressway',
    originHubId: 'katunayake',
    originName: 'Ja-Ela / Katunayake Interchange',
    destinationHubId: 'colombo',
    destinationName: 'Peliyagoda / Colombo Fort',
    distanceOneWayKm: 32,
    tollOneWayLkr: 350,
    isTollFree: false,
    highlights: 'Fastest Western coastal expressway corridor into Colombo',
  },
  {
    id: 'moratuwa-colombo',
    title: 'Moratuwa / Panadura ↔ Colombo Galle Road',
    corridorCode: 'Galle Road (A2) / Marine Drive',
    originHubId: 'colombo',
    originName: 'Moratuwa Campus / Panadura',
    destinationHubId: 'colombo',
    destinationName: 'Kollupitiya / Bambalapitiya',
    distanceOneWayKm: 22,
    tollOneWayLkr: 0,
    isTollFree: true,
    highlights: 'Southern Colombo coastal tech & university commute',
  },
  {
    id: 'kandy-peradeniya',
    title: 'Kandy Clock Tower ↔ Peradeniya Campus',
    corridorCode: 'A1 / William Gopallawa Mawatha',
    originHubId: 'kandy',
    originName: 'Kandy Clock Tower',
    destinationHubId: 'peradeniya',
    destinationName: 'University of Peradeniya (Galaha Junc)',
    distanceOneWayKm: 8,
    tollOneWayLkr: 0,
    isTollFree: true,
    highlights: 'Hill Country central university & teaching hospital link',
  },
] as const;

export function calculateWeekdayCommuteSavings(
  corridor: CommuteCorridorProfile,
  daysPerWeek = 5
): {
  weeklySoloCostLkr: number;
  weeklyCarpoolShareLkr: number;
  weeklySavingsLkr: number;
  monthlySavingsLkr: number;
  savingsPercent: number;
} {
  // 2 trips per working day (morning + evening)
  const tripsPerWeek = daysPerWeek * 2;
  const fuelPriceLkr = 424; // Petrol 92
  const kmPerLitre = 14.0;

  const tripFuelCostLkr = Math.round((corridor.distanceOneWayKm / kmPerLitre) * fuelPriceLkr);
  const tripSoloCostLkr = tripFuelCostLkr + corridor.tollOneWayLkr;

  const weeklySoloCostLkr = tripSoloCostLkr * tripsPerWeek;
  // Carpool share split across 3 passengers + 1 driver (4 people total)
  const tripCarpoolShareLkr = Math.round((tripSoloCostLkr / 3) / 50) * 50;
  const weeklyCarpoolShareLkr = tripCarpoolShareLkr * tripsPerWeek;

  const weeklySavingsLkr = Math.max(0, weeklySoloCostLkr - weeklyCarpoolShareLkr);
  const monthlySavingsLkr = weeklySavingsLkr * 4;
  const savingsPercent = Math.round((weeklySavingsLkr / weeklySoloCostLkr) * 100);

  return {
    weeklySoloCostLkr,
    weeklyCarpoolShareLkr,
    weeklySavingsLkr,
    monthlySavingsLkr,
    savingsPercent,
  };
}
