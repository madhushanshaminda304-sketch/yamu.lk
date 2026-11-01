import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase.ts';

test('supabase client initializes with valid URL and configuration', () => {
  assert.ok(supabase, 'Supabase client must be defined');
  assert.equal(typeof supabase.from, 'function', 'supabase.from must be a function');
  assert.equal(isSupabaseConfigured(), true, 'Supabase should be recognized as configured');
});
