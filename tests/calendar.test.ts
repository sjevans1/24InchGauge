import test from "node:test";
import assert from "node:assert/strict";
import {
  annualMeetings,
  kingstonSchedule,
  nextMeeting,
  scheduleFor,
} from "../lib/calendar";
import { sampleState } from "../lib/sample";
import { applyCommand } from "../lib/domain";
import { emptyState, defaultBrand, type Access } from "../lib/model";
import { renderPDF } from "../lib/pdf";
import { kingstonCrest } from "../lib/kingston-crest";
import { snapshot } from "../lib/model";
const secretary: Access = {
  userId: "test",
  email: "test@example.com",
  role: "secretary",
  memberId: null,
  endsAt: null,
};
test("Kingston calendar meets first Wednesday except August and September, including leap years", () => {
  for (const year of [2026, 2027, 2028, 2032]) {
    const dates = annualMeetings(kingstonSchedule, year);
    assert.equal(dates.length, 10);
    for (const m of dates) {
      const d = new Date(m.date + "T12:00:00Z");
      assert.equal(d.getUTCDay(), 3);
      assert.ok(d.getUTCDate() <= 7);
      assert.ok(![7, 8].includes(d.getUTCMonth()));
      assert.equal(m.type, d.getUTCMonth() === 1 ? "Installation" : "Regular");
    }
  }
  assert.equal(annualMeetings(kingstonSchedule, 2027)[1].date, "2027-02-03");
  assert.equal(
    nextMeeting(sampleState().lodge, "2026-08-06")?.date,
    "2026-10-07",
  );
  assert.equal(
    nextMeeting(sampleState().lodge, "2026-12-03")?.date,
    "2027-01-06",
  );
});
test("calendar is secretary-only, validates installation, and preserves existing meetings", () => {
  const s = sampleState();
  const existing = structuredClone(s.meetings);
  const custom = {
    ...kingstonSchedule,
    weekday: 5,
    ordinal: 5,
    recessMonths: [8],
    time: "18:00",
  };
  const saved = applyCommand(s, secretary, "saveCalendar", custom);
  assert.deepEqual(saved.meetings, existing);
  assert.deepEqual(scheduleFor(saved.lodge), custom);
  assert.equal(annualMeetings(custom, 2027)[1].date, "2027-02-26");
  assert.throws(() =>
    applyCommand(s, { ...secretary, role: "member" }, "saveCalendar", custom),
  );
  assert.throws(() =>
    applyCommand(s, secretary, "saveCalendar", {
      ...custom,
      recessMonths: [2],
    }),
  );
  assert.throws(() =>
    applyCommand(s, secretary, "saveCalendar", { ...custom, time: "29:00" }),
  );
  assert.throws(() =>
    applyCommand(s, secretary, "saveCalendar", {
      ...custom,
      recessMonths: [9, 9],
    }),
  );
});
test("Kingston defaults leave other lodges and customised branding alone", () => {
  const s = sampleState();
  assert.equal(s.lodge.brand.presetLogo, "kingston");
  const other = {
    ...s.lodge,
    name: "Another Lodge",
    brand: structuredClone(defaultBrand),
  };
  assert.equal(emptyState(other).lodge.brand.presetLogo, undefined);
  assert.equal(scheduleFor(other), undefined);
  const custom = {
    ...s.lodge,
    brand: {
      ...s.lodge.brand,
      presetLogo: "" as const,
      greeting: "Custom greeting",
      logoId: "private-file",
    },
  };
  assert.deepEqual(emptyState(custom).lodge.brand, custom.brand);
  assert.equal(s.documents.length, 0);
});
test("Kingston extracted crest renders in a PDF", async () => {
  const s = sampleState();
  const bytes = Uint8Array.from(
    Buffer.from(kingstonCrest.split(",")[1], "base64"),
  );
  const pdf = await renderPDF(
    snapshot(s, s.meetings[0], "Summons", "2026-11-09T12:00:00Z"),
    bytes,
    true,
  );
  assert.ok(pdf.length > 10000);
});

test("recess correction upgrades old Kingston settings once without rewriting meeting history", () => {
  const original = sampleState();
  const legacy = {...original.lodge, calendarDefaultsVersion: undefined, schedule: {...kingstonSchedule, recessMonths:[9,10]}};
  const migrated = emptyState(legacy).lodge;
  assert.deepEqual(migrated.schedule?.recessMonths,[8,9]);
  assert.deepEqual(legacy.schedule.recessMonths,[9,10]);
  assert.equal(nextMeeting(migrated,"2026-07-02")?.date,"2026-10-07");
  const explicit = {...migrated, schedule:{...kingstonSchedule,recessMonths:[9,10]}};
  assert.deepEqual(emptyState(explicit).lodge.schedule?.recessMonths,[9,10]);
  const other = {...legacy,name:"Another Lodge"};
  assert.deepEqual(emptyState(other).lodge.schedule?.recessMonths,[9,10]);
  assert.deepEqual(emptyState({...legacy,schedule:{...kingstonSchedule,recessMonths:[12]}}).lodge.schedule?.recessMonths,[12]);
});
