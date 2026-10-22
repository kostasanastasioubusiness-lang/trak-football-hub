import { BANDS } from '@/lib/types'
import { getRatingBand } from '@/lib/rating-band'

export const RatingBandPill = ({ rating }: { rating: number }) => {
  const band = getRatingBand(rating);
  const config = BANDS.find(b => b.word === band.label) ?? BANDS[BANDS.length - 1];
  return (
    // TRAK-229: as BandPill, the band's light tint with a dot in its colour; the word in Trak's ink.
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none"
      style={{ color: 'rgb(var(--t-ink))', background: config.bg, border: `1px solid ${config.border}` }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: band.color }} />
      {band.label}
    </span>
  );
};
