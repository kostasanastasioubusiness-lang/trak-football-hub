import { withAlpha } from '@/lib/with-alpha'
import { getRatingBand } from '@/lib/rating-band'

export const RatingBandPill = ({ rating }: { rating: number }) => {
  const band = getRatingBand(rating);
  return (
    <span
      className="trak-dark inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium leading-none"
      style={{
        color: band.color,
        background: `linear-gradient(${withAlpha(band.color, 0.12)}, ${withAlpha(band.color, 0.12)}), rgb(var(--t-surface))`, // a dark pill
        border: `1px solid ${withAlpha(band.color, 0.25)}`, // ~25% opacity
      }}
    >
      {band.label}
    </span>
  );
};
