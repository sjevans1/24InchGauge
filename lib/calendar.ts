import type { Lodge } from "./model";
export type MeetingSchedule = {
  weekday: number;
  ordinal: number;
  recessMonths: number[];
  installationMonth: number;
  time: string;
};
export const kingstonVenue =
  "Aubrey Shervington Jacobs Temple, Masonic Building, 45–47 Barbados Avenue, New Kingston, Kingston 5";
export const kingstonSchedule: MeetingSchedule = {
  weekday: 3,
  ordinal: 1,
  recessMonths: [9, 10],
  installationMonth: 2,
  time: "19:00",
};
export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const isKingston = (
  l: Pick<Lodge, "name" | "number" | "constitution">,
) =>
  /kingston/i.test(l.name) &&
  l.number.trim() === "1933" &&
  l.constitution === "English";
export function scheduleFor(lodge: Lodge): MeetingSchedule | undefined {
  return (
    lodge.schedule ||
    (isKingston(lodge) ? structuredClone(kingstonSchedule) : undefined)
  );
}
export function annualMeetings(schedule: MeetingSchedule, year: number) {
  return monthNames.flatMap((month, i) => {
    if (schedule.recessMonths.includes(i + 1)) return [];
    const first = new Date(Date.UTC(year, i, 1));
    let day =
      1 +
      ((schedule.weekday - first.getUTCDay() + 7) % 7) +
      (schedule.ordinal - 1) * 7;
    if (schedule.ordinal === 5) {
      day -= 7;
      if (new Date(Date.UTC(year, i, day + 7)).getUTCMonth() === i) day += 7;
    }
    const date = new Date(Date.UTC(year, i, day)).toISOString().slice(0, 10);
    return [
      {
        date,
        time: schedule.time,
        type:
          i + 1 === schedule.installationMonth
            ? ("Installation" as const)
            : ("Regular" as const),
        month,
      },
    ];
  });
}
export function nextMeeting(lodge: Lodge, from: string) {
  const s = scheduleFor(lodge);
  if (!s) return undefined;
  const y = Number(from.slice(0, 4));
  return [...annualMeetings(s, y), ...annualMeetings(s, y + 1)].find(
    (m) => m.date >= from,
  );
}
