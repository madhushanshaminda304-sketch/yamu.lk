import { useUiText } from '../components/useUiText.ts';
import React, { useState } from 'react';
import {
  Star,
  UserCheck,
  SignOut,
  House,
  Briefcase,
  GraduationCap,
  MapPin,
  Trash,
  Plus,
  ShieldCheck,
  WhatsappLogo,
  PhoneCall,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ALL_HUBS, getHubById, getHubDisplayName } from '../domain/corridors.ts';
import { validateSriLankaPhone } from '../domain/trust.ts';
import type { ComfortProfile } from '../domain/matching.ts';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';

export function ProfileView({
  state,
  store,
  openAuthModal,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
}) {
  const { tr, uiLocale } = useUiText();
  const user = state.currentUser;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nicNumber, setNicNumber] = useState(user?.nicNumber || '');
  const [licenceNumber, setLicenceNumber] = useState(user?.licenceNumber || '');
  const [defaultVehicle, setDefaultVehicle] = useState(user?.defaultVehicle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [comfort] = useState<ComfortProfile>(user?.comfort || {
    chattiness: 'blabla',
    maxTwoInBack: true,
    luggage: 'medium',
    music: 'yes',
    pets: 'no',
    smoking: 'no',
    womenOnly: false,
  });

  // Saved commute places state
  const [placeLabel, setPlaceLabel] = useState<'home' | 'work' | 'university' | 'other'>('home');
  const [placeTitle, setPlaceTitle] = useState('Home');
  const [placeHubId, setPlaceHubId] = useState('colombo');
  const [placeLandmark, setPlaceLandmark] = useState('');

  // Emergency trusted contacts state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Family');

  if (!user) {
    return (
      <div className="shell-narrow" style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="auth-icon-badge" style={{ marginBottom: '16px' }}>
          <UserCheck size={28} color="var(--bbc-blue)" weight="fill" />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)' }}>{tr("Sign In to Yamo")}</h2>
        <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px', maxWidth: '480px', margin: '8px auto 28px' }}>{tr("Sign in with your Sri Lankan mobile number to access your verified profile, Super Driver rating, and identity credentials.")}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => openAuthModal?.()}
          style={{ padding: '14px 32px', fontSize: '16px' }}
        >{tr("Sign In with Mobile OTP")}</button>
      </div>
    );
  }

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeHubId) {
      toast.error(tr("Select a valid hub."));
      return;
    }
    const defaultName = placeLabel === 'home' ? 'Home' : placeLabel === 'work' ? 'Work' : placeLabel === 'university' ? 'Campus' : 'Place';
    const title = placeTitle.trim() || defaultName;
    store.saveFavoritePlace({
      id: `sp-${Date.now()}`,
      label: placeLabel,
      title,
      hubId: placeHubId,
      landmark: placeLandmark.trim(),
    });
    setPlaceLandmark('');
    toast.success(tr("Saved \"{0}\" to your commute shortcuts!", { "0": title }));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if ((user.trustedContacts?.length ?? 0) >= 2) {
      toast.error(tr("You can save up to 2 emergency trusted contacts."));
      return;
    }
    if (!contactName.trim()) {
      toast.error(tr("Enter contact name."));
      return;
    }
    if (!validateSriLankaPhone(contactPhone)) {
      toast.error(tr("Enter a valid Sri Lankan mobile number (+947XXXXXXXX)."));
      return;
    }
    store.addTrustedContact({
      id: `tc-${Date.now()}`,
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRel.trim() || 'Family',
    });
    setContactName('');
    setContactPhone('');
    setContactRel('Family');
    toast.success(tr("Added {0} as trusted SOS contact!", { "0": contactName.trim() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.updateUserVerification({
      name,
      phone,
      nicNumber,
      licenceNumber,
      defaultVehicle,
      bio,
      comfort,
    });
    if (res.ok) {
      toast.success(tr("Profile and Sri Lankan Verification details updated successfully!"));
    } else {
      toast.error(tr(res.error || tr("Update failed.")));
    }
  };

  return (
    <div className="shell-narrow" style={{ padding: '20px 0 88px' }}>
      <h1 style={{ fontSize: 'clamp(22px, 6vw, 26px)', fontWeight: 800, color: 'var(--bbc-navy)', marginBottom: '8px' }}>{tr("Profile & Sri Lankan Verification Hub")}</h1>
      <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '14.5px', lineHeight: 1.5, marginBottom: '20px' }}>{tr("Verified profiles build trust in the Sri Lankan carpooling community. Verify your National Identity Card (NIC) and mobile number to unlock higher booking confidence and Super Driver status.")}</p>

      {/* Super Driver Checklist Box */}
      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '16px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Star size={20} color="#f59e0b" weight="fill" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#b45309', margin: 0 }}>{tr("Super Driver Qualification Status")}</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#78350f', marginBottom: '12px', lineHeight: 1.4 }}>{tr("Super Drivers respond in under 3 hours, maintain a 4.7+ rating, a 2.8+ driving score, and have verified identity documents.")}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '8px', fontSize: '13px' }}>
          <div style={{ color: user.verifiedPhone && user.verifiedNic ? '#047857' : '#dc2626', fontWeight: 600 }}>
            {user.verifiedPhone && user.verifiedNic ? '✓' : '✗'}{tr("Verified NIC & +94 Phone")}</div>
          <div style={{ color: user.overallRating >= 4.7 ? '#047857' : '#dc2626', fontWeight: 600 }}>
            {user.overallRating >= 4.7 ? '✓' : '✗'} {tr("4.7+ Rating (")}{user.overallRating.toFixed(2)})
          </div>
          <div style={{ color: user.drivingSkillScore >= 2.8 ? '#047857' : '#dc2626', fontWeight: 600 }}>
            {user.drivingSkillScore >= 2.8 ? '✓' : '✗'} {tr("2.8+ Driving Skill (")}{user.drivingSkillScore.toFixed(2)})
          </div>
          <div style={{ color: user.cancellationRatePercent < 5 ? '#047857' : '#dc2626', fontWeight: 600 }}>
            {user.cancellationRatePercent < 5 ? '✓' : '✗'} {tr("Low Cancellation (")}{user.cancellationRatePercent}%)
          </div>
        </div>
      </div>

      <div className="publish-wizard-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="profile-name" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Full Name")}</label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label htmlFor="profile-phone" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Sri Lankan Mobile Number (+94 7X XXX XXXX)")}</label>
            <input
              id="profile-phone"
              type="text"
              required
              placeholder="+94771234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div className="form-choice-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="profile-nic" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Sri Lankan NIC (9-digit V/X or 12-digit)")}</label>
              <input
                id="profile-nic"
                type="text"
                required
                placeholder="199614502341 or 921451234V"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label htmlFor="profile-licence" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Driving Licence Number (for drivers)")}</label>
              <input
                id="profile-licence"
                type="text"
                placeholder="e.g. B1234567"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-vehicle" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Default Vehicle")}</label>
            <input
              id="profile-vehicle"
              type="text"
              value={defaultVehicle}
              onChange={(e) => setDefaultVehicle(e.target.value)}
              placeholder={tr("e.g. Honda Civic RS · Grey")}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label htmlFor="profile-bio" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{tr("Bio & Traveller Summary")}</label>
            <textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={tr("Tell other community members what makes you good company.")}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '16px' }}>{tr("Save Profile & Verification Details")}</button>

          <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '20px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                store.logout();
                toast.info(tr("You have signed out of your account."));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                background: '#fff',
                border: '1px solid #ffcdd2',
                color: '#c62828',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <SignOut size={16} weight="bold" />
              <span>{tr("Sign Out")}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Saved Commute Places Card */}
      <div className="publish-wizard-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <MapPin size={22} color="var(--bbc-blue)" weight="duotone" />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>{tr("Saved Commute Shortcuts")}</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>{tr("Save your regular travel destinations (Home, Work, Campus) for 1-tap booking from the home screen.")}</p>

        {user.savedPlaces && user.savedPlaces.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {user.savedPlaces.map((place) => {
              const hub = getHubById(place.hubId);
              const hubName = getHubDisplayName(hub, uiLocale) || place.hubId;
              return (
                <div
                  key={place.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--bbc-border)',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {place.label === 'home' ? <House size={18} weight="bold" /> :
                       place.label === 'work' ? <Briefcase size={18} weight="bold" /> :
                       place.label === 'university' ? <GraduationCap size={18} weight="bold" /> :
                       <MapPin size={18} weight="bold" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--bbc-navy)' }}>
                        {place.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)' }}>
                        {hubName}{place.landmark ? ` · ${place.landmark}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.removeFavoritePlace(place.id)}
                    aria-label={tr("Remove {0}", { "0": place.title })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>{tr("No saved commute shortcuts yet. Add your regular home or work hub below.")}</p>
        )}

        <form onSubmit={handleAddPlace} style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{tr("Add a New Commute Place")}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Category")}</label>
              <select
                value={placeLabel}
                onChange={(e) => {
                  const lbl = e.target.value as any;
                  setPlaceLabel(lbl);
                  if (lbl === 'home') setPlaceTitle(tr("Home"));
                  else if (lbl === 'work') setPlaceTitle(tr("Work"));
                  else if (lbl === 'university') setPlaceTitle(tr("Campus"));
                }}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="home">{tr("🏠 Home")}</option>
                <option value="work">{tr("🏢 Work")}</option>
                <option value="university">{tr("🎓 Campus")}</option>
                <option value="other">{tr("📍 Other")}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Custom Title")}</label>
              <input
                type="text"
                value={placeTitle}
                onChange={(e) => setPlaceTitle(e.target.value)}
                placeholder={tr("e.g. Peradeniya")}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Destination Hub")}</label>
              <select
                value={placeHubId}
                onChange={(e) => setPlaceHubId(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
              >
                {ALL_HUBS.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {getHubDisplayName(hub, uiLocale)} ({hub.district})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={placeLandmark}
              onChange={(e) => setPlaceLandmark(e.target.value)}
              placeholder={tr("Landmark (e.g. Clock Tower, Gate 2, Station)")}
              style={{ flex: 1, padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} weight="bold" />
              <span>{tr("Save Place")}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Trusted Contacts Card */}
      <div className="publish-wizard-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={22} color="#047857" weight="duotone" />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>{tr("Emergency Trusted Contacts (SOS)")}</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>{tr("Save up to 2 trusted contacts. During active journeys, 1-tap WhatsApp SOS will immediately dispatch your verified vehicle details, driver name, and boarding PIN.")}</p>

        {user.trustedContacts && user.trustedContacts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {user.trustedContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--bbc-border)',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--bbc-navy)' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)' }}>
                    {contact.relationship} · {contact.phone}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => store.removeTrustedContact(contact.id)}
                  aria-label={tr("Remove {0}", { "0": contact.name })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>{tr("No trusted emergency contacts added yet.")}</p>
        )}

        {(user.trustedContacts?.length ?? 0) < 2 ? (
          <form onSubmit={handleAddContact} style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{tr("Add Trusted Contact")}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Name")}</label>
                <input
                  type="text"
                  required
                  placeholder={tr("e.g. Amma")}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Mobile (+94...)")}</label>
                <input
                  type="text"
                  required
                  placeholder="+947XXXXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', display: 'block', marginBottom: '4px' }}>{tr("Relationship")}</label>
                <input
                  type="text"
                  placeholder={tr("e.g. Mother, Sister")}
                  value={contactRel}
                  onChange={(e) => setContactRel(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={14} weight="bold" />
              <span>{tr("Add Emergency Contact")}</span>
            </button>
          </form>
        ) : (
          <div style={{ fontSize: '12px', color: '#047857', background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>{tr("Maximum 2 trusted emergency contacts registered. Remove one to add another.")}</div>
        )}
      </div>
    </div>
  );
}
