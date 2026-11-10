"use client";
import { useState } from "react";
import { useApp } from "./context";
import { Field } from "./components";
import {
  annualMeetings,
  scheduleFor,
  monthNames,
  weekdays,
} from "@/lib/calendar";
import { displayDate, today } from "@/lib/model";
export function CalendarSettings() {
  const { s, command, busy } = useApp();
  const [calendar, setCalendar] = useState(
    () =>
      scheduleFor(s.lodge) || {
        weekday: 3,
        ordinal: 1,
        recessMonths: [],
        installationMonth: 2,
        time: "19:00",
      },
  );
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const dates = annualMeetings(calendar, year);
  return (
    <div className="settings-columns">
      <form
        className="panel padded"
        onSubmit={async (e) => {
          e.preventDefault();
          await command("saveCalendar", calendar);
        }}
      >
        <h2>Your lodge calendar</h2>
        <p className="muted">
          Set the regular meeting pattern. Special meetings can use another
          date. Saving this pattern does not move existing meetings or change
          issued summonses.
        </p>
        <div className="form-grid">
          <Field label="Week of month">
            <select
              value={calendar.ordinal}
              onChange={(e) =>
                setCalendar({ ...calendar, ordinal: Number(e.target.value) })
              }
            >
              {["First", "Second", "Third", "Fourth", "Last"].map((v, i) => (
                <option value={i + 1} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Day of week">
            <select
              value={calendar.weekday}
              onChange={(e) =>
                setCalendar({ ...calendar, weekday: Number(e.target.value) })
              }
            >
              {weekdays.map((v, i) => (
                <option value={i} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Usual meeting time">
          <input
            type="time"
            required
            value={calendar.time}
            onChange={(e) => setCalendar({ ...calendar, time: e.target.value })}
          />
        </Field>
        <Field label="Installation month">
          <select
            value={calendar.installationMonth}
            onChange={(e) =>
              setCalendar({
                ...calendar,
                installationMonth: Number(e.target.value),
              })
            }
          >
            {monthNames.map((v, i) => (
              <option value={i + 1} key={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="calendar-recess">
          <legend>Recess months</legend>
          <div className="form-grid">
            {monthNames.map((v, i) => (
              <label key={v}>
                <input
                  type="checkbox"
                  checked={calendar.recessMonths.includes(i + 1)}
                  onChange={(e) =>
                    setCalendar({
                      ...calendar,
                      recessMonths: e.target.checked
                        ? [...calendar.recessMonths, i + 1]
                        : calendar.recessMonths.filter((m) => m !== i + 1),
                    })
                  }
                />{" "}
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className="primary"
          disabled={
            busy || calendar.recessMonths.includes(calendar.installationMonth)
          }
        >
          Save meeting calendar
        </button>
        {calendar.recessMonths.includes(calendar.installationMonth) && (
          <p role="alert">
            Installation must be in a month when the lodge meets.
          </p>
        )}
      </form>
      <section className="panel padded">
        <span className="eyebrow">CALENDAR PREVIEW</span>
        <h2>{dates.length} meetings in the year.</h2>
        <Field label="Preview year">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from(
              { length: 5 },
              (_, i) => Number(today().slice(0, 4)) - 1 + i,
            ).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
        <p className="muted">
          Proposed dates from the settings shown. Creating a meeting starts with
          the next date in the saved calendar; review it before saving.
        </p>
        <ul className="calendar-dates">
          {dates.map((d) => (
            <li key={d.date}>
              <span>
                {displayDate(d.date)} · {d.time}
              </span>
              <strong>{d.type}</strong>
            </li>
          ))}
        </ul>
        <p className="muted">
          Recess:{" "}
          {calendar.recessMonths
            .slice()
            .sort((a, b) => a - b)
            .map((m) => monthNames[m - 1])
            .join(", ") || "None"}
          .
        </p>
      </section>
    </div>
  );
}
