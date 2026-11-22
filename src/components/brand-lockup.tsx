// The HRIS logo lockup: the "HR" tile, HRIS and SAEFUL ASKAR, as one image cut from the lockup artwork
// (public/icons/Icon-new.jpeg) by scripts/generate-icons.mjs. Its background is transparent and its
// letters white, so it sits on the orange header color (CHANGELOG 63).
export function BrandLockup({ large = false }: { large?: boolean }) {
  return (
    <div className={`lockup ${large ? "lockup-lg" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small static logo, also cached for offline */}
      <img src="/brand/lockup.png" alt="HRIS Saeful Askar" width={954} height={300} />
    </div>
  );
}
