"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { id as indonesian } from "react-day-picker/locale";

import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { addIsoDays, formatIsoDate, jakartaIsoDate } from "@/lib/date";

// By Date.getDay(), Sunday first.
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

const PRESETS = [
  { label: "Hari ini", days: 0 },
  { label: "Besok", days: 1 },
  { label: "Lusa", days: 2 },
  { label: "+1 minggu", days: 7 },
] as const;

// A DL has no time: the calendar gets a local date built from the digits, so the phone's own time
// zone never moves the day. "Today" is Jakarta's (NFR-06).
const toDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Q-02 option C, chosen by the Direktur: the DL opens a sheet with quick picks and a calendar.
// Days before today cannot be picked (Q-01); a late DL already set stays as it is (CHANGELOG 1),
// and PNG-TDO-04 still guards the server.
export function DateField({
  id,
  value,
  placeholder,
  onChange,
}: {
  id?: string;
  value: string;
  placeholder: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const todayIso = jakartaIsoDate(new Date());
  const today = toDate(todayIso);

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <>
      <button id={id} type="button" className="picker date-field" onClick={() => setOpen(true)}>
        {value ? <span>{formatIsoDate(value)}</span> : <span className="ph">{placeholder}</span>}
        <Icon name="cal" size={16} />
      </button>
      {open && (
        <Sheet title="Pilih deadline" onClose={() => setOpen(false)}>
          <div className="cal-presets">
            {PRESETS.map((preset) => {
              const iso = addIsoDays(todayIso, preset.days);
              return (
                <button key={preset.label} className={`cal-preset ${value === iso ? "on" : ""}`} onClick={() => pick(iso)}>
                  {preset.label}
                </button>
              );
            })}
          </div>
          <DayPicker
            mode="single"
            required
            selected={value ? toDate(value) : undefined}
            onSelect={(date) => pick(toIso(date))}
            defaultMonth={value && value > todayIso ? toDate(value) : today}
            startMonth={today}
            disabled={{ before: today }}
            locale={indonesian}
            weekStartsOn={1}
            navLayout="around"
            formatters={{ formatWeekdayName: (date) => WEEKDAYS[date.getDay()] ?? "" }}
            classNames={{
              root: "cal",
              months: "cal-months",
              month: "cal-month",
              month_caption: "cal-caption",
              caption_label: "cal-caption-label",
              button_previous: "cal-nav",
              button_next: "cal-nav",
              chevron: "cal-chevron",
              month_grid: "cal-grid",
              weekdays: "cal-weekdays",
              weekday: "cal-weekday",
              weeks: "cal-weeks",
              week: "cal-week",
              day: "cal-day",
              day_button: "cal-day-btn",
              selected: "is-selected",
              today: "is-today",
              disabled: "is-disabled",
              outside: "is-outside",
              hidden: "is-hidden",
              focused: "is-focused",
            }}
          />
          {/* As on the Q-02 option page: what the three day styles mean. Own class names, since
              mockup.css already styles .sel and .empty. */}
          <div className="cal-legend">
            <span>
              <i className="key-today" />
              Hari ini
            </span>
            <span>
              <i className="key-selected" />
              Dipilih
            </span>
            <span>
              <i className="key-off" />
              Lewat, nonaktif
            </span>
          </div>
        </Sheet>
      )}
    </>
  );
}
