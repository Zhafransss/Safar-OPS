import type { InputHTMLAttributes } from "react";

// Safari iOS shows an empty date input as a blank box, so an empty DL gets a "Deadline" hint.
// Other browsers' "dd/mm/yyyy" text is hidden while empty so the two never overlap.
export function DateInput({
  value,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & { value: string }) {
  return (
    <div className="date-box">
      <input {...props} type="date" className={`inp ${value ? "" : "empty"} ${className}`} value={value} />
      {!value && <span className="date-hint">Deadline</span>}
    </div>
  );
}
