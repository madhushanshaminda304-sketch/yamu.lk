import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GasPump,
  Coins,
  Users,
  Car,
  Lightning,
  TrendUp,
  Leaf,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import {
  CALCULATOR_CORRIDORS,
  FUEL_TYPE_META,
  calculateCarpoolImpact,
  type FuelTypeId,
  type TripFrequency,
} from '../utils/sriLankaTollAndFuel.ts';
import { formatLkr, getColomboDateOffset } from '../domain/i18n.ts';
import { triggerHaptic } from '../native/haptics.ts';

export function FuelAndTollCalculator() {
  const navigate = useNavigate();
  const tomorrow = getColomboDateOffset(1);

  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('makumbura-galle');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelTypeId>('petrol92');
  const [emptySeats, setEmptySeats] = useState<number>(2);
  const [frequency, setFrequency] = useState<TripFrequency>('daily_commute');

  const impact = calculateCarpoolImpact({
    corridorId: selectedCorridorId,
    fuelType: selectedFuelType,
    emptySeatsShared: emptySeats,
    frequency,
  });

  const handleSelectCorridor = (id: string) => {
    triggerHaptic('selection');
    setSelectedCorridorId(id);
  };

  const handleSelectFuel = (fuel: FuelTypeId) => {
    triggerHaptic('selection');
    setSelectedFuelType(fuel);
  };

  const handleSelectSeats = (seats: number) => {
    triggerHaptic('selection');
    setEmptySeats(seats);
  };

  const handleSelectFrequency = (freq: TripFrequency) => {
    triggerHaptic('selection');
    setFrequency(freq);
  };

  return (
    <section className="shell" style={{ margin: '36px auto 44px' }}>
      <div
        className="calculator-container"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
          border: '1.5px solid #d1fae5',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.08), 0 8px 10px -6px rgba(4, 120, 87, 0.04)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #a7f3d0', marginBottom: '8px' }}>
              <GasPump size={16} weight="fill" color="#047857" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Live Sri Lanka Fuel & Toll Math
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#064e3b', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
              Split the Toll & Fuel Calculator
            </h2>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0, maxWidth: '640px' }}>
              Official November 2026 retail fuel rates (Petrol 92: LKR 424/L, Auto Diesel: LKR 397/L) + gazetted RDA expressway point-to-point tolls. Calculate per-seat savings in real time.
            </p>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', color: '#64748b' }}>
            <ShieldCheck size={16} weight="fill" color="#047857" />
            <span>Non-profit carpooling cap</span>
          </div>
        </div>

        {/* Controls Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
          {/* Corridor Selection Pills */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              1. Choose Highway Corridor
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CALCULATOR_CORRIDORS.map((c) => {
                const isSelected = c.id === selectedCorridorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCorridor(c.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? '#047857' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '1.5px solid #047857' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(4, 120, 87, 0.2)' : 'none',
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontSize: '11px', opacity: 0.85, background: isSelected ? 'rgba(255,255,255,0.22)' : '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                      {c.routeCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of Fuel, Seats, and Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {/* Fuel Type */}
            <div>
              <label htmlFor="calculator-fuel-select" style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                2. Fuel Type
              </label>
              <select
                id="calculator-fuel-select"
                value={selectedFuelType}
                onChange={(e) => handleSelectFuel(e.target.value as FuelTypeId)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                <option value="petrol92">Petrol 92 — LKR 424 / L</option>
                <option value="petrol95">Petrol 95 — LKR 490 / L</option>
                <option value="autoDiesel">Auto Diesel — LKR 397 / L</option>
                <option value="superDiesel">Super Diesel — LKR 543 / L</option>
                <option value="hybrid">Hybrid / EV — ~22 km/L equivalent</option>
              </select>
            </div>

            {/* Empty Seats */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                3. Empty Seats Shared
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3].map((num) => {
                  const isSelected = emptySeats === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectSeats(num)}
                      style={{
                        flex: 1,
                        padding: '9px 6px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: isSelected ? '1.5px solid #047857' : '1px solid #cbd5e1',
                        background: isSelected ? '#047857' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                4. Trip Frequency
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'one_way', label: '1-Way' },
                  { id: 'weekend_return', label: 'Weekend' },
                  { id: 'daily_commute', label: 'Daily (20d)' },
                ].map((item) => {
                  const isSelected = frequency === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectFrequency(item.id as TripFrequency)}
                      style={{
                        flex: 1,
                        padding: '9px 4px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: isSelected ? '1.5px solid #047857' : '1px solid #cbd5e1',
                        background: isSelected ? '#047857' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Live Impact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {/* Card 1: Solo vs Per-Seat Share */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fair Cost-Split / Seat
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                Save {impact.savingsPercent}%
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#064e3b', marginBottom: '4px' }}>
              {formatLkr(impact.perSeatShareLkr)}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}> / seat</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              <strong>Solo Drive:</strong> {formatLkr(impact.soloCostLkr)} ({formatLkr(impact.fuelCostLkr)} fuel + {impact.tollLkr > 0 ? `${formatLkr(impact.tollLkr)} toll` : 'toll-free'})
            </div>
          </div>

          {/* Card 2: Driver Monthly Fuel Saved */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #bae6fd',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Driver Monthly Fuel Saved
              </span>
              <TrendUp size={16} weight="bold" color="#0284c7" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0369a1', marginBottom: '4px' }}>
              {formatLkr(impact.monthlyDriverSavingsLkr)}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                {frequency === 'one_way' ? ' (1 trip)' : ' / month'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Regular commuter saves <strong>{formatLkr(impact.annualDriverSavingsLkr)} / year</strong> by sharing {impact.seatsShared} empty seats.
            </div>
          </div>

          {/* Card 3: Traffic & Green Impact */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Highway Bottleneck Impact
              </span>
              <Leaf size={16} weight="fill" color="#16a34a" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#92400e', marginBottom: '4px' }}>
              {impact.carsRemoved} Cars Off
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}> expressway</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              <strong>{impact.monthlyFuelLitresSaved} Litres</strong> imported fuel saved • <strong>{impact.monthlyCo2KgSaved} kg CO₂</strong> cut monthly.
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid #d1fae5' }}>
          <div style={{ fontSize: '13px', color: '#064e3b', fontWeight: 600 }}>
            {impact.corridor.name} ({impact.distanceKm} km · {impact.corridor.expresswayName})
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                triggerHaptic('selection');
                navigate(`/search?from=${impact.corridor.originHubId}&to=${impact.corridor.destinationHubId}&date=${tomorrow}`);
              }}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Find Rides on this Route →
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                triggerHaptic('selection');
                navigate('/publish');
              }}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Offer a Seat & Split Costs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FuelAndTollCalculator;
