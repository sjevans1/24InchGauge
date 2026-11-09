import { AppError, assert } from "./domain";
import {
  emptyState,
  id,
  type Access,
  type Identity,
  type Lodge,
  type State,
} from "./model";
export const kinds = [
  "members",
  "meetings",
  "tasks",
  "journal",
  "assets",
  "events",
  "documents",
  "files",
] as const;
export async function readState(
  db: D1Database,
  lodgeId: string,
): Promise<State> {
  const row = await db
    .prepare("SELECT config, revision FROM lodges WHERE id = ?")
    .bind(lodgeId)
    .first<{ config: string; revision: number }>();
  assert(row, "Lodge not found.", 404);
  const s = emptyState(JSON.parse(row.config) as Lodge);
  s.revision = row.revision;
  const [records, access, audit, invites] = await Promise.all([
    db
      .prepare(
        "SELECT kind, data FROM records WHERE lodge_id = ? ORDER BY rowid",
      )
      .bind(lodgeId)
      .all<{ kind: (typeof kinds)[number]; data: string }>(),
    db
      .prepare(
        "SELECT user_id AS userId, email, role, member_id AS memberId, ends_at AS endsAt FROM lodge_access WHERE lodge_id = ?",
      )
      .bind(lodgeId)
      .all<Access>(),
    db
      .prepare(
        "SELECT id, actor, action, created_at AS at FROM audit WHERE lodge_id = ? ORDER BY created_at DESC LIMIT 500",
      )
      .bind(lodgeId)
      .all<State["audit"][number]>(),
    db
      .prepare(
        "SELECT id,email,role,member_id AS memberId,ends_at AS endsAt,expires_at AS expiresAt,accepted_by AS acceptedBy FROM invites WHERE lodge_id = ? AND accepted_by IS NULL",
      )
      .bind(lodgeId)
      .all<State["invites"][number]>(),
  ]);
  for (const r of records.results)
    if (kinds.includes(r.kind))
      (s[r.kind] as unknown[]).push(JSON.parse(r.data));
  s.access = access.results;
  s.audit = audit.results;
  s.invites = invites.results;
  return s;
}
export async function requireAccess(
  db: D1Database,
  lodgeId: string,
  user: Identity,
): Promise<Access> {
  const a = await db
    .prepare(
      "SELECT user_id AS userId,email,role,member_id AS memberId,ends_at AS endsAt FROM lodge_access WHERE lodge_id = ? AND user_id = ?",
    )
    .bind(lodgeId, user.id)
    .first<Access>();
  assert(
    a && (!a.endsAt || Date.parse(a.endsAt) > Date.now()),
    "You do not have an active role in this lodge.",
    403,
  );
  return a;
}
export async function createLodge(db: D1Database, s: State, user: Identity) {
  const now = new Date().toISOString();
  const lid = s.lodge.id;
  const queries = [
    db
      .prepare(
        "INSERT INTO lodges(id,config,revision,created_at) VALUES(?,?,0,?)",
      )
      .bind(lid, JSON.stringify(s.lodge), now),
    db
      .prepare(
        "INSERT INTO lodge_access(lodge_id,user_id,email,role,member_id,ends_at) VALUES(?,?,?,'secretary',NULL,NULL)",
      )
      .bind(lid, user.id, user.email),
    db
      .prepare(
        "INSERT INTO audit(id,lodge_id,actor,action,created_at) VALUES(?,?,?,?,?)",
      )
      .bind(
        id(),
        lid,
        user.email,
        s.lodge.sample
          ? "Created fictional sample workspace"
          : "Created lodge workspace",
        now,
      ),
  ];
  for (const kind of kinds)
    for (const record of s[kind])
      queries.push(
        db
          .prepare("INSERT INTO records(lodge_id,id,kind,data) VALUES(?,?,?,?)")
          .bind(lid, record.id, kind, JSON.stringify(record)),
      );
  await db.batch(queries);
}
export async function commitState(
  db: D1Database,
  before: State,
  after: State,
  user: Identity,
  action: string,
  extra: D1PreparedStatement[] = [],
  invitationId?: string,
) {
  const lid = before.lodge.id,
    now = new Date().toISOString(),
    guard = id(),
    authGuard = id();
  const access = before.access.find((a) => a.userId === user.id);
  assert(invitationId || access, "Lodge access was removed.", 403);
  const authorization = invitationId
    ? db
        .prepare(
          "INSERT INTO transaction_guards(id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM invites WHERE id=? AND lodge_id=? AND email=? AND accepted_by IS NULL AND expires_at>? AND (ends_at IS NULL OR ends_at>?)) THEN 1 ELSE 0 END",
        )
        .bind(authGuard, invitationId, lid, user.email, now, now)
    : db
        .prepare(
          "INSERT INTO transaction_guards(id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM lodge_access WHERE lodge_id=? AND user_id=? AND role=? AND (ends_at IS NULL OR ends_at>?)) THEN 1 ELSE 0 END",
        )
        .bind(authGuard, lid, user.id, access!.role, now);
  const queries = [
    authorization,
    db
      .prepare(
        "INSERT INTO transaction_guards(id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM lodges WHERE id=? AND revision=?) THEN 1 ELSE 0 END",
      )
      .bind(guard, lid, before.revision),
  ];
  for (const kind of kinds) {
    const old = new Map(before[kind].map((r) => [r.id, JSON.stringify(r)]));
    for (const r of after[kind])
      if (old.get(r.id) !== JSON.stringify(r))
        queries.push(
          db
            .prepare(
              "INSERT INTO records(lodge_id,id,kind,data) VALUES(?,?,?,?) ON CONFLICT(lodge_id,id) DO UPDATE SET data=excluded.data",
            )
            .bind(lid, r.id, kind, JSON.stringify(r)),
        );
  }
  queries.push(
    ...extra,
    db
      .prepare("UPDATE lodges SET config=?,revision=revision+1 WHERE id=?")
      .bind(JSON.stringify(after.lodge), lid),
    db
      .prepare(
        "INSERT INTO audit(id,lodge_id,actor,action,created_at) VALUES(?,?,?,?,?)",
      )
      .bind(id(), lid, user.email, action, now),
    db
      .prepare("DELETE FROM transaction_guards WHERE id IN (?,?)")
      .bind(guard, authGuard),
  );
  try {
    await db.batch(queries);
  } catch (error) {
    if (
      String(error).includes("guard_valid") ||
      String(error).includes("CHECK constraint failed")
    )
      throw new AppError(
        "The workspace or your access changed. Refresh before trying again.",
        409,
      );
    throw error;
  }
}
