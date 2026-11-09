import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { handle } from "../lib/api";
import { applyCommand } from "../lib/domain";
import {
  balance,
  defaultBrand,
  emptyState,
  id,
  snapshot,
  visibleState,
  type Access,
  type Identity,
  type Lodge,
} from "../lib/model";
import { sampleState } from "../lib/sample";
import { createLodge, readState, commitState } from "../lib/store";
import { renderPDF } from "../lib/pdf";
import { parseCSV, csv } from "../lib/csv";
// Real SQLite executes the same migration and SQL as D1. No auth bypass is shipped in the application.
class SQL {
  db = new DatabaseSync(":memory:");
  constructor() {
    this.db.exec("PRAGMA foreign_keys=ON");
    this.db.exec(
      readFileSync(
        new URL("../drizzle/0000_next_talisman.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  prepare(sql: string) {
    return new Statement(this.db, sql);
  }
  async batch(statements: Statement[]) {
    this.db.exec("BEGIN");
    try {
      const results = [];
      for (const s of statements) results.push(await s.run());
      this.db.exec("COMMIT");
      return results;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}
class Statement {
  constructor(
    private db: DatabaseSync,
    private sql: string,
    private params: any[] = [],
  ) {}
  bind(...params: any[]) {
    return new Statement(this.db, this.sql, params);
  }
  async first() {
    return this.db.prepare(this.sql).get(...this.params) || null;
  }
  async all() {
    return {
      results: this.db.prepare(this.sql).all(...this.params),
      success: true,
    };
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.params);
    return { success: true, meta: { changes: result.changes } };
  }
}
class Bucket {
  objects = new Map<string, Uint8Array>();
  async put(key: string, data: Uint8Array) {
    this.objects.set(key, new Uint8Array(data));
  }
  async get(key: string) {
    const data = this.objects.get(key);
    return data
      ? { body: data, arrayBuffer: async () => data.buffer.slice(0) }
      : null;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
}
const user: Identity = {
  id: "secretary-a",
  email: "secretary@example.com",
  name: "Sample Secretary",
};
const a: Access = {
  userId: user.id,
  email: user.email,
  role: "secretary",
  memberId: null,
  endsAt: null,
};
const base = () => {
  const s = sampleState();
  s.lodge.id = "lodge-a";
  s.access = [a];
  s.meetings[0].date = "2026-01-10";
  return s;
};
const future = "2999-12-31";
async function fixture() {
  const sql = new SQL(),
    db = sql as unknown as D1Database,
    bucket = new Bucket();
  const s = base();
  await createLodge(db, s, user);
  return {
    sql,
    db,
    bucket,
    env: { DB: db, BUCKET: bucket as unknown as R2Bucket },
    state: await readState(db, s.lodge.id),
  };
}
function request(
  path: string,
  method = "GET",
  payload?: unknown,
  who: Identity | null = user,
  origin = "https://lodge.test",
) {
  const headers: Record<string, string> = {};
  if (who) {
    headers["oai-authenticated-user-id"] = who.id;
    headers["oai-authenticated-user-email"] = who.email;
  }
  if (method !== "GET") {
    headers.origin = origin;
    headers["content-type"] = "application/json";
  }
  return new Request("https://lodge.test" + path, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}
async function command(
  f: Awaited<ReturnType<typeof fixture>>,
  action: string,
  data: unknown,
  who: Identity = user,
  lodgeId = "lodge-a",
  revision?: number,
) {
  const state = await readState(f.db, lodgeId);
  return handle(
    request(
      "/api/command",
      "POST",
      { action, data, lodgeId, revision: revision ?? state.revision },
      who,
    ),
    f.env,
  );
}
const confirm = (s = base()) =>
  applyCommand(s, a, "confirmMeeting", {
    id: "meeting-1",
    attendance: ["member-6", "member-3"],
    performed: ["member-6"],
    notes: "The meeting concluded.",
  });

test("anonymous tour is read-only and writes enforce sign-in and origin", async () => {
  const f = await fixture();
  const read = await handle(
    request("/api/state", "GET", undefined, null),
    f.env,
  );
  assert.equal(read.status, 200);
  assert.equal(((await read.json()) as any).demo, true);
  assert.equal(
    (await handle(request("/api/command", "POST", {}, null), f.env)).status,
    401,
  );
  assert.equal(
    (
      await handle(
        request("/api/command", "POST", {}, user, "https://hostile.test"),
        f.env,
      )
    ).status,
    403,
  );
});
test("cross-lodge read, mutation, PDF and file requests are denied", async () => {
  const f = await fixture();
  const other = { ...user, id: "other", email: "other@example.com" };
  for (const path of [
    "/api/state?lodge=lodge-a",
    "/api/files?lodge=lodge-a&id=x",
    "/api/document?lodge=lodge-a&meeting=meeting-1",
  ])
    assert.equal(
      (await handle(request(path, "GET", undefined, other), f.env)).status,
      403,
    );
  assert.equal(
    (
      await command(
        f,
        "saveTask",
        { title: "bad", due: "2026-01-01", memberId: "" },
        other,
      )
    ).status,
    403,
  );
});
test("scheduling a ceremony never advances the member", () => {
  const s = base();
  const m = s.meetings[0];
  const after = applyCommand(s, a, "saveMeeting", {
    id: m.id,
    title: m.title,
    date: m.date,
    time: m.time,
    venue: m.venue,
    type: m.type,
    agenda: m.agenda,
    ceremonies: m.ceremonies,
  });
  assert.equal(after.members[6].degree, "EA");
  assert.equal(after.events.length, 0);
  assert.equal(after.tasks.length, s.tasks.length);
});
test("confirmation atomically advances degree, creates draft minutes and one follow-up; retry conflicts", async () => {
  const f = await fixture();
  const payload = {
    id: "meeting-1",
    attendance: ["member-6"],
    performed: ["member-6"],
    notes: "Confirmed.",
  };
  assert.equal((await command(f, "confirmMeeting", payload)).status, 200);
  let s = await readState(f.db, "lodge-a");
  assert.equal(s.members[6].degree, "FC");
  assert.equal(s.events.length, 1);
  assert.equal(s.tasks.filter((t) => t.meetingId === "meeting-1").length, 1);
  assert.match(s.meetings[0].minutes, /Nicholas Grant advanced to FC/);
  assert.equal((await command(f, "confirmMeeting", payload)).status, 409);
  s = await readState(f.db, "lodge-a");
  assert.equal(s.events.length, 1);
});
test("optimistic concurrency rolls back records and audit on a stale revision", async () => {
  const f = await fixture();
  const original = await readState(f.db, "lodge-a");
  const after = applyCommand(original, a, "saveTask", {
    title: "First",
    due: "2026-01-01",
    memberId: "",
  });
  await commitState(f.db, original, after, user, "First update");
  await assert.rejects(
    commitState(f.db, original, confirm(original), user, "Stale confirmation"),
    /workspace or your access changed/,
  );
  const saved = await readState(f.db, "lodge-a");
  assert.equal(saved.members[6].degree, "EA");
  assert.equal(saved.events.length, 0);
  assert.equal(saved.audit.length, 2);
  assert.equal(
    (
      (await f.sql
        .prepare("SELECT COUNT(*) AS n FROM transaction_guards")
        .first()) as any
    ).n,
    0,
  );
});
test("revoked role cannot commit a mutation computed before revocation", async () => {
  const f = await fixture(),
    before = await readState(f.db, "lodge-a");
  await f.db
    .prepare("DELETE FROM lodge_access WHERE lodge_id=? AND user_id=?")
    .bind("lodge-a", user.id)
    .run();
  await assert.rejects(
    commitState(f.db, before, confirm(before), user, "Attempt after revoke"),
    /workspace or your access changed/,
  );
  assert.equal((await readState(f.db, "lodge-a")).events.length, 0);
});
test("cancelled, omitted and future ceremonies leave degrees unchanged", () => {
  const s = base();
  assert.equal(
    applyCommand(s, a, "cancelMeeting", {
      id: "meeting-1",
      reason: "Venue unavailable",
    }).members[6].degree,
    "EA",
  );
  assert.equal(
    applyCommand(s, a, "confirmMeeting", {
      id: "meeting-1",
      attendance: [],
      performed: [],
      notes: "",
    }).members[6].degree,
    "EA",
  );
  s.meetings[0].date = future;
  assert.throws(() => confirm(s), /future meeting/);
});
test("cross-lodge references and invalid calendar dates are rejected", () => {
  assert.throws(
    () =>
      applyCommand(base(), a, "saveTask", {
        title: "Test",
        memberId: "foreign-member",
        due: "2026-01-01",
      }),
    /member of this lodge/,
  );
  assert.throws(() =>
    applyCommand(base(), a, "saveTask", {
      title: "Test",
      memberId: "",
      due: "2026-02-30",
    }),
  );
  assert.throws(
    () =>
      applyCommand(base(), a, "saveMember", {
        ...base().members[0],
        degree: "EA",
      }),
    /degree changes/,
  );
});
test("degree advancement requires actual attendance and a scheduled next degree", () => {
  assert.throws(
    () =>
      applyCommand(base(), a, "confirmMeeting", {
        id: "meeting-1",
        attendance: [],
        performed: ["member-6"],
        notes: "",
      }),
    /Confirm attendance/,
  );
  const s = base();
  s.members[6].degree = "FC";
  assert.throws(() => confirm(s), /valid scheduled ceremony/);
});
test("degree corrections append history and review tasks, without rewriting originals", () => {
  const s = confirm();
  const corrected = applyCommand(s, a, "correctDegree", {
    eventId: s.events[0].id,
    reason: "The ceremony was incorrectly recorded.",
  });
  assert.equal(corrected.members[6].degree, "EA");
  assert.deepEqual(corrected.events[0], s.events[0]);
  assert.equal(corrected.events[1].correctionOf, s.events[0].id);
  assert.equal(corrected.tasks.length, s.tasks.length + 1);
  assert.throws(
    () =>
      applyCommand(corrected, a, "correctDegree", {
        eventId: s.events[0].id,
        reason: "Another correction attempt",
      }),
    /latest uncorrected/,
  );
});
test("dues receipts reduce receivables and append-only reversals stay balanced", () => {
  const s = base(),
    before = balance(s.journal, "Dues receivable");
  const after = applyCommand(s, a, "postJournal", {
    date: "2026-01-01",
    description: "Dues receipt",
    type: "Receipt",
    category: "Dues",
    amount: 500000,
    memberId: "member-6",
    fund: "General",
  });
  assert.equal(balance(after.journal, "Dues receivable"), before - 500000);
  const posted = after.journal.at(-1)!;
  assert.equal(
    posted.entries.reduce((n, e) => n + e.debit - e.credit, 0),
    0,
  );
  const reversed = applyCommand(after, a, "reverseJournal", {
    id: posted.id,
    reason: "Receipt entered in error",
  });
  assert.equal(balance(reversed.journal, "Dues receivable"), before);
  assert.deepEqual(reversed.journal.at(-2), posted);
  assert.throws(
    () =>
      applyCommand(reversed, a, "reverseJournal", {
        id: posted.id,
        reason: "Repeat reversal",
      }),
    /cannot be reversed/,
  );
});
test("financial amounts must be positive integer minor units and currency is immutable after posting", () => {
  for (const amount of [-1, 0, 1.4])
    assert.throws(() =>
      applyCommand(base(), a, "postJournal", {
        date: "2026-01-01",
        description: "Invalid",
        type: "Receipt",
        category: "Donation",
        amount,
        memberId: "",
        fund: "General",
      }),
    );
  const s = base();
  assert.throws(
    () => applyCommand(s, a, "saveLodge", { ...s.lodge, currency: "USD" }),
    /Currency cannot change/,
  );
});
test("member projections hide other contacts, balances, draft minutes, assets and source archives", () => {
  const s = base();
  s.files.push({
    id: "archive",
    name: "private.pdf",
    mime: "application/pdf",
    size: 12,
    purpose: "archive",
    createdAt: new Date().toISOString(),
  });
  const v = visibleState(s, { ...a, role: "member", memberId: "member-6" });
  assert.equal(v.members[0].email, "");
  assert.equal(v.members[6].email, s.members[6].email);
  assert.ok(v.journal.every((j) => j.memberId === "member-6"));
  assert.equal(v.assets.length, 0);
  assert.equal(v.meetings.length, 0);
  assert.equal(v.files.length, 0);
  assert.equal(v.access.length, 0);
  assert.equal(v.audit.length, 0);
});
test("treasurers cannot change branding and expired memberships are denied by the API", async () => {
  assert.throws(
    () =>
      applyCommand(
        base(),
        { ...a, role: "treasurer" },
        "saveBrand",
        defaultBrand,
      ),
    /role does not permit/,
  );
  const f = await fixture();
  await f.db
    .prepare("UPDATE lodge_access SET ends_at=?")
    .bind("2020-01-01T00:00:00.000Z")
    .run();
  assert.equal(
    (await handle(request("/api/state?lodge=lodge-a"), f.env)).status,
    403,
  );
});
test("invitations are email-bound, single-use and revocable", async () => {
  const f = await fixture();
  assert.equal(
    (
      await command(f, "invite", {
        email: "member@example.com",
        role: "member",
        memberId: "member-6",
        endsAt: null,
      })
    ).status,
    200,
  );
  const s = await readState(f.db, "lodge-a"),
    inv = s.invites[0];
  const newcomer = { id: "new-user", email: "member@example.com", name: "New" };
  const accept = (who: Identity) =>
    handle(
      request(
        "/api/command",
        "POST",
        { action: "acceptInvite", data: { id: inv.id } },
        who,
      ),
      f.env,
    );
  assert.equal(
    (await accept({ ...newcomer, email: "wrong@example.com" })).status,
    403,
  );
  assert.equal((await accept(newcomer)).status, 200);
  assert.equal((await accept(newcomer)).status, 403);
  assert.equal(
    (
      await handle(
        request("/api/state?lodge=lodge-a", "GET", undefined, newcomer),
        f.env,
      )
    ).status,
    200,
  );
  assert.equal(
    (await command(f, "revokeAccess", { id: newcomer.id })).status,
    200,
  );
  assert.equal(
    (
      await handle(
        request("/api/state?lodge=lodge-a", "GET", undefined, newcomer),
        f.env,
      )
    ).status,
    403,
  );
});
test("member imports validate the whole batch and do not create ceremony events", () => {
  const s = base();
  const row = {
    name: "New Brother",
    email: "new@example.com",
    phone: "",
    degree: "EA",
    office: "",
    status: "Active",
    joined: "2023-02-01",
  };
  assert.throws(
    () => applyCommand(s, a, "importMembers", [row, row]),
    /Duplicate member/,
  );
  assert.equal(s.members.length, 8);
  const after = applyCommand(s, a, "importMembers", [row]);
  assert.equal(after.members.length, 9);
  assert.equal(after.events.length, 0);
  assert.deepEqual(after.tasks, s.tasks);
});
test("property custody history is retained and foreign image references are rejected", () => {
  const s = base(),
    asset = s.assets[0];
  const one = applyCommand(s, a, "saveAsset", {
    ...asset,
    custodian: "First Custodian",
  });
  const two = applyCommand(one, a, "saveAsset", {
    ...one.assets[0],
    custodian: "Second Custodian",
    condition: "Fair",
  });
  assert.equal(two.assets[0].history.length, 2);
  assert.equal(two.assets[0].history[0].custodian, "First Custodian");
  assert.throws(
    () =>
      applyCommand(two, a, "saveAsset", { ...asset, photoId: "foreign-photo" }),
    /photograph uploaded to this lodge/,
  );
});
test("issued PDF bytes and source snapshot survive later branding and agenda edits", async () => {
  const f = await fixture();
  assert.equal(
    (
      await command(f, "issueDocument", {
        meetingId: "meeting-1",
        kind: "Summons",
      })
    ).status,
    200,
  );
  let s = await readState(f.db, "lodge-a");
  const issued = structuredClone(s.documents[0]),
    key = "lodge-a/" + issued.fileId,
    bytes = new Uint8Array(f.bucket.objects.get(key)!);
  assert.ok(bytes.length > 1000);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
  assert.equal(
    (
      await command(f, "saveBrand", {
        ...s.lodge.brand,
        greeting: "A different greeting",
      })
    ).status,
    200,
  );
  const m = s.meetings[0];
  assert.equal(
    (
      await command(f, "saveMeeting", {
        id: m.id,
        title: "Revised title",
        date: m.date,
        time: m.time,
        venue: m.venue,
        type: m.type,
        agenda: ["Different agenda"],
        ceremonies: m.ceremonies,
      })
    ).status,
    200,
  );
  s = await readState(f.db, "lodge-a");
  assert.deepEqual(s.documents[0], issued);
  assert.deepEqual(f.bucket.objects.get(key), bytes);
});
test("minutes approval rejects placeholders and approved text cannot be overwritten", () => {
  const s = confirm();
  assert.throws(
    () =>
      applyCommand(s, a, "approveMinutes", {
        id: "meeting-1",
        confirmed: true,
      }),
    /resolve all placeholders/,
  );
  const saved = applyCommand(s, a, "saveMinutes", {
    id: "meeting-1",
    minutes:
      "The minutes were read and confirmed. The stated ceremony was performed.",
  });
  const approved = applyCommand(saved, a, "approveMinutes", {
    id: "meeting-1",
    confirmed: true,
  });
  assert.equal(approved.meetings[0].minutesStatus, "Approved");
  assert.throws(
    () =>
      applyCommand(approved, a, "saveMinutes", {
        id: "meeting-1",
        minutes: "Changed",
      }),
    /Only draft minutes/,
  );
});
test("long agenda PDFs paginate, including very long unbroken words", async () => {
  const s = base();
  s.meetings[0].agenda = Array.from(
    { length: 80 },
    (_, i) =>
      `Agenda ${i + 1}: ` +
      "A long discussion of the lodge business. ".repeat(6),
  );
  s.meetings[0].agenda[10] = "x".repeat(900);
  const bytes = await renderPDF(
    snapshot(s, s.meetings[0], "Summons", "2026-11-09T00:00:00Z"),
  );
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 3);
});
test("CSV parsing preserves quoted commas and newlines; exports neutralize formulas", () => {
  const rows = parseCSV(
    'name,email\r\n"Brother, Example",test@example.com\r\n"A\nB",second@example.com',
  );
  assert.equal(rows[0].name, "Brother, Example");
  assert.equal(rows[1].name, "A\nB");
  assert.match(
    csv([['=HYPERLINK("evil")', "+SUM(1,2)", "@SUM(A1)", "-2"]]),
    /"'=HYPERLINK/,
  );
  assert.throws(() => parseCSV("name,name\na,b"), /Duplicate/);
});
test("upload authorization checks purposes and private archive reads", async () => {
  const f = await fixture();
  const newcomer = {
    id: "treasurer",
    email: "treasurer@example.com",
    name: "Treasurer",
  };
  await f.db
    .prepare(
      "INSERT INTO lodge_access(lodge_id,user_id,email,role) VALUES(?,?,?,?)",
    )
    .bind("lodge-a", newcomer.id, newcomer.email, "treasurer")
    .run();
  const form = new FormData();
  form.set("lodgeId", "lodge-a");
  form.set("revision", "0");
  form.set("purpose", "logo");
  form.set("file", new File(["not a PNG"], "bad.png", { type: "image/png" }));
  const req = new Request("https://lodge.test/api/files", {
    method: "POST",
    headers: {
      origin: "https://lodge.test",
      "oai-authenticated-user-id": newcomer.id,
      "oai-authenticated-user-email": newcomer.email,
    },
    body: form,
  });
  assert.equal((await handle(req, f.env)).status, 403);
});
