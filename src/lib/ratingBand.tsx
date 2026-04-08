export interface RatingBand {
  label: string;
  color: string;
}

export function getRatingBand(rating: number): RatingBand {
  if (rating >= 9.2) return { label: 'Exceptional', color: '#C8F25A' };
  if (rating >= 8.2) return { label: 'Standout', color: '#86efac' };
  if (rating >= 7.2) return { label: 'Good', color: '#4ade80' };
  if (rating >= 6.4) return { label: 'Steady', color: '#60a5fa' };
  if (rating >= 5.6) return { label: 'Mixed', color: '#fb923c' };
  if (rating >= 4.8) return { label: 'Developing', color: '#a78bfa' };
  return { label: 'Difficult', color: 'rgba(255,255,255,0.4)' };
}

export const RatingBandPill = ({ rating }: { rating: number }) => {
  const band = getRatingBand(rating);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium leading-none"
      style={{
        color: band.color,
        background: `${band.color}1F`, // ~12% opacity
        border: `1px solid ${band.color}40`, // ~25% opacity
      }}
    >
      {band.label}
    </span>
  );
};
