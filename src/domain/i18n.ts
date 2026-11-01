export type LocaleCode = 'en-LK' | 'si-LK' | 'ta-LK';

const DICTIONARY: Record<LocaleCode, Record<string, string>> = {
  'en-LK': {
    'brand.tagline': 'Travel anywhere in Sri Lanka together. Spend smarter.',
    'nav.search': 'Search',
    'nav.publish': 'Offer a ride',
    'nav.rides': 'Your rides',
    'nav.profile': 'Profile & Trust',
    'hero.title': 'Your pick of rides at low LKR cost-sharing prices',
    'hero.subtitle': 'From Southern Expressway E01 to Kandy, Ella, and Jaffna — share empty seats with Verified Profiles.',
    'search.from': 'Leaving from',
    'search.to': 'Going to',
    'search.when': 'Departure date',
    'search.seats': 'Passengers',
    'search.cta': 'Search',
    'usp.1.title': 'Your pick of rides at low prices',
    'usp.1.body': 'No matter where you’re going in Sri Lanka, by expressway or scenic A-road, find the ideal shared ride and split fuel & tolls fairly.',
    'usp.2.title': 'Trust who you travel with',
    'usp.2.body': 'We verify Sri Lankan NICs, Driving Licences, and +94 mobile numbers. Check Super Driver badges, ratings, and BlaBla chattiness before you book.',
    'usp.3.title': 'Scroll, click, tap and go!',
    'usp.3.body': 'Book an Instant Booking seat in seconds or set a Ride Alert for upcoming trips. Settle onboard in Cash (LKR) or LankaQR.',
    'scam.banner': 'To avoid scams, never visit links sent by members to pay or transfer money. Pay your driver directly in Cash (LKR) or LankaQR when you meet.',
    'tag.cheapest': 'Cheapest',
    'tag.earliest': 'Earliest',
    'tag.fastest': 'Fastest',
    'tag.boost': 'Boost Stopover',
    'tag.cheapest_and_earliest': 'Cheapest & Earliest',
    'filter.title': 'Sort & Filter',
    'filter.instant': 'Instant Booking only',
    'filter.super_driver': 'Super Drivers only',
    'filter.verified': 'Government ID Verified only',
    'filter.max_two_back': 'Max 2 in back seat',
    'filter.women_only': 'Women Only',
    'filter.ac': 'AC Guaranteed',
    'filter.pets': 'Pets allowed',
    'alert.cta': 'Create a ride alert',
    'booking.instant': 'Instant Booking',
    'booking.manual': 'Request to Book',
    'settlement.cash': 'Cash (LKR) onboard',
    'settlement.lankaqr': 'LankaQR onboard',
    'trust.super_driver': 'Super Driver',
    'trust.verified_id': 'Government ID Verified',
  },
  'si-LK': {
    'brand.tagline': 'ශ්‍රී ලංකාව පුරා එකට ගමන් කරන්න. වියදම බෙදාගන්න.',
    'nav.search': 'ගමනක් සොයන්න',
    'nav.publish': 'ආසනයක් පිරිනමන්න',
    'nav.rides': 'මගේ ගමන්',
    'nav.profile': 'ගිණුම සහ විශ්වාසය',
    'hero.title': 'අඩුම LKR පිරිවැය හවුල් මිලකට ඔබේ ගමන තෝරාගන්න',
    'hero.subtitle': 'දක්ෂිණ අධිවේගී මාර්ගයේ (E01) සිට මහනුවර, ඇල්ල සහ යාපනය දක්වා තහවුරු කළ රියදුරන් සමඟ ආරක්ෂිතව ගමන් කරන්න.',
    'search.from': 'පිටත් වන ස්ථානය',
    'search.to': 'ගමනාන්තය',
    'search.when': 'දිනය',
    'search.seats': 'මගීන් ගණන',
    'search.cta': 'සොයන්න',
    'usp.1.title': 'අඩු වියදමකින් පහසු ගමනක්',
    'usp.1.body': 'අධිවේගී මාර්ගයේ හෝ සාමාන්‍ය මාර්ගයේ ඉන්ධන සහ ගාස්තු සාධාරණව බෙදාගන්න.',
    'usp.2.title': 'විශ්වාසවන්ත ගමන් සගයන්',
    'usp.2.body': 'ජාතික හැඳුනුම්පත (NIC), රියදුරු බලපත්‍රය සහ +94 දුරකථන අංක තහවුරු කර ඇත. Super Driver ලාංඡන පරීක්ෂා කරන්න.',
    'usp.3.title': 'පහසුවෙන් වෙන්කරවා ගන්න!',
    'usp.3.body': 'ක්ෂණිකව ආසනයක් වෙන්කරවා ගන්න (Instant Booking). ගමනේදී මුදලින් (LKR) හෝ LankaQR මගින් ගෙවන්න.',
    'scam.banner': 'වංචාවලින් ආරක්ෂා වීමට, මුදල් ගෙවීම සඳහා එවන බාහිර සබැඳි (Links) භාවිතා නොකරන්න. ගමනේදී රියදුරුට සෘජුවම ගෙවන්න.',
    'tag.cheapest': 'අඩුම මිල',
    'tag.earliest': 'කලින්ම පිටත්වන',
    'tag.fastest': 'වේගවත්ම',
    'tag.boost': 'අතරමැදි නැවතුම (Boost)',
    'tag.cheapest_and_earliest': 'අඩුම මිල සහ කලින්ම පිටත්වන',
    'filter.title': 'තෝරන්න සහ පෙරහන් කරන්න',
    'filter.instant': 'ක්ෂණික වෙන්කිරීම් පමණි',
    'filter.super_driver': 'සුපිරි රියදුරන් පමණි',
    'filter.verified': 'හැඳුනුම්පත තහවුරු කළ අය පමණි',
    'filter.max_two_back': 'පසුපස අසුනේ උපරිම 2 පමණි',
    'filter.women_only': 'කාන්තාවන්ට පමණි',
    'filter.ac': 'වායුසමනය (AC) සහිත',
    'filter.pets': 'සුරතල් සතුන් රැගෙන යා හැක',
    'alert.cta': 'ගමන් දැනුම්දීමක් සාදන්න',
    'booking.instant': 'ක්ෂණික වෙන්කිරීම (Instant)',
    'booking.manual': 'අනුමැතිය ඉල්ලන්න (Request)',
    'settlement.cash': 'ගමනේදී මුදලින් (LKR)',
    'settlement.lankaqr': 'ගමනේදී LankaQR මගින්',
    'trust.super_driver': 'සුපිරි රියදුරු (Super Driver)',
    'trust.verified_id': 'රජයේ හැඳුනුම්පත තහවුරුයි',
  },
  'ta-LK': {
    'brand.tagline': 'இலங்கை முழுவதும் ஒன்றாகப் பயணம் செய்யுங்கள். செலவைப் பகிர்ந்து கொள்ளுங்கள்.',
    'nav.search': 'தேடுக',
    'nav.publish': 'பயணத்தை வழங்குக',
    'nav.rides': 'எனது பயணங்கள்',
    'nav.profile': 'சுயவிவரம்',
    'hero.title': 'குறைந்த LKR செலவுப் பகிர்வில் உங்கள் பயணத்தைத் தேர்ந்தெடுக்கவும்',
    'hero.subtitle': 'தெற்கு அதிவேக நெடுஞ்சாலை (E01) முதல் கண்டி, எல்ல மற்றும் யாழ்ப்பாணம் வரை சரிபார்க்கப்பட்ட ஓட்டுநர்களுடன் பயணம் செய்யுங்கள்.',
    'search.from': 'புறப்படும் இடம்',
    'search.to': 'செல்லும் இடம்',
    'search.when': 'திகதி',
    'search.seats': 'பயணிகள்',
    'search.cta': 'தேடு',
    'usp.1.title': 'குறைந்த செலவில் சிறந்த பயணம்',
    'usp.1.body': 'எரிபொருள் மற்றும் அதிவேக நெடுஞ்சாலை கட்டணங்களை நியாயமாகப் பகிர்ந்து கொள்ளுங்கள்.',
    'usp.2.title': 'நம்பிக்கையான பயண உறுப்பினர்கள்',
    'usp.2.body': 'இலங்கை தேசிய அடையாள அட்டை (NIC), சாரதி அனுமதிப்பத்திரம் மற்றும் +94 தொலைபேசி எண் சரிபார்க்கப்பட்டது.',
    'usp.3.title': 'உடனடி முன்பதிவு!',
    'usp.3.body': 'Instant Booking மூலம் உடனடியாக இருக்கையை முன்பதிவு செய்யுங்கள். பயணத்தின் போது பணம் (LKR) அல்லது LankaQR மூலம் செலுத்துங்கள்.',
    'scam.banner': 'மோசடிகளைத் தவிர்க்க, பணம் செலுத்த அனுப்பப்படும் இணைப்புகளைத் (Links) திறக்க வேண்டாம். ஓட்டுநரிடம் நேரில் செலுத்துங்கள்.',
    'tag.cheapest': 'குறைந்த விலை',
    'tag.earliest': 'முதல் பயணம்',
    'tag.fastest': 'வேகமானது',
    'tag.boost': 'இடைநிறுத்தம் (Boost)',
    'tag.cheapest_and_earliest': 'குறைந்த விலை & முதல் பயணம்',
    'filter.title': 'வடிகட்டுக',
    'filter.instant': 'உடனடி முன்பதிவு மட்டும்',
    'filter.super_driver': 'சிறந்த ஓட்டுநர்கள் மட்டும்',
    'filter.verified': 'அடையாள அட்டை சரிபார்க்கப்பட்டது மட்டும்',
    'filter.max_two_back': 'பின் இருக்கையில் அதிகபட்சம் 2',
    'filter.women_only': 'பெண்களுக்கு மட்டும்',
    'filter.ac': 'ஏசி வசதி உண்டு',
    'filter.pets': 'செல்லப்பிராணிகள் அனுமதிக்கப்படும்',
    'alert.cta': 'பயண அறிவிப்பை உருவாக்குக',
    'booking.instant': 'உடனடி முன்பதிவு (Instant)',
    'booking.manual': 'கோரிக்கை அனுப்புக (Request)',
    'settlement.cash': 'பயணத்தில் ரொக்கம் (LKR)',
    'settlement.lankaqr': 'பயணத்தில் LankaQR',
    'trust.super_driver': 'சிறந்த ஓட்டுநர் (Super Driver)',
    'trust.verified_id': 'அடையாள அட்டை சரிபார்க்கப்பட்டது',
  },
};

export function t(locale: LocaleCode, key: string): string {
  return DICTIONARY[locale]?.[key] ?? DICTIONARY['en-LK'][key] ?? key;
}

export function formatLkr(amount: number): string {
  return 'LKR ' + Math.round(amount).toLocaleString('en-US');
}

export function formatColomboTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
}

export function formatColomboDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoString));
}

export function getColomboDateOffset(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
