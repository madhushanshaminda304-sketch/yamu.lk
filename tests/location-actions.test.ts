import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { t, DICTIONARY, type LocaleCode } from '../src/domain/i18n.ts';
import { resolveUserLocationToHub } from '../src/native/geolocation.ts';
import { ALL_HUBS } from '../src/domain/corridors.ts';

describe('Location Actions & Geolocation Integration', () => {
  it('has trilingual location dictionary entries', () => {
    const requiredKeys = [
      'location.use_my_location',
      'location.locating',
      'location.located',
      'location.denied',
    ];
    const locales: LocaleCode[] = ['en-LK', 'si-LK', 'ta-LK'];

    for (const locale of locales) {
      for (const key of requiredKeys) {
        const val = t(locale, key);
        assert.ok(val && val !== key, `Missing or untranslated key "${key}" for locale ${locale}`);
      }
    }

    assert.equal(t('en-LK', 'location.use_my_location'), 'Use my location');
    assert.equal(t('si-LK', 'location.use_my_location'), 'මගේ ස්ථානය ගන්න');
    assert.equal(t('ta-LK', 'location.use_my_location'), 'எனது இருப்பிடம்');

    assert.equal(t('en-LK', 'location.locating'), 'Locating nearest hub...');
    assert.equal(t('si-LK', 'location.locating'), 'ළඟම මධ්‍යස්ථානය සොයමින්...');
    assert.equal(t('ta-LK', 'location.locating'), 'அருகிலுள்ள நிலையத்தைத் தேடுகிறது...');

    assert.equal(t('en-LK', 'location.located'), 'Nearest hub located: ');
    assert.equal(t('si-LK', 'location.located'), 'ළඟම මධ්‍යස්ථානය: ');
    assert.equal(t('ta-LK', 'location.located'), 'அருகிலுள்ள நிலையம்: ');

    assert.equal(t('en-LK', 'location.denied'), 'Location permission denied or unavailable');
    assert.equal(t('si-LK', 'location.denied'), 'ස්ථාන අවසරය ලබාගත නොහැක');
    assert.equal(t('ta-LK', 'location.denied'), 'இருப்பிட அனுமதி மறுக்கப்பட்டது');
  });

  describe('resolveUserLocationToHub', () => {
    it('resolves coordinates near Kottawa/Maharagama to Makumbura hub ID and formatted name', () => {
      // 6.8400° N, 79.9700° E
      const resEn = resolveUserLocationToHub({ latitude: 6.8400, longitude: 79.9700 }, 'en-LK');
      assert.equal(resEn.hubId, 'makumbura');
      assert.equal(resEn.hubName, 'Makumbura (Kottawa MMC)');
      assert.ok(resEn.distanceKm < 5);

      const resSi = resolveUserLocationToHub({ latitude: 6.8400, longitude: 79.9700 }, 'si-LK');
      assert.equal(resSi.hubId, 'makumbura');
      assert.equal(resSi.hubName, 'මාකුඹුර බහුවිධ ප්‍රවාහන මධ්‍යස්ථානය');

      const resTa = resolveUserLocationToHub({ latitude: 6.8400, longitude: 79.9700 }, 'ta-LK');
      assert.equal(resTa.hubId, 'makumbura');
      assert.equal(resTa.hubName, 'மாகும்புர போக்குவரத்து நிலையம்');
    });

    it('resolves coordinates near Kandy to Kandy Hub', () => {
      const res = resolveUserLocationToHub({ latitude: 7.2910, longitude: 80.6330 }, 'en-LK');
      assert.equal(res.hubId, 'kandy');
      assert.equal(res.hubName, 'Kandy');
      assert.ok(res.distanceKm < 3);
    });

    it('resolves coordinates near Galle Fort to Galle Hub', () => {
      const res = resolveUserLocationToHub({ latitude: 6.0350, longitude: 80.2170 }, 'en-LK');
      assert.equal(res.hubId, 'galle');
      assert.equal(res.hubName, 'Galle');
      assert.ok(res.distanceKm < 5);
    });

    it('defaults to en-LK locale and ALL_HUBS when optional arguments omitted', () => {
      const res = resolveUserLocationToHub({ latitude: 9.6615, longitude: 80.0255 });
      assert.equal(res.hubId, 'jaffna');
      assert.equal(res.hubName, 'Jaffna');
      assert.ok(res.distanceKm < 5);
    });

    it('identifies expressway interchange status correctly on resolved hub', () => {
      const mmc = resolveUserLocationToHub({ latitude: 6.8400, longitude: 79.9700 }, 'en-LK');
      assert.equal(mmc.isExpresswayInterchange, true);

      const negombo = resolveUserLocationToHub({ latitude: 7.2008, longitude: 79.8737 }, 'en-LK');
      assert.equal(mmc.isExpresswayInterchange, true);
      assert.equal(negombo.isExpresswayInterchange, false);
    });
  });
});
