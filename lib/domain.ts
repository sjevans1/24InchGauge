import { z } from "zod";
import {
  degrees,
  id,
  today,
  type Access,
  type State,
  type Role,
  type Journal,
  type Member,
} from "./model";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assert(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new AppError(message, status);
}
export function permit(a: Access, roles: Role[]) {
  assert(
    roles.includes(a.role),
    "Your lodge role does not permit this action.",
    403,
  );
  assert(
    !a.endsAt || Date.parse(a.endsAt) > Date.now(),
    "This lodge role has expired.",
    403,
  );
}
const text = z.string().trim().max(300);
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === v;
  }, "Use a valid calendar date.");
const memberFields = z.object({
  name: text.min(2),
  email: z.string().trim().toLowerCase().email().or(z.literal("")),
  phone: text,
  degree: z.enum(["Candidate", "EA", "FC", "MM"]),
  office: text,
  status: z.enum(["Active", "Resigned", "Deceased", "Suspended"]),
  joined: isoDate,
});
export const lodgeFields = z.object({
  name: text.min(2),
  number: text.min(1),
  constitution: z.enum(["English", "Scottish", "Irish"]),
  currency: z.enum(["JMD", "KYD", "USD"]),
  venue: text.min(2),
});
const next = (d: string) => degrees[degrees.indexOf(d as Member["degree"]) + 1];
export function applyCommand(
  before: State,
  access: Access,
  action: string,
  raw: unknown,
  now = new Date(),
): State {
  const s = structuredClone(before);
  const at = now.toISOString();
  const dateNow = today(now);
  const member = (value: string) => {
    const m = s.members.find((m) => m.id === value);
    assert(m, "Choose a member of this lodge.");
    return m;
  };
  const meeting = (value: string) => {
    const m = s.meetings.find((m) => m.id === value);
    assert(m, "Meeting not found in this lodge.", 404);
    return m;
  };
  switch (action) {
    case "saveMember": {
      permit(access, ["secretary"]);
      const d = memberFields.extend({ id: z.string().optional() }).parse(raw);
      const existing = d.id ? member(d.id) : undefined;
      assert(
        !existing || existing.degree === d.degree,
        "Record degree changes through a confirmed ceremony or an audited correction.",
      );
      assert(
        !d.email ||
          !s.members.some((m) => m.email === d.email && m.id !== d.id),
        "A member already uses this email.",
      );
      if (existing) Object.assign(existing, d);
      else s.members.push({ ...d, id: id() });
      break;
    }
    case "importMembers": {
      permit(access, ["secretary"]);
      const rows = z.array(memberFields).min(1).max(500).parse(raw);
      const emails = new Set(s.members.map((m) => m.email).filter(Boolean)),
        names = new Set(s.members.map((m) => m.name.toLowerCase()));
      for (const row of rows) {
        assert(
          !names.has(row.name.toLowerCase()) &&
            (!row.email || !emails.has(row.email)),
          `Duplicate member: ${row.name}. Nothing was imported.`,
        );
        names.add(row.name.toLowerCase());
        if (row.email) emails.add(row.email);
      }
      s.members.push(...rows.map((row) => ({ ...row, id: id() })));
      break;
    }
    case "saveMeeting": {
      permit(access, ["secretary"]);
      const d = z
        .object({
          id: z.string().optional(),
          title: text.min(2),
          date: isoDate,
          time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          venue: text.min(2),
          type: z.enum(["Regular", "Committee", "Installation", "Emergency"]),
          agenda: z.array(z.string().trim().min(1).max(2000)).min(1).max(80),
          ceremonies: z
            .array(
              z.object({
                memberId: z.string(),
                degree: z.enum(["EA", "FC", "MM"]),
              }),
            )
            .max(20),
        })
        .parse(raw);
      const existing = d.id ? meeting(d.id) : undefined;
      assert(
        !existing || existing.status === "Planned",
        "Only a planned meeting can be edited.",
      );
      assert(
        new Set(d.ceremonies.map((c) => c.memberId)).size ===
          d.ceremonies.length,
        "Schedule only one ceremony per member in a meeting.",
      );
      for (const c of d.ceremonies) {
        const m = member(c.memberId);
        assert(
          m.status === "Active" && next(m.degree) === c.degree,
          "A ceremony must be the next degree for an active member.",
        );
      }
      if (existing) Object.assign(existing, d);
      else
        s.meetings.push({
          ...d,
          id: id(),
          status: "Planned",
          attendance: [],
          minutes: "",
          minutesStatus: "Draft",
        });
      break;
    }
    case "cancelMeeting": {
      permit(access, ["secretary"]);
      const d = z.object({ id: z.string(), reason: text.min(5) }).parse(raw);
      const m = meeting(d.id);
      assert(m.status === "Planned", "Only planned meetings can be cancelled.");
      m.status = "Cancelled";
      m.minutes = "Cancellation: " + d.reason;
      break;
    }
    case "confirmMeeting": {
      permit(access, ["secretary"]);
      const d = z
        .object({
          id: z.string(),
          attendance: z.array(z.string()).max(2000),
          performed: z.array(z.string()).max(20),
          notes: z.string().max(15000),
        })
        .parse(raw);
      const m = meeting(d.id);
      assert(
        m.status === "Planned",
        "This meeting has already been processed.",
        409,
      );
      assert(
        m.date <= dateNow,
        "A future meeting cannot be confirmed as held.",
      );
      d.attendance.forEach(member);
      assert(
        new Set(d.performed).size === d.performed.length,
        "A ceremony cannot be recorded twice.",
      );
      const ceremonyNotes: string[] = [];
      for (const memberId of d.performed) {
        const c = m.ceremonies.find((c) => c.memberId === memberId);
        const b = member(memberId);
        assert(
          c &&
            d.attendance.includes(memberId) &&
            b.status === "Active" &&
            next(b.degree) === c.degree,
          "Confirm attendance and a valid scheduled ceremony for each advancement.",
        );
        s.events.push({
          id: id(),
          memberId,
          from: b.degree,
          to: c.degree,
          date: m.date,
          meetingId: m.id,
        });
        b.degree = c.degree;
        s.tasks.push({
          id: id(),
          title: `Arrange ${c.degree} mentoring for ${b.name}`,
          due: m.date,
          memberId,
          meetingId: m.id,
          done: false,
        });
        ceremonyNotes.push(`${b.name} advanced to ${c.degree}.`);
      }
      m.attendance = [...new Set(d.attendance)];
      m.status = "Completed";
      m.minutes =
        `${m.title}\n${m.date} at ${m.time}\n\n${m.agenda.map((a, i) => `${i + 1}. ${a}\n[Record discussion and decision]`).join("\n\n")}\n\n${ceremonyNotes.join("\n")}\n${d.notes}`.trim();
      break;
    }
    case "correctDegree": {
      permit(access, ["secretary"]);
      const d = z
        .object({
          eventId: z.string(),
          reason: z.string().trim().min(10).max(2000),
        })
        .parse(raw);
      const e = s.events.find((e) => e.id === d.eventId);
      assert(e && !e.correctionOf, "Choose an original degree event.");
      const latest = s.events.filter((x) => x.memberId === e.memberId).at(-1);
      const b = member(e.memberId);
      assert(
        latest?.id === e.id && b.degree === e.to,
        "Only the latest uncorrected event can be reversed.",
      );
      s.events.push({
        id: id(),
        memberId: b.id,
        from: e.to,
        to: e.from,
        date: dateNow,
        meetingId: e.meetingId,
        correctionOf: e.id,
        reason: d.reason,
      });
      b.degree = e.from;
      s.tasks.push({
        id: id(),
        title: `Review records and mentoring after the degree correction for ${b.name}`,
        due: dateNow,
        memberId: b.id,
        done: false,
      });
      break;
    }
    case "saveMinutes": {
      permit(access, ["secretary"]);
      const d = z
        .object({ id: z.string(), minutes: z.string().max(30000) })
        .parse(raw);
      const m = meeting(d.id);
      assert(
        m.status === "Completed" && m.minutesStatus === "Draft",
        "Only draft minutes of a held meeting can be edited.",
      );
      m.minutes = d.minutes;
      break;
    }
    case "approveMinutes": {
      permit(access, ["secretary", "master"]);
      const d = z
        .object({ id: z.string(), confirmed: z.literal(true) })
        .parse(raw);
      const m = meeting(d.id);
      assert(
        m.status === "Completed" &&
          m.minutesStatus === "Draft" &&
          m.minutes.trim() &&
          !m.minutes.includes("[Record discussion and decision]"),
        "Complete the draft minutes and resolve all placeholders before approval.",
      );
      m.minutesStatus = "Approved";
      break;
    }
    case "saveTask": {
      permit(access, ["secretary", "master"]);
      const d = z
        .object({
          id: z.string().optional(),
          title: text.min(2),
          due: isoDate,
          memberId: z.string(),
        })
        .parse(raw);
      if (d.memberId) member(d.memberId);
      const t = d.id ? s.tasks.find((t) => t.id === d.id) : undefined;
      assert(!d.id || t, "Task not found.");
      if (t) Object.assign(t, d);
      else s.tasks.push({ ...d, id: id(), done: false });
      break;
    }
    case "toggleTask": {
      permit(access, ["secretary", "master", "treasurer", "member"]);
      const d = z.object({ id: z.string(), done: z.boolean() }).parse(raw);
      const t = s.tasks.find((t) => t.id === d.id);
      assert(t, "Task not found.");
      assert(
        ["secretary", "master"].includes(access.role) ||
          (access.memberId && t.memberId === access.memberId),
        "This task is assigned to someone else.",
        403,
      );
      t.done = d.done;
      break;
    }
    case "postJournal": {
      permit(access, ["secretary", "treasurer"]);
      const d = z
        .object({
          date: isoDate,
          description: text.min(2),
          type: z.enum(["Receipt", "Expense", "Assessment"]),
          category: text.min(1),
          amount: z.number().int().positive().max(100000000000),
          memberId: z.string(),
          fund: text.min(1),
        })
        .parse(raw);
      assert(d.date <= dateNow, "Future financial entries are not allowed.");
      if (d.memberId) member(d.memberId);
      assert(
        !(
          d.type === "Assessment" ||
          (d.type === "Receipt" && d.category === "Dues")
        ) || d.memberId,
        "Choose the member for this dues entry.",
      );
      const debit =
        d.type === "Expense"
          ? d.category + " expense"
          : d.type === "Assessment"
            ? "Dues receivable"
            : "Bank";
      const credit =
        d.type === "Expense"
          ? "Bank"
          : d.type === "Assessment"
            ? "Dues income"
            : d.category === "Dues"
              ? "Dues receivable"
              : d.category + " income";
      const j: Journal = {
        ...d,
        id: id(),
        entries: [
          { account: debit, debit: d.amount, credit: 0 },
          { account: credit, debit: 0, credit: d.amount },
        ],
      };
      s.journal.push(j);
      break;
    }
    case "reverseJournal": {
      permit(access, ["secretary", "treasurer"]);
      const d = z.object({ id: z.string(), reason: text.min(5) }).parse(raw);
      const j = s.journal.find((j) => j.id === d.id);
      assert(
        j &&
          j.type !== "Reversal" &&
          !s.journal.some((x) => x.reverses === j.id),
        "This entry cannot be reversed again.",
      );
      s.journal.push({
        ...j,
        id: id(),
        type: "Reversal",
        date: dateNow,
        description: d.reason,
        reverses: j.id,
        entries: j.entries.map((e) => ({
          account: e.account,
          debit: e.credit,
          credit: e.debit,
        })),
      });
      break;
    }
    case "saveAsset": {
      permit(access, ["secretary", "treasurer"]);
      const d = z
        .object({
          id: z.string().optional(),
          name: text.min(2),
          category: text.min(1),
          condition: z.enum(["Excellent", "Good", "Fair", "Needs repair"]),
          value: z.number().int().min(0).max(100000000000),
          custodian: text.min(2),
          location: text.min(2),
          photoId: z.string(),
        })
        .parse(raw);
      assert(
        !d.photoId ||
          s.files.some((f) => f.id === d.photoId && f.purpose === "asset"),
        "Use an asset photograph uploaded to this lodge.",
      );
      const a = d.id ? s.assets.find((a) => a.id === d.id) : undefined;
      assert(!d.id || a, "Asset not found.");
      const history = {
        at,
        custodian: d.custodian,
        condition: d.condition,
        location: d.location,
      };
      if (a) {
        a.history.push(history);
        Object.assign(a, d);
      } else s.assets.push({ ...d, id: id(), history: [history] });
      break;
    }
    case "saveBrand": {
      permit(access, ["secretary"]);
      const d = z
        .object({
          color: z.string().regex(/^#[0-9a-f]{6}$/i),
          layout: z.enum(["traditional", "compact"]),
          logoId: z.string(),
          presetLogo: z.enum(["kingston", ""]).optional(),
          greeting: z.string().trim().max(1500),
          footer: text,
          sections: z
            .array(z.enum(["Notice", "Agenda", "Officers", "Notices"]))
            .min(2)
            .max(4),
        })
        .parse(raw);
      assert(
        d.sections.includes("Notice") &&
          d.sections.includes("Agenda") &&
          new Set(d.sections).size === d.sections.length,
        "Keep one Notice and one Agenda section.",
      );
      assert(
        !d.logoId ||
          s.files.some((f) => f.id === d.logoId && f.purpose === "logo"),
        "Choose a logo uploaded to this lodge.",
      );
      s.lodge.brand = d;
      break;
    }
    case "saveCalendar": {
      permit(access, ["secretary"]);
      const d = z
        .object({
          weekday: z.number().int().min(0).max(6),
          ordinal: z.number().int().min(1).max(5),
          recessMonths: z.array(z.number().int().min(1).max(12)).max(11),
          installationMonth: z.number().int().min(1).max(12),
          time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        })
        .parse(raw);
      assert(
        new Set(d.recessMonths).size === d.recessMonths.length,
        "Choose each recess month only once.",
      );
      assert(
        !d.recessMonths.includes(d.installationMonth),
        "Installation month cannot be a recess month.",
      );
      s.lodge.schedule = d;
      break;
    }
    case "saveLodge": {
      permit(access, ["secretary"]);
      const d = lodgeFields.parse(raw);
      assert(
        !s.journal.length || d.currency === s.lodge.currency,
        "Currency cannot change after financial entries exist.",
      );
      Object.assign(s.lodge, d);
      break;
    }
    default:
      throw new AppError("Unknown action.", 400);
  }
  return s;
}
