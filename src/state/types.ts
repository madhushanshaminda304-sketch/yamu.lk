import type { Ride, ComfortProfile, VehicleCategory, ApprovalMode } from '../domain/matching.ts';
import type { TollPolicy } from '../domain/pricing.ts';
import type { DoubleBlindRating } from '../domain/trust.ts';
import type { LocaleCode } from '../domain/i18n.ts';
import type { OtpChallenge } from '../domain/auth.ts';

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
  currentUser: UserProfile | null;
  registeredUsers: Record<string, UserProfile>;
  activeOtpChallenge: OtpChallenge | null;
  rides: Ride[];
  bookings: BookingRecord[];
  rideAlerts: RideAlertSubscription[];
  messages: ChatMessage[];
  ratings: DoubleBlindRating[];
  notifications: AppNotification[];
}

export const SEEDED_USERS: Record<string, UserProfile> = {
  '+94772345678': {
    id: 'usr-ashan',
    name: 'Ashan Jayawardena',
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
  '+94719876543': {
    id: 'usr-kavindi',
    name: 'Kavindi Perera',
    email: 'kavindi.p@gmail.com',
    phone: '+94719876543',
    nicNumber: '199854301290',
    licenceNumber: '',
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: false,
    hasProfilePhoto: true,
    bio: 'University commuter between Peradeniya and Colombo on weekends.',
    completedRidesLast12Months: 3,
    overallRating: 5.0,
    ratingsCount: 5,
    drivingSkillScore: 3.0,
    cancellationRatePercent: 0,
    avgResponseHours: 1.2,
    defaultVehicle: '',
    comfort: {
      chattiness: 'blabla',
      maxTwoInBack: true,
      luggage: 'medium',
      music: 'yes',
      pets: 'no',
      smoking: 'no',
      womenOnly: true,
    },
  },
};
