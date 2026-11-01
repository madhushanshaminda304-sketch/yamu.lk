import { findRouteOptions, getHubById } from '../domain/corridors.ts';
import {
  type TollPolicy,
  calculateRecommendedLkr,
  getContributionBounds,
  calculateLegContribution,
} from '../domain/pricing.ts';
import {
  type Ride,
  type RideStop,
  type ComfortProfile,
  type ApprovalMode,
  type VehicleCategory,
  canBookLeg,
  applyLegBooking,
  releaseLegBooking,
} from '../domain/matching.ts';
import {
  type DoubleBlindRating,
  type DrivingSkillLabel,
  validateSriLankaPhone,
  validateSriLankaNic,
  evaluateSuperDriver,
  resolveRatingVisibility,
} from '../domain/trust.ts';
import { inspectChatMessage, type ChatInspectionResult } from '../domain/scamGuard.ts';
import { getColomboDateOffset, type LocaleCode } from '../domain/i18n.ts';

export type SettlementMethod = 'cash_lkr' | 'lankaqr';

export interface BookingRecord {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  fromHubId: string;
  toHubId: string;
  fromIndex: number;
  toIndex: number;
  seats: number;
  unitPriceLkr: number;
  totalPriceLkr: number;
  isBoostLeg: boolean;
  settlementMethod: SettlementMethod;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  createdAt: string;
}

export interface RideAlertSubscription {
  id: string;
  fromHubId: string;
  toHubId: string;
  date: string;
  email: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  nicNumber: string;
  licenceNumber: string;
  verifiedPhone: boolean;
  verifiedNic: boolean;
  verifiedLicence: boolean;
  hasProfilePhoto: boolean;
  bio: string;
  completedRidesLast12Months: number;
  overallRating: number;
  ratingsCount: number;
  drivingSkillScore: number;
  cancellationRatePercent: number;
  avgResponseHours: number;
  defaultVehicle: string;
  comfort: ComfortProfile;
}

export interface PublishRideInput {
  originHubId: string;
  destinationHubId: string;
  corridorId?: string;
  date: string;
  departureTime: string; // HH:mm
  returnDate?: string;
  returnTime?: string;
  pickupLandmark: string;
  dropoffLandmark: string;
  selectedStopoverHubIds: string[];
  boostEnabled: boolean;
  seats: number;
  priceLkr: number;
  tollPolicy: TollPolicy;
  approvalMode: ApprovalMode;
  vehicleMakeModel: string;
  vehicleCategory: VehicleCategory;
  acGuaranteed: boolean;
  comfort: ComfortProfile;
  notes: string;
}

export interface MarketplaceState {
  locale: LocaleCode;
  currentUser: UserProfile;
  rides: Ride[];
  bookings: BookingRecord[];
  rideAlerts: RideAlertSubscription[];
  messages: ChatMessage[];
  ratings: DoubleBlindRating[];
  notifications: AppNotification[];
}

function addMinutesIso(dateStr: string, timeStr: string, minutesToAdd: number): string {
  const base = new Date(`${dateStr}T${timeStr}:00+05:30`);
  const target = new Date(base.getTime() + minutesToAdd * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(target);
  const get = (t: string) => localParts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${pad(Number(get('hour')) % 24)}:${get('minute')}:00+05:30`;
}

export function buildSeededRides(date = getColomboDateOffset(1)): Ride[] {
  const dayAfter = getColomboDateOffset(2);

  return [
    {
      id: 'ride-e01-colombo-matara',
      driverId: 'drv-kasun',
      corridorId: 'e01-southern-expressway',
      corridorCode: 'E01 / E02',
      corridorName: 'Southern Expressway (Tolls)',
      hasTolls: true,
      tollPolicy: 'included',
      estimatedTollLkr: 400,
      originHubId: 'colombo',
      destinationHubId: 'matara',
      departureDate: date,
      departureAt: `${date}T07:00:00+05:30`,
      arrivalAt: `${date}T09:05:00+05:30`,
      totalDistanceKm: 151,
      fullPriceLkr: 3100,
      recommendedPriceLkr: 3200,
      totalSeats: 3,
      segmentSeatsAvailable: [3, 3, 2, 2, 2],
      stops: [
        {
          hubId: 'colombo',
          stopIndex: 0,
          arrivalAt: `${date}T07:00:00+05:30`,
          departureAt: `${date}T07:00:00+05:30`,
          kmFromOrigin: 0,
          priceFromOriginLkr: 0,
          pickupLandmark: 'Fort Railway Station Main Entrance',
        },
        {
          hubId: 'makumbura',
          stopIndex: 1,
          arrivalAt: `${date}T07:25:00+05:30`,
          departureAt: `${date}T07:28:00+05:30`,
          kmFromOrigin: 18,
          priceFromOriginLkr: 450,
          pickupLandmark: 'Makumbura Multimodal Center (E01 Bay)',
        },
        {
          hubId: 'dodangoda',
          stopIndex: 2,
          arrivalAt: `${date}T07:50:00+05:30`,
          departureAt: `${date}T07:53:00+05:30`,
          kmFromOrigin: 52,
          priceFromOriginLkr: 1100,
          pickupLandmark: 'Dodangoda Expressway Interchange',
          isBoostStop: true,
        },
        {
          hubId: 'kurundugahahetekma',
          stopIndex: 3,
          arrivalAt: `${date}T08:15:00+05:30`,
          departureAt: `${date}T08:18:00+05:30`,
          kmFromOrigin: 85,
          priceFromOriginLkr: 1750,
          pickupLandmark: 'Kurundugahahetekma E01 Interchange',
          isBoostStop: true,
        },
        {
          hubId: 'galle',
          stopIndex: 4,
          arrivalAt: `${date}T08:35:00+05:30`,
          departureAt: `${date}T08:40:00+05:30`,
          kmFromOrigin: 116,
          priceFromOriginLkr: 2400,
          pickupLandmark: 'Pinnaduwa E01 Interchange',
        },
        {
          hubId: 'matara',
          stopIndex: 5,
          arrivalAt: `${date}T09:05:00+05:30`,
          departureAt: `${date}T09:05:00+05:30`,
          kmFromOrigin: 151,
          priceFromOriginLkr: 3100,
          pickupLandmark: 'Godagama E01 Interchange',
        },
      ],
      approvalMode: 'instant',
      boostEnabled: true,
      vehicle: {
        makeModel: 'Toyota Prius 4th Gen Hybrid · Pearl White',
        category: 'car',
        plateHint: 'WP CAA-84xx',
        acGuaranteed: true,
      },
      comfort: {
        chattiness: 'blabla',
        maxTwoInBack: true,
        luggage: 'medium',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      driver: {
        id: 'drv-kasun',
        name: 'Kasun Perera',
        rating: 4.92,
        ratingsCount: 64,
        drivingSkillScore: 2.95,
        completedRides: 48,
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: true,
        isSuperDriver: true,
        responseHours: 0.4,
        bio: 'Senior software architect commuting between Colombo and Matara via E01 every week.',
      },
      notes: 'Expressway tolls included in seat contribution. Can pick up at Fort or Makumbura MMC bay.',
      status: 'published',
    },
    {
      id: 'ride-a2-colombo-galle',
      driverId: 'drv-nimali',
      corridorId: 'a2-coastal-highway',
      corridorCode: 'A2',
      corridorName: 'Galle Road Coastal Highway (No Tolls)',
      hasTolls: false,
      tollPolicy: 'no_tolls',
      estimatedTollLkr: 0,
      originHubId: 'colombo',
      destinationHubId: 'galle',
      departureDate: date,
      departureAt: `${date}T06:30:00+05:30`,
      arrivalAt: `${date}T09:30:00+05:30`,
      totalDistanceKm: 119,
      fullPriceLkr: 1950,
      recommendedPriceLkr: 2400,
      totalSeats: 2,
      segmentSeatsAvailable: [2, 2, 2, 2, 2],
      stops: [
        {
          hubId: 'colombo',
          stopIndex: 0,
          arrivalAt: `${date}T06:30:00+05:30`,
          departureAt: `${date}T06:30:00+05:30`,
          kmFromOrigin: 0,
          priceFromOriginLkr: 0,
          pickupLandmark: 'Bambalapitiya Majestic City',
        },
        {
          hubId: 'moratuwa',
          stopIndex: 1,
          arrivalAt: `${date}T07:10:00+05:30`,
          departureAt: `${date}T07:12:00+05:30`,
          kmFromOrigin: 21,
          priceFromOriginLkr: 400,
          pickupLandmark: 'Panadura Clock Tower',
          isBoostStop: true,
        },
        {
          hubId: 'kalutara',
          stopIndex: 2,
          arrivalAt: `${date}T07:45:00+05:30`,
          departureAt: `${date}T07:48:00+05:30`,
          kmFromOrigin: 44,
          priceFromOriginLkr: 750,
          pickupLandmark: 'Kalutara Bodhiya Main Road',
        },
        {
          hubId: 'bentota',
          stopIndex: 3,
          arrivalAt: `${date}T08:15:00+05:30`,
          departureAt: `${date}T08:18:00+05:30`,
          kmFromOrigin: 65,
          priceFromOriginLkr: 1100,
          pickupLandmark: 'Aluthgama Bus Stand',
          isBoostStop: true,
        },
        {
          hubId: 'hikkaduwa',
          stopIndex: 4,
          arrivalAt: `${date}T09:00:00+05:30`,
          departureAt: `${date}T09:02:00+05:30`,
          kmFromOrigin: 98,
          priceFromOriginLkr: 1600,
          pickupLandmark: 'Hikkaduwa Railway Station',
        },
        {
          hubId: 'galle',
          stopIndex: 5,
          arrivalAt: `${date}T09:30:00+05:30`,
          departureAt: `${date}T09:30:00+05:30`,
          kmFromOrigin: 119,
          priceFromOriginLkr: 1950,
          pickupLandmark: 'Galle Fort Main Gate / Clock Tower',
        },
      ],
      approvalMode: 'manual',
      boostEnabled: true,
      vehicle: {
        makeModel: 'Suzuki WagonR Stingray Hybrid · Silver',
        category: 'car',
        plateHint: 'WP CBA-19xx',
        acGuaranteed: true,
      },
      comfort: {
        chattiness: 'bla',
        maxTwoInBack: true,
        luggage: 'small',
        music: 'maybe',
        pets: 'no',
        smoking: 'no',
        womenOnly: true,
      },
      driver: {
        id: 'drv-nimali',
        name: 'Dr. Nimali Fernando',
        rating: 4.96,
        ratingsCount: 39,
        drivingSkillScore: 2.98,
        completedRides: 31,
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: true,
        isSuperDriver: true,
        responseHours: 0.8,
        bio: 'Medical registrar travelling along the coastal A2 road to Karapitiya. Ladies-only comfort ride.',
      },
      notes: 'Scenic coastal drive with no expressway tolls. Women-only ride.',
      status: 'published',
    },
    {
      id: 'ride-e04-colombo-kandy-ella',
      driverId: 'drv-dilan',
      corridorId: 'e04-central-kandy',
      corridorCode: 'E04 / A1',
      corridorName: 'Central Expressway via Mirigama & Kurunegala (Tolls)',
      hasTolls: true,
      tollPolicy: 'included',
      estimatedTollLkr: 300,
      originHubId: 'colombo',
      destinationHubId: 'ella',
      departureDate: date,
      departureAt: `${date}T06:00:00+05:30`,
      arrivalAt: `${date}T11:50:00+05:30`,
      totalDistanceKm: 268,
      fullPriceLkr: 5100,
      recommendedPriceLkr: 5500,
      totalSeats: 3,
      segmentSeatsAvailable: [3, 3, 2, 2, 2, 3],
      stops: [
        {
          hubId: 'colombo',
          stopIndex: 0,
          arrivalAt: `${date}T06:00:00+05:30`,
          departureAt: `${date}T06:00:00+05:30`,
          kmFromOrigin: 0,
          priceFromOriginLkr: 0,
          pickupLandmark: 'Independence Square Arcade',
        },
        {
          hubId: 'kadawatha',
          stopIndex: 1,
          arrivalAt: `${date}T06:22:00+05:30`,
          departureAt: `${date}T06:25:00+05:30`,
          kmFromOrigin: 16,
          priceFromOriginLkr: 350,
          pickupLandmark: 'Kadawatha Expressway Bus Stand',
        },
        {
          hubId: 'mirigama',
          stopIndex: 2,
          arrivalAt: `${date}T06:50:00+05:30`,
          departureAt: `${date}T06:53:00+05:30`,
          kmFromOrigin: 54,
          priceFromOriginLkr: 1050,
          pickupLandmark: 'Mirigama Central Expressway Entrance',
          isBoostStop: true,
        },
        {
          hubId: 'kurunegala',
          stopIndex: 3,
          arrivalAt: `${date}T07:20:00+05:30`,
          departureAt: `${date}T07:25:00+05:30`,
          kmFromOrigin: 94,
          priceFromOriginLkr: 1850,
          pickupLandmark: 'Kurunegala E04 Expressway Exit',
        },
        {
          hubId: 'kandy',
          stopIndex: 4,
          arrivalAt: `${date}T08:25:00+05:30`,
          departureAt: `${date}T08:40:00+05:30`,
          kmFromOrigin: 136,
          priceFromOriginLkr: 2600,
          pickupLandmark: 'Kandy City Centre (KCC) Main Entrance',
        },
        {
          hubId: 'nuwara_eliya',
          stopIndex: 5,
          arrivalAt: `${date}T10:25:00+05:30`,
          departureAt: `${date}T10:35:00+05:30`,
          kmFromOrigin: 212,
          priceFromOriginLkr: 4050,
          pickupLandmark: 'Nuwara Eliya Red Post Office',
          isBoostStop: true,
        },
        {
          hubId: 'ella',
          stopIndex: 6,
          arrivalAt: `${date}T11:50:00+05:30`,
          departureAt: `${date}T11:50:00+05:30`,
          kmFromOrigin: 268,
          priceFromOriginLkr: 5100,
          pickupLandmark: 'Ella Railway Station Junction',
        },
      ],
      approvalMode: 'instant',
      boostEnabled: true,
      vehicle: {
        makeModel: 'Toyota Raize Turbo SUV · Metallic Grey',
        category: 'suv',
        plateHint: 'CP CBJ-51xx',
        acGuaranteed: true,
      },
      comfort: {
        chattiness: 'blablabla',
        maxTwoInBack: true,
        luggage: 'large',
        music: 'yes',
        pets: 'maybe',
        smoking: 'no',
        womenOnly: false,
      },
      driver: {
        id: 'drv-dilan',
        name: 'Dilan Jayawardena',
        rating: 4.88,
        ratingsCount: 52,
        drivingSkillScore: 2.91,
        completedRides: 36,
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: true,
        isSuperDriver: true,
        responseHours: 0.6,
        bio: 'Tea plantation consultant driving Colombo → Kandy → Nuwara Eliya → Ella.',
      },
      notes: 'Taking Central Expressway E04 via Kurunegala to Kandy, then Ramboda pass with a 15-min tea break.',
      status: 'published',
    },
    {
      id: 'ride-a1-colombo-kandy',
      driverId: 'drv-suresh',
      corridorId: 'a1-kandy-hill-country',
      corridorCode: 'A1 / A5',
      corridorName: 'Colombo–Kandy–Hill Country Highway (No Tolls)',
      hasTolls: false,
      tollPolicy: 'no_tolls',
      estimatedTollLkr: 0,
      originHubId: 'colombo',
      destinationHubId: 'kandy',
      departureDate: date,
      departureAt: `${date}T14:30:00+05:30`,
      arrivalAt: `${date}T17:30:00+05:30`,
      totalDistanceKm: 116,
      fullPriceLkr: 2100,
      recommendedPriceLkr: 2300,
      totalSeats: 3,
      segmentSeatsAvailable: [3, 3, 3, 3, 3],
      stops: [
        {
          hubId: 'colombo',
          stopIndex: 0,
          arrivalAt: `${date}T14:30:00+05:30`,
          departureAt: `${date}T14:30:00+05:30`,
          kmFromOrigin: 0,
          priceFromOriginLkr: 0,
          pickupLandmark: 'Fort Railway Station Main Entrance',
        },
        {
          hubId: 'kadawatha',
          stopIndex: 1,
          arrivalAt: `${date}T14:55:00+05:30`,
          departureAt: `${date}T14:58:00+05:30`,
          kmFromOrigin: 16,
          priceFromOriginLkr: 300,
          pickupLandmark: 'Kadawatha Expressway Bus Stand',
        },
        {
          hubId: 'kegalle',
          stopIndex: 2,
          arrivalAt: `${date}T16:25:00+05:30`,
          departureAt: `${date}T16:28:00+05:30`,
          kmFromOrigin: 78,
          priceFromOriginLkr: 1400,
          pickupLandmark: 'Kegalle Clock Tower (A1)',
          isBoostStop: true,
        },
        {
          hubId: 'mawanella',
          stopIndex: 3,
          arrivalAt: `${date}T16:45:00+05:30`,
          departureAt: `${date}T16:47:00+05:30`,
          kmFromOrigin: 91,
          priceFromOriginLkr: 1650,
          pickupLandmark: 'Mawanella Town Bus Stand',
          isBoostStop: true,
        },
        {
          hubId: 'peradeniya',
          stopIndex: 4,
          arrivalAt: `${date}T17:15:00+05:30`,
          departureAt: `${date}T17:18:00+05:30`,
          kmFromOrigin: 110,
          priceFromOriginLkr: 1950,
          pickupLandmark: 'University of Peradeniya Galaha Junction',
        },
        {
          hubId: 'kandy',
          stopIndex: 5,
          arrivalAt: `${date}T17:30:00+05:30`,
          departureAt: `${date}T17:30:00+05:30`,
          kmFromOrigin: 116,
          priceFromOriginLkr: 2100,
          pickupLandmark: 'Kandy City Centre (KCC) Main Entrance',
        },
      ],
      approvalMode: 'manual',
      boostEnabled: true,
      vehicle: {
        makeModel: 'Toyota Aqua G-Sports · Dark Blue',
        category: 'car',
        plateHint: 'WP CAE-30xx',
        acGuaranteed: true,
      },
      comfort: {
        chattiness: 'blabla',
        maxTwoInBack: false,
        luggage: 'medium',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      driver: {
        id: 'drv-suresh',
        name: 'Suresh Ravindran',
        rating: 4.79,
        ratingsCount: 21,
        drivingSkillScore: 2.86,
        completedRides: 14,
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: true,
        isSuperDriver: true,
        responseHours: 1.5,
        bio: 'University lecturer driving Colombo to Peradeniya/Kandy via A1.',
      },
      notes: 'Convenient drop-off at Peradeniya Campus or Kandy KCC.',
      status: 'published',
    },
    {
      id: 'ride-a9-colombo-jaffna',
      driverId: 'drv-karthik',
      corridorId: 'e03-airport-northern-a9',
      corridorCode: 'E03 / A9',
      corridorName: 'Airport Expressway + A9 Northern Corridor (Tolls)',
      hasTolls: true,
      tollPolicy: 'included',
      estimatedTollLkr: 350,
      originHubId: 'colombo',
      destinationHubId: 'jaffna',
      departureDate: dayAfter,
      departureAt: `${dayAfter}T05:00:00+05:30`,
      arrivalAt: `${dayAfter}T12:40:00+05:30`,
      totalDistanceKm: 418,
      fullPriceLkr: 7900,
      recommendedPriceLkr: 8550,
      totalSeats: 4,
      segmentSeatsAvailable: [4, 4, 3, 3, 3, 4],
      stops: [
        {
          hubId: 'colombo',
          stopIndex: 0,
          arrivalAt: `${dayAfter}T05:00:00+05:30`,
          departureAt: `${dayAfter}T05:00:00+05:30`,
          kmFromOrigin: 0,
          priceFromOriginLkr: 0,
          pickupLandmark: 'Wellawatte Savoy / Galle Road',
        },
        {
          hubId: 'katunayake',
          stopIndex: 1,
          arrivalAt: `${dayAfter}T05:30:00+05:30`,
          departureAt: `${dayAfter}T05:35:00+05:30`,
          kmFromOrigin: 32,
          priceFromOriginLkr: 650,
          pickupLandmark: 'Bandaranaike International Airport Arrivals',
        },
        {
          hubId: 'kurunegala',
          stopIndex: 2,
          arrivalAt: `${dayAfter}T07:00:00+05:30`,
          departureAt: `${dayAfter}T07:15:00+05:30`,
          kmFromOrigin: 108,
          priceFromOriginLkr: 2050,
          pickupLandmark: 'Kurunegala Central Bus Stand / Clock Tower',
          isBoostStop: true,
        },
        {
          hubId: 'dambulla',
          stopIndex: 3,
          arrivalAt: `${dayAfter}T08:00:00+05:30`,
          departureAt: `${dayAfter}T08:05:00+05:30`,
          kmFromOrigin: 162,
          priceFromOriginLkr: 3050,
          pickupLandmark: 'Dambulla Economic Centre / Clock Tower',
          isBoostStop: true,
        },
        {
          hubId: 'anuradhapura',
          stopIndex: 4,
          arrivalAt: `${dayAfter}T09:10:00+05:30`,
          departureAt: `${dayAfter}T09:20:00+05:30`,
          kmFromOrigin: 226,
          priceFromOriginLkr: 4250,
          pickupLandmark: 'Anuradhapura New Town Bus Stand',
        },
        {
          hubId: 'vavuniya',
          stopIndex: 5,
          arrivalAt: `${dayAfter}T10:10:00+05:30`,
          departureAt: `${dayAfter}T10:15:00+05:30`,
          kmFromOrigin: 280,
          priceFromOriginLkr: 5300,
          pickupLandmark: 'Vavuniya A9 Horowpothana Junction',
          isBoostStop: true,
        },
        {
          hubId: 'jaffna',
          stopIndex: 6,
          arrivalAt: `${dayAfter}T12:40:00+05:30`,
          departureAt: `${dayAfter}T12:40:00+05:30`,
          kmFromOrigin: 418,
          priceFromOriginLkr: 7900,
          pickupLandmark: 'Nallur Kandaswamy Kovil Entrance',
        },
      ],
      approvalMode: 'instant',
      boostEnabled: true,
      vehicle: {
        makeModel: 'Toyota HiAce KDH Super GL · Dual AC Van',
        category: 'van',
        plateHint: 'NP NB-77xx',
        acGuaranteed: true,
      },
      comfort: {
        chattiness: 'blabla',
        maxTwoInBack: true,
        luggage: 'large',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      driver: {
        id: 'drv-karthik',
        name: 'Karthik Sivakumar',
        rating: 4.94,
        ratingsCount: 83,
        drivingSkillScore: 2.97,
        completedRides: 62,
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: true,
        isSuperDriver: true,
        responseHours: 0.3,
        bio: 'Regular Colombo–Anuradhapura–Jaffna A9 family van commuter. Dual AC & plenty of luggage space.',
      },
      notes: 'Early morning departure via Katunayake E03 and A9. Breakfast stop in Anuradhapura.',
      status: 'published',
    },
  ];
}

export function createInitialState(): MarketplaceState {
  const tomorrow = getColomboDateOffset(1);
  return {
    locale: 'en-LK',
    currentUser: {
      id: 'usr-traveller-1',
      name: 'ashan Jayawardena',
      email: 'ashan.j@lanka.lk',
      phone: '+94772345678',
      nicNumber: '199614502341',
      licenceNumber: 'B3498210',
      verifiedPhone: true,
      verifiedNic: true,
      verifiedLicence: true,
      hasProfilePhoto: true,
      bio: 'Frequent traveller between Colombo, Kandy, and Galle. Always on time!',
      completedRidesLast12Months: 6,
      overallRating: 4.88,
      ratingsCount: 14,
      drivingSkillScore: 2.9,
      cancellationRatePercent: 0,
      avgResponseHours: 0.7,
      defaultVehicle: 'Honda Civic RS · Sonic Grey',
      comfort: {
        chattiness: 'blabla',
        maxTwoInBack: true,
        luggage: 'medium',
        music: 'yes',
        pets: 'maybe',
        smoking: 'no',
        womenOnly: false,
      },
    },
    rides: buildSeededRides(tomorrow),
    bookings: [],
    rideAlerts: [],
    messages: [],
    ratings: [],
    notifications: [
      {
        id: 'notif-welcome',
        title: 'Welcome to BlaBlaLanka (Sri Lanka Edition)',
        body: 'Your Sri Lankan NIC and +94 mobile number are verified. You hold Super Driver status.',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function createMarketplaceStore(initialState?: MarketplaceState) {
  let state: MarketplaceState = initialState ?? createInitialState();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getState(): MarketplaceState {
      return state;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setLocale(locale: LocaleCode): void {
      state = { ...state, locale };
      notify();
    },

    publishRide(input: PublishRideInput): Ride {
      const routeOptions = findRouteOptions(input.originHubId, input.destinationHubId);
      const selectedRoute =
        routeOptions.find((r) => r.corridorId === input.corridorId) ?? routeOptions[0];

      if (!selectedRoute) {
        throw new Error('Could not compute a valid Sri Lankan corridor between these hubs.');
      }

      const recommendedLkr = calculateRecommendedLkr(
        selectedRoute.distanceKm,
        input.tollPolicy,
        selectedRoute.estimatedTollLkr
      );
      const bounds = getContributionBounds(recommendedLkr);
      const clampedPriceLkr = Math.min(bounds.maxLkr, Math.max(bounds.minLkr, input.priceLkr));

      const filteredRouteStops = selectedRoute.stops.filter((s, idx, arr) => {
        if (idx === 0 || idx === arr.length - 1) return true;
        return input.selectedStopoverHubIds.includes(s.hubId) || input.boostEnabled;
      });

      const stops: RideStop[] = filteredRouteStops.map((s, idx, arr) => {
        const isFirst = idx === 0;
        const isLast = idx === arr.length - 1;
        const arrivalIso = addMinutesIso(input.date, input.departureTime, s.minutesFromOrigin);
        const departureIso =
          isFirst || isLast
            ? arrivalIso
            : addMinutesIso(input.date, input.departureTime, s.minutesFromOrigin + 4);
        const priceFromOriginLkr = isFirst
          ? 0
          : isLast
            ? clampedPriceLkr
            : calculateLegContribution(clampedPriceLkr, selectedRoute.distanceKm, s.kmFromOrigin);

        return {
          hubId: s.hubId,
          stopIndex: idx,
          arrivalAt: arrivalIso,
          departureAt: departureIso,
          kmFromOrigin: s.kmFromOrigin,
          priceFromOriginLkr,
          pickupLandmark: isFirst
            ? input.pickupLandmark || s.defaultLandmark
            : isLast
              ? input.dropoffLandmark || s.defaultLandmark
              : s.defaultLandmark,
          isBoostStop: !isFirst && !isLast && !input.selectedStopoverHubIds.includes(s.hubId),
        };
      });

      const superStatus = evaluateSuperDriver({
        verifiedPhone: state.currentUser.verifiedPhone,
        verifiedNic: state.currentUser.verifiedNic,
        verifiedLicence: state.currentUser.verifiedLicence,
        hasProfilePhoto: state.currentUser.hasProfilePhoto,
        completedRidesLast12Months: state.currentUser.completedRidesLast12Months,
        overallRating: state.currentUser.overallRating,
        drivingSkillScore: state.currentUser.drivingSkillScore,
        cancellationRatePercent: state.currentUser.cancellationRatePercent,
        avgResponseHours: state.currentUser.avgResponseHours,
      });

      const newRide: Ride = {
        id: `ride-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        driverId: state.currentUser.id,
        corridorId: selectedRoute.corridorId,
        corridorCode: selectedRoute.corridorCode,
        corridorName: selectedRoute.corridorName,
        hasTolls: selectedRoute.hasTolls,
        tollPolicy: input.tollPolicy,
        estimatedTollLkr: selectedRoute.estimatedTollLkr,
        originHubId: input.originHubId,
        destinationHubId: input.destinationHubId,
        departureDate: input.date,
        departureAt: stops[0].departureAt,
        arrivalAt: stops[stops.length - 1].arrivalAt,
        totalDistanceKm: selectedRoute.distanceKm,
        fullPriceLkr: clampedPriceLkr,
        recommendedPriceLkr: recommendedLkr,
        totalSeats: input.seats,
        segmentSeatsAvailable: Array.from({ length: stops.length - 1 }, () => input.seats),
        stops,
        approvalMode: input.approvalMode,
        boostEnabled: input.boostEnabled,
        vehicle: {
          makeModel: input.vehicleMakeModel || state.currentUser.defaultVehicle,
          category: input.vehicleCategory,
          plateHint: 'WP CBX-92xx',
          acGuaranteed: input.acGuaranteed,
        },
        comfort: input.comfort,
        driver: {
          id: state.currentUser.id,
          name: state.currentUser.name,
          rating: state.currentUser.overallRating,
          ratingsCount: state.currentUser.ratingsCount,
          drivingSkillScore: state.currentUser.drivingSkillScore,
          completedRides: state.currentUser.completedRidesLast12Months,
          verifiedPhone: state.currentUser.verifiedPhone,
          verifiedNic: state.currentUser.verifiedNic,
          verifiedLicence: state.currentUser.verifiedLicence,
          isSuperDriver: superStatus.isSuperDriver,
          responseHours: state.currentUser.avgResponseHours,
          bio: state.currentUser.bio,
        },
        notes: input.notes,
        status: 'published',
      };

      // Check if any RideAlert matches any leg on this newly published ride
      const triggeredNotifications: AppNotification[] = [];
      for (const alert of state.rideAlerts) {
        if (alert.date === input.date) {
          const legCheck = canBookLeg(newRide, alert.fromHubId, alert.toHubId, 1);
          if (legCheck.allowed) {
            const fromName = getHubById(alert.fromHubId)?.name.en ?? alert.fromHubId;
            const toName = getHubById(alert.toHubId)?.name.en ?? alert.toHubId;
            triggeredNotifications.push({
              id: `notif-alert-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              title: `Ride Alert Matched: ${fromName} → ${toName}`,
              body: `A new ride with ${newRide.driver.name} on ${input.date} matches your alert (${alert.email}).`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      state = {
        ...state,
        rides: [newRide, ...state.rides],
        notifications: [...triggeredNotifications, ...state.notifications],
      };
      notify();
      return newRide;
    },

    bookRideLeg(input: {
      rideId: string;
      fromHubId: string;
      toHubId: string;
      seats: number;
      settlementMethod: SettlementMethod;
      message: string;
    }): BookingRecord {
      const ride = state.rides.find((r) => r.id === input.rideId);
      if (!ride) {
        throw new Error('Ride not found.');
      }

      const check = canBookLeg(ride, input.fromHubId, input.toHubId, input.seats);
      if (!check.allowed) {
        throw new Error(check.reason ?? 'Cannot book this ride leg.');
      }

      const isInstant = ride.approvalMode === 'instant';
      const nextRide = isInstant
        ? applyLegBooking(ride, check.fromIndex, check.toIndex, input.seats)
        : ride;

      const booking: BookingRecord = {
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        rideId: ride.id,
        passengerId: state.currentUser.id,
        passengerName: state.currentUser.name,
        passengerPhone: state.currentUser.phone,
        fromHubId: input.fromHubId,
        toHubId: input.toHubId,
        fromIndex: check.fromIndex,
        toIndex: check.toIndex,
        seats: input.seats,
        unitPriceLkr: check.legPriceLkr,
        totalPriceLkr: check.legPriceLkr * input.seats,
        isBoostLeg: check.isBoostLeg,
        settlementMethod: input.settlementMethod,
        status: isInstant ? 'accepted' : 'pending',
        message: input.message.trim(),
        createdAt: new Date().toISOString(),
      };

      const initialMessages: ChatMessage[] = booking.message
        ? [
            {
              id: `msg-${Date.now()}`,
              bookingId: booking.id,
              senderId: state.currentUser.id,
              senderName: state.currentUser.name,
              text: booking.message,
              createdAt: new Date().toISOString(),
            },
          ]
        : [];

      const fromName = getHubById(input.fromHubId)?.name.en ?? input.fromHubId;
      const toName = getHubById(input.toHubId)?.name.en ?? input.toHubId;

      const newNotif: AppNotification = {
        id: `notif-bk-${Date.now()}`,
        title: isInstant
          ? `Instant Booking Confirmed: ${fromName} → ${toName}`
          : `Request Sent: ${fromName} → ${toName}`,
        body: isInstant
          ? `${input.seats} seat(s) reserved with ${ride.driver.name}. Settle LKR ${booking.totalPriceLkr.toLocaleString()} onboard via ${input.settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash'}.`
          : `Awaiting approval from ${ride.driver.name} (typical response < ${ride.driver.responseHours}h).`,
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        rides: state.rides.map((r) => (r.id === ride.id ? nextRide : r)),
        bookings: [booking, ...state.bookings],
        messages: [...state.messages, ...initialMessages],
        notifications: [newNotif, ...state.notifications],
      };
      notify();
      return booking;
    },

    respondToBooking(bookingId: string, accept: boolean): BookingRecord {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found.');
      if (booking.status !== 'pending') return booking;

      const ride = state.rides.find((r) => r.id === booking.rideId);
      if (!ride) throw new Error('Ride not found.');

      let nextRide = ride;
      let nextStatus: BookingRecord['status'] = 'declined';

      if (accept) {
        nextRide = applyLegBooking(ride, booking.fromIndex, booking.toIndex, booking.seats);
        nextStatus = 'accepted';
      }

      const updatedBooking: BookingRecord = {
        ...booking,
        status: nextStatus,
      };

      state = {
        ...state,
        rides: state.rides.map((r) => (r.id === ride.id ? nextRide : r)),
        bookings: state.bookings.map((b) => (b.id === bookingId ? updatedBooking : b)),
      };
      notify();
      return updatedBooking;
    },

    cancelBooking(bookingId: string): BookingRecord {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found.');
      if (booking.status === 'cancelled' || booking.status === 'declined') return booking;

      const ride = state.rides.find((r) => r.id === booking.rideId);
      const nextRide =
        ride && booking.status === 'accepted'
          ? releaseLegBooking(ride, booking.fromIndex, booking.toIndex, booking.seats)
          : ride;

      const updatedBooking: BookingRecord = {
        ...booking,
        status: 'cancelled',
      };

      state = {
        ...state,
        rides: nextRide ? state.rides.map((r) => (r.id === nextRide.id ? nextRide : r)) : state.rides,
        bookings: state.bookings.map((b) => (b.id === bookingId ? updatedBooking : b)),
      };
      notify();
      return updatedBooking;
    },

    createRideAlert(input: {
      fromHubId: string;
      toHubId: string;
      date: string;
      email: string;
    }): RideAlertSubscription {
      const alert: RideAlertSubscription = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fromHubId: input.fromHubId,
        toHubId: input.toHubId,
        date: input.date,
        email: input.email.trim(),
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        rideAlerts: [alert, ...state.rideAlerts],
      };
      notify();
      return alert;
    },

    sendMessage(bookingId: string, text: string): ChatInspectionResult {
      const inspection = inspectChatMessage(text);
      if (!inspection.allowed) {
        return inspection;
      }

      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        bookingId,
        senderId: state.currentUser.id,
        senderName: state.currentUser.name,
        text: inspection.sanitizedText,
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        messages: [...state.messages, msg],
      };
      notify();
      return inspection;
    },

    submitDoubleBlindRating(input: {
      bookingId: string;
      fromUserId: string;
      toUserId: string;
      stars: number;
      drivingSkill?: DrivingSkillLabel;
      comment: string;
    }): DoubleBlindRating {
      const booking = state.bookings.find((b) => b.id === input.bookingId);
      const ride = booking ? state.rides.find((r) => r.id === booking.rideId) : undefined;

      const rating: DoubleBlindRating = {
        id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        bookingId: input.bookingId,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        stars: Math.min(5, Math.max(1, input.stars)),
        drivingSkill: input.drivingSkill,
        comment: input.comment.trim(),
        createdAt: new Date().toISOString(),
        tripArrivalAt: ride?.arrivalAt ?? new Date().toISOString(),
      };

      state = {
        ...state,
        ratings: [...state.ratings, rating],
      };
      notify();
      return rating;
    },

    getVisibleRatingsForBooking(
      bookingId: string,
      nowIso = new Date().toISOString()
    ): DoubleBlindRating[] {
      const bookingRatings = state.ratings.filter((r) => r.bookingId === bookingId);
      const uniqueRaters = new Set(bookingRatings.map((r) => r.fromUserId));
      const bothRated = uniqueRaters.size >= 2;

      return bookingRatings.filter((r) => resolveRatingVisibility(r, bothRated, nowIso));
    },

    updateUserVerification(input: {
      name: string;
      phone: string;
      nicNumber: string;
      licenceNumber: string;
      defaultVehicle: string;
      bio: string;
      comfort: ComfortProfile;
    }): { ok: boolean; error?: string } {
      if (!validateSriLankaPhone(input.phone)) {
        return { ok: false, error: 'Enter a valid Sri Lankan mobile number (+947XXXXXXXX).' };
      }
      const nicCheck = validateSriLankaNic(input.nicNumber);
      if (!nicCheck.valid) {
        return {
          ok: false,
          error: 'Enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).',
        };
      }

      state = {
        ...state,
        currentUser: {
          ...state.currentUser,
          name: input.name.trim(),
          phone: input.phone.trim(),
          nicNumber: input.nicNumber.trim().toUpperCase(),
          licenceNumber: input.licenceNumber.trim().toUpperCase(),
          defaultVehicle: input.defaultVehicle.trim(),
          bio: input.bio.trim(),
          verifiedPhone: true,
          verifiedNic: true,
          verifiedLicence: input.licenceNumber.trim().length >= 5,
          comfort: input.comfort,
        },
      };
      notify();
      return { ok: true };
    },
  };
}
