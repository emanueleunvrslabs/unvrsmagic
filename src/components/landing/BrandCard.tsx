interface BrandCardProps {
  name: string;
  logoType: string;
}

const logos: Record<string, JSX.Element> = {
  hexagon: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M20 2L37 12V28L20 38L3 28V12L20 2Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="6" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  triangle: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M20 4L36 34H4L20 4Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <path d="M20 14L28 28H12L20 14Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  circle: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <circle cx="20" cy="20" r="16" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="10" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="4" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  diamond: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M20 2L38 20L20 38L2 20L20 2Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <path d="M20 10L30 20L20 30L10 20L20 10Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  star: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M20 2L24 14L36 14L26 22L30 34L20 26L10 34L14 22L4 14L16 14L20 2Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  octagon: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M12 2H28L38 12V28L28 38H12L2 28V12L12 2Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="8" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  square: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <rect x="4" y="4" width="32" height="32" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <rect x="12" y="12" width="16" height="16" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  pentagon: (
    <svg width="54" height="54" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-icon">
      <path d="M20 2L38 14L30 36H10L2 14L20 2Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
      <path d="M20 12L30 20L26 32H14L10 20L20 12Z" stroke="#37FF8B" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

export function BrandCard({ name, logoType }: BrandCardProps) {
  return (
    <div className="flex-shrink-0">
      <button className="brutalist-button button-1">
        <div className="brand-logo">
          {logos[logoType] || logos.hexagon}
        </div>
        <div className="button-text">
          <span>Partner</span>
          <span>{name}</span>
        </div>
      </button>
    </div>
  );
}
