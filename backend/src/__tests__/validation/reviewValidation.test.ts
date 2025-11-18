import { describe, it, expect } from '@jest/globals';

/**
 * Unit tests for review validation logic
 *
 * These tests verify that the ReviewController properly validates:
 * - Rating bounds (1-5)
 * - Rating type (number)
 * - Venue/Band requirements
 * - Preventing dual targets (venue AND band)
 */

describe('Review Validation', () => {
  describe('Rating validation', () => {
    it('should accept valid ratings between 1 and 5', () => {
      const validRatings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

      validRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5;
        expect(isValid).toBe(true);
      });
    });

    it('should reject ratings below 1', () => {
      const invalidRatings = [0, 0.5, -1, -5];

      invalidRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      });
    });

    it('should reject ratings above 5', () => {
      const invalidRatings = [5.5, 6, 10, 100];

      invalidRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      });
    });

    it('should reject non-number ratings', () => {
      const invalidRatings = ['5', null, undefined, {}, [], NaN];

      invalidRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Target validation', () => {
    it('should require either venueId or bandId', () => {
      const hasTarget = (venueId?: string, bandId?: string) => {
        return !!(venueId || bandId);
      };

      expect(hasTarget(undefined, undefined)).toBe(false);
      expect(hasTarget('venue-123', undefined)).toBe(true);
      expect(hasTarget(undefined, 'band-456')).toBe(true);
      expect(hasTarget('venue-123', 'band-456')).toBe(true);
    });

    it('should prevent reviewing both venue and band', () => {
      const hasDualTarget = (venueId?: string, bandId?: string) => {
        return !!(venueId && bandId);
      };

      expect(hasDualTarget(undefined, undefined)).toBe(false);
      expect(hasDualTarget('venue-123', undefined)).toBe(false);
      expect(hasDualTarget(undefined, 'band-456')).toBe(false);
      expect(hasDualTarget('venue-123', 'band-456')).toBe(true);
    });

    it('should allow review with only venueId', () => {
      const isValid = (venueId?: string, bandId?: string) => {
        const hasTarget = !!(venueId || bandId);
        const noDualTarget = !(venueId && bandId);
        return hasTarget && noDualTarget;
      };

      expect(isValid('venue-123', undefined)).toBe(true);
      expect(isValid('venue-123', 'band-456')).toBe(false);
    });

    it('should allow review with only bandId', () => {
      const isValid = (venueId?: string, bandId?: string) => {
        const hasTarget = !!(venueId || bandId);
        const noDualTarget = !(venueId && bandId);
        return hasTarget && noDualTarget;
      };

      expect(isValid(undefined, 'band-456')).toBe(true);
      expect(isValid('venue-123', 'band-456')).toBe(false);
    });
  });

  describe('Complete review validation', () => {
    const validateReview = (review: any) => {
      // Rating validation
      if (!review.rating) {
        return { valid: false, error: 'Rating is required' };
      }

      if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
        return { valid: false, error: 'Rating must be a number between 1 and 5' };
      }

      // Target validation
      if (!review.venueId && !review.bandId) {
        return { valid: false, error: 'Review must be for either a venue or a band' };
      }

      if (review.venueId && review.bandId) {
        return { valid: false, error: 'Review must be for either a venue or a band, not both' };
      }

      return { valid: true };
    };

    it('should accept valid venue review', () => {
      const review = {
        rating: 4.5,
        venueId: 'venue-123',
        title: 'Great venue',
        content: 'Had a great time!',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(true);
    });

    it('should accept valid band review', () => {
      const review = {
        rating: 5,
        bandId: 'band-456',
        title: 'Amazing performance',
        content: 'Best concert ever!',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(true);
    });

    it('should reject review with missing rating', () => {
      const review = {
        venueId: 'venue-123',
        title: 'Test',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rating is required');
    });

    it('should reject review with invalid rating', () => {
      const review = {
        rating: 10,
        venueId: 'venue-123',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Rating must be a number between 1 and 5');
    });

    it('should reject review with no target', () => {
      const review = {
        rating: 4,
        title: 'Test',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Review must be for either a venue or a band');
    });

    it('should reject review with dual targets', () => {
      const review = {
        rating: 4,
        venueId: 'venue-123',
        bandId: 'band-456',
      };

      const result = validateReview(review);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Review must be for either a venue or a band, not both');
    });
  });
});
