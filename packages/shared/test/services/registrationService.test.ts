import { describe, it, expect, vi } from 'vitest';

// Mock the firebase module to prevent initialization with invalid credentials
vi.mock('../../src/firebase', () => ({ db: {} }));

import { determineRegistrationStatus } from '../../src/services/registrationService';

describe('determineRegistrationStatus', () => {
  it('returns confirmed when event has no max attendees', () => {
    expect(determineRegistrationStatus(null, 100)).toBe('confirmed');
  });
  it('returns confirmed when below max attendees', () => {
    expect(determineRegistrationStatus(50, 30)).toBe('confirmed');
  });
  it('returns waitlisted when at max attendees', () => {
    expect(determineRegistrationStatus(50, 50)).toBe('waitlisted');
  });
  it('returns waitlisted when above max attendees', () => {
    expect(determineRegistrationStatus(50, 55)).toBe('waitlisted');
  });
});
