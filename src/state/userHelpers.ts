import type { UserProfile, TrustedContact, SavedPlace } from './types.ts';
import type { ComfortProfile } from '../domain/matching.ts';

export function createDefaultUserProfile(params: {
  id: string;
  name: string;
  phone: string;
  nicNumber: string;
  isNicValid: boolean;
}): UserProfile {
  return {
    id: params.id,
    name: params.name.trim(),
    email: '',
    phone: params.phone,
    nicNumber: params.nicNumber,
    licenceNumber: '',
    verifiedPhone: true,
    verifiedNic: params.isNicValid,
    verifiedLicence: false,
    hasProfilePhoto: false,
    bio: 'Commuter on Yamo.',
    completedRidesLast12Months: 0,
    overallRating: 5.0,
    ratingsCount: 0,
    drivingSkillScore: 3.0,
    cancellationRatePercent: 0,
    avgResponseHours: 1.0,
    defaultVehicle: '',
    comfort: {
      chattiness: 'blabla',
      maxTwoInBack: true,
      luggage: 'medium',
      music: 'yes',
      pets: 'no',
      smoking: 'no',
      womenOnly: false,
    },
    trustedContacts: [],
    savedPlaces: [],
  };
}

export function buildUpdatedUserProfile(
  currentUser: UserProfile,
  input: {
    name: string;
    phone: string;
    nicNumber: string;
    licenceNumber: string;
    defaultVehicle: string;
    bio: string;
    comfort: ComfortProfile;
  }
): UserProfile {
  return {
    ...currentUser,
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
  };
}

export function addContactToUser(user: UserProfile, contact: TrustedContact): UserProfile {
  const existing = user.trustedContacts || [];
  const filtered = existing.filter((c) => c.id !== contact.id);
  return {
    ...user,
    trustedContacts: [...filtered, contact],
  };
}

export function removeContactFromUser(user: UserProfile, contactId: string): UserProfile {
  return {
    ...user,
    trustedContacts: (user.trustedContacts || []).filter((c) => c.id !== contactId),
  };
}

export function savePlaceToUser(user: UserProfile, place: SavedPlace): UserProfile {
  const existing = user.savedPlaces || [];
  const filtered = existing.filter((p) => p.id !== place.id);
  return {
    ...user,
    savedPlaces: [...filtered, place],
  };
}

export function removePlaceFromUser(user: UserProfile, placeId: string): UserProfile {
  return {
    ...user,
    savedPlaces: (user.savedPlaces || []).filter((p) => p.id !== placeId),
  };
}

export function applyUserUpdate(
  registeredUsers: Record<string, UserProfile>,
  updatedUser: UserProfile
): {
  currentUser: UserProfile;
  registeredUsers: Record<string, UserProfile>;
} {
  return {
    currentUser: updatedUser,
    registeredUsers: {
      ...registeredUsers,
      [updatedUser.phone]: updatedUser,
    },
  };
}
