import { BAND_COLOR } from '@/lib/types'

export interface RatingBand {
  label: string;
  color: string;
}

export function getRatingBand(rating: number): RatingBand {
  if (rating >= 9.2) return { label: 'Exceptional', color: BAND_COLOR.Exceptional };
  if (rating >= 8.2) return { label: 'Standout', color: BAND_COLOR.Standout };
  if (rating >= 7.2) return { label: 'Good', color: BAND_COLOR.Good };
  if (rating >= 6.4) return { label: 'Steady', color: BAND_COLOR.Steady };
  if (rating >= 5.6) return { label: 'Mixed', color: BAND_COLOR.Mixed };
  if (rating >= 4.8) return { label: 'Developing', color: BAND_COLOR.Developing };
  return { label: 'Difficult', color: 'rgb(var(--t-ink-3))' };
}
