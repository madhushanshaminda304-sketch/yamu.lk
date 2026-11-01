import React, { useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';

export function ProfileView({
  state,
  store,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
}) {
  const user = state.currentUser;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [nicNumber, setNicNumber] = useState(user.nicNumber);
  const [licenceNumber, setLicenceNumber] = useState(user.licenceNumber);
  const [defaultVehicle, setDefaultVehicle] = useState(user.defaultVehicle);
  const [bio, setBio] = useState(user.bio);
  const [comfort] = useState(user.comfort);

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
      toast.success('Profile and Sri Lankan Verification details updated successfully!');
    } else {
      toast.error(res.error || 'Update failed.');
    }
  };

  return (
    <div className="shell-narrow" style={{ padding: '36px 0 80px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)', marginBottom: '8px' }}>
        Profile & Sri Lankan Verification Hub
      </h1>
      <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
        Verified profiles build trust in the Sri Lankan carpooling community. Verify your National Identity Card (NIC) and mobile number to unlock higher booking confidence and Super Driver status.
      </p>

      {/* Super Driver Checklist Box */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Star size={20} color="#f57f17" weight="fill" />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f57f17' }}>Super Driver Qualification Status</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#795548', marginBottom: '14px' }}>
          Super Drivers respond in under 3 hours, maintain a 4.7+ rating, a 2.8+ driving score, and have verified identity documents.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div style={{ color: user.verifiedPhone && user.verifiedNic ? '#2e7d32' : '#c62828' }}>
            {user.verifiedPhone && user.verifiedNic ? '✓' : '✗'} Verified NIC & +94 Phone
          </div>
          <div style={{ color: user.overallRating >= 4.7 ? '#2e7d32' : '#c62828' }}>
            {user.overallRating >= 4.7 ? '✓' : '✗'} 4.7+ Rating ({user.overallRating.toFixed(2)})
          </div>
          <div style={{ color: user.drivingSkillScore >= 2.8 ? '#2e7d32' : '#c62828' }}>
            {user.drivingSkillScore >= 2.8 ? '✓' : '✗'} 2.8+ Driving Skill ({user.drivingSkillScore.toFixed(2)})
          </div>
          <div style={{ color: user.cancellationRatePercent < 5 ? '#2e7d32' : '#c62828' }}>
            {user.cancellationRatePercent < 5 ? '✓' : '✗'} Low Cancellation ({user.cancellationRatePercent}%)
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="profile-name" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Full Name</label>
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
            <label htmlFor="profile-phone" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Sri Lankan Mobile Number (+94 7X XXX XXXX)
            </label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="profile-nic" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Sri Lankan NIC (9-digit V/X or 12-digit)
              </label>
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
              <label htmlFor="profile-licence" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Driving Licence Number (for drivers)
              </label>
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
            <label htmlFor="profile-vehicle" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Default Vehicle</label>
            <input
              id="profile-vehicle"
              type="text"
              value={defaultVehicle}
              onChange={(e) => setDefaultVehicle(e.target.value)}
              placeholder="e.g. Honda Civic RS · Grey"
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label htmlFor="profile-bio" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Bio & Traveller Summary</label>
            <textarea
              id="profile-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other community members what makes you good company."
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '16px' }}>
            Save Profile & Verification Details
          </button>
        </form>
      </div>
    </div>
  );
}
