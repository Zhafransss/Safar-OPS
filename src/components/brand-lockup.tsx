// The HRIS logo lockup: the "HR" mark on a white tile, then "HRIS" over "SAEFUL ASKAR". The mark is cut
// from public/brand/logo.png by scripts/generate-icons.mjs; both words are plain text in the app font.
// The text is white, so the lockup sits on the orange header color.
export function BrandLockup({ large = false }: { large?: boolean }) {
  return (
    <div className={`lockup ${large ? "lockup-lg" : ""}`}>
      <span className="lockup-tile">
        <img src="/brand/hr-mark.png" alt="" />
      </span>
      <span className="lockup-words">
        <span className="lockup-name">HRIS</span>
        <span className="lockup-sub">Saeful Askar</span>
      </span>
    </div>
  );
}
