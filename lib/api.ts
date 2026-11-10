import { kingstonCrest } from "./kingston-crest";
import { z } from "zod";
import { AppError, applyCommand, assert, lodgeFields, permit } from "./domain";
import {
  defaultBrand,
  emptyState,
  id,
  snapshot,
  visibleState,
  type Identity,
  type Invitation,
  type Lodge,
  type Role,
  type StateResponse,
} from "./model";
import { sampleState } from "./sample";
import { commitState, createLodge, readState, requireAccess } from "./store";
import { renderPDF } from "./pdf";
type Bindings = { DB?: D1Database; BUCKET?: R2Bucket };
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
function identity(req: Request): Identity | null {
  const uid = req.headers.get("oai-authenticated-user-id"),
    email = req.headers.get("oai-authenticated-user-email")?.toLowerCase();
  if (!uid || !email) return null;
  let name = req.headers.get("oai-authenticated-user-full-name") || email;
  if (
    req.headers.get("oai-authenticated-user-full-name-encoding") ===
    "percent-encoded-utf-8"
  ) {
    try {
      name = decodeURIComponent(name);
    } catch {
      name = email;
    }
  }
  return { id: uid, email, name };
}
async function body(req: Request) {
  assert(
    req.headers.get("content-type")?.includes("application/json"),
    "Use JSON for this action.",
    415,
  );
  const text = await req.text();
  assert(text.length <= 2_000_000, "Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Invalid JSON.");
  }
}
async function logoBytes(
  bucket: R2Bucket,
  lodgeId: string,
  logoId: string,
  presetLogo?: string,
) {
  if (!logoId)
    return presetLogo === "kingston"
      ? Uint8Array.from(atob(kingstonCrest.split(",")[1]), (c) =>
          c.charCodeAt(0),
        )
      : undefined;
  const o = await bucket.get(`${lodgeId}/${logoId}`);
  return o ? new Uint8Array(await o.arrayBuffer()) : undefined;
}
const actionLabel = (action: string) =>
  action.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
export async function handle(req: Request, env: Bindings): Promise<Response> {
  try {
    assert(
      env.DB && env.BUCKET,
      "The lodge database and file storage are not connected yet.",
      503,
    );
    const db = env.DB,
      bucket = env.BUCKET,
      url = new URL(req.url),
      user = identity(req),
      now = new Date().toISOString();
    if (req.method === "GET" && url.pathname === "/api/state") {
      if (!user)
        return json({
          user: null,
          lodges: [],
          state: sampleState(),
          role: "secretary",
          demo: true,
          pendingInvites: [],
        } satisfies StateResponse);
      const rows = await db
        .prepare(
          "SELECT l.id,l.config,a.role FROM lodges l JOIN lodge_access a ON l.id=a.lodge_id WHERE a.user_id=? AND (a.ends_at IS NULL OR a.ends_at>?) ORDER BY l.created_at",
        )
        .bind(user.id, now)
        .all<{ id: string; config: string; role: Role }>();
      const lodges = rows.results.map((r) => {
        const l: Lodge = JSON.parse(r.config);
        return {
          id: r.id,
          name: l.name,
          number: l.number,
          sample: l.sample,
          role: r.role,
        };
      });
      const pending = await db
        .prepare(
          "SELECT i.id,i.email,i.role,i.member_id AS memberId,i.ends_at AS endsAt,i.expires_at AS expiresAt,l.config FROM invites i JOIN lodges l ON i.lodge_id=l.id WHERE i.email=? AND i.accepted_by IS NULL AND i.expires_at>? AND (i.ends_at IS NULL OR i.ends_at>?)",
        )
        .bind(user.email, now, now)
        .all<Invitation & { config: string }>();
      const pendingInvites = pending.results.map(({ config, ...i }) => ({
        ...i,
        lodgeName: (JSON.parse(config) as Lodge).name,
      }));
      const selected = url.searchParams.get("lodge") || lodges[0]?.id;
      if (!selected)
        return json({
          user,
          lodges,
          state: sampleState(),
          role: "secretary",
          demo: true,
          pendingInvites,
        } satisfies StateResponse);
      const a = await requireAccess(db, selected, user),
        state = await readState(db, selected);
      return json({
        user,
        lodges,
        state: visibleState(state, a),
        role: a.role,
        demo: false,
        pendingInvites,
      } satisfies StateResponse);
    }
    assert(user, "Sign in to use your lodge workspace.", 401);
    if (req.method !== "GET")
      assert(
        req.headers.get("origin") === url.origin,
        "Request origin is not allowed.",
        403,
      );
    if (req.method === "POST" && url.pathname === "/api/command") {
      const input = z
        .object({
          action: z.string(),
          lodgeId: z.string().optional(),
          revision: z.number().int().nonnegative().optional(),
          data: z.unknown(),
        })
        .parse(await body(req));
      if (input.action === "createLodge") {
        const d = lodgeFields.extend({ sample: z.boolean() }).parse(input.data);
        const count = await db
          .prepare(
            "SELECT COUNT(*) AS n FROM lodge_access WHERE user_id=? AND role='secretary'",
          )
          .bind(user.id)
          .first<{ n: number }>();
        assert(
          (count?.n || 0) < 20,
          "The pilot allows up to 20 lodge workspaces per secretary.",
        );
        const lodge: Lodge = {
          ...d,
          id: id(),
          brand: structuredClone(defaultBrand),
          plan: "Complimentary pilot",
        };
        const s = d.sample ? sampleState(lodge) : emptyState(lodge);
        await createLodge(db, s, user);
        return json({ ok: true, lodgeId: lodge.id });
      }
      if (input.action === "acceptInvite") {
        const d = z.object({ id: z.string() }).parse(input.data);
        const invite = await db
          .prepare(
            "SELECT id,lodge_id AS lodgeId,email,role,member_id AS memberId,ends_at AS endsAt,expires_at AS expiresAt,accepted_by AS acceptedBy FROM invites WHERE id=?",
          )
          .bind(d.id)
          .first<Invitation & { lodgeId: string }>();
        assert(
          invite &&
            invite.email === user.email &&
            !invite.acceptedBy &&
            invite.expiresAt > now &&
            (!invite.endsAt || invite.endsAt > now),
          "This invitation is unavailable for your signed-in email.",
          403,
        );
        const before = await readState(db, invite.lodgeId);
        assert(
          !before.access.some((a) => a.userId === user.id),
          "You already have access to this lodge.",
        );
        await commitState(
          db,
          before,
          before,
          user,
          "Accepted lodge invitation",
          [
            db
              .prepare(
                "INSERT INTO lodge_access(lodge_id,user_id,email,role,member_id,ends_at) VALUES(?,?,?,?,?,?)",
              )
              .bind(
                invite.lodgeId,
                user.id,
                user.email,
                invite.role,
                invite.memberId,
                invite.endsAt,
              ),
            db
              .prepare("UPDATE invites SET accepted_by=? WHERE id=?")
              .bind(user.id, invite.id),
          ],
          invite.id,
        );
        return json({ ok: true, lodgeId: invite.lodgeId });
      }
      assert(input.lodgeId, "Choose a lodge.");
      const a = await requireAccess(db, input.lodgeId, user),
        before = await readState(db, input.lodgeId);
      assert(
        before.access.some((x) => x.userId === a.userId && x.role === a.role),
        "Your role changed. Refresh the workspace.",
        409,
      );
      assert(
        input.revision === before.revision,
        "The workspace changed. Refresh before saving.",
        409,
      );
      if (input.action === "invite") {
        permit(a, ["secretary"]);
        const d = z
          .object({
            email: z.string().trim().toLowerCase().email(),
            role: z.enum(["secretary", "master", "treasurer", "member"]),
            memberId: z.string().nullable(),
            endsAt: z.string().datetime().nullable(),
          })
          .parse(input.data);
        assert(
          !d.endsAt || d.endsAt > now,
          "Role expiry must be in the future.",
        );
        assert(
          !d.memberId || before.members.some((m) => m.id === d.memberId),
          "Choose a lodge member.",
        );
        assert(
          d.role !== "member" || d.memberId,
          "Link a member account to its membership record.",
        );
        assert(
          !before.access.some((x) => x.email === d.email) &&
            !before.invites.some(
              (i) => i.email === d.email && i.expiresAt > now,
            ),
          "This email already has lodge access or a pending invitation.",
        );
        const inviteId = id();
        await commitState(
          db,
          before,
          before,
          user,
          "Created access invitation",
          [
            db
              .prepare(
                "INSERT INTO invites(id,lodge_id,email,role,member_id,ends_at,expires_at) VALUES(?,?,?,?,?,?,?)",
              )
              .bind(
                inviteId,
                before.lodge.id,
                d.email,
                d.role,
                d.memberId,
                d.endsAt,
                new Date(Date.now() + 7 * 86400000).toISOString(),
              ),
          ],
        );
        return json({ ok: true });
      }
      if (input.action === "revokeAccess" || input.action === "revokeInvite") {
        permit(a, ["secretary"]);
        const d = z.object({ id: z.string() }).parse(input.data);
        const isAccess = input.action === "revokeAccess";
        assert(
          !isAccess || d.id !== user.id,
          "You cannot remove your own secretary access.",
        );
        assert(
          isAccess
            ? before.access.some((x) => x.userId === d.id)
            : before.invites.some((x) => x.id === d.id),
          "Access record not found.",
        );
        const sql = isAccess
          ? "DELETE FROM lodge_access WHERE lodge_id=? AND user_id=?"
          : "DELETE FROM invites WHERE lodge_id=? AND id=?";
        await commitState(db, before, before, user, actionLabel(input.action), [
          db.prepare(sql).bind(before.lodge.id, d.id),
        ]);
        return json({ ok: true });
      }
      if (input.action === "issueDocument") {
        permit(a, ["secretary"]);
        const d = z
          .object({
            meetingId: z.string(),
            kind: z.enum(["Summons", "Minutes"]),
          })
          .parse(input.data);
        const m = before.meetings.find((m) => m.id === d.meetingId);
        assert(m, "Meeting not found.");
        assert(
          d.kind === "Summons"
            ? m.status === "Planned"
            : m.status === "Completed" && m.minutesStatus === "Approved",
          "Summons require a planned meeting; minutes require approval.",
        );
        const snap = snapshot(before, m, d.kind, now),
          fileId = id(),
          key = before.lodge.id + "/" + fileId;
        const bytes = await renderPDF(
          snap,
          await logoBytes(
            bucket,
            before.lodge.id,
            before.lodge.brand.logoId,
            before.lodge.brand.presetLogo,
          ),
        );
        const after = structuredClone(before);
        after.files.push({
          id: fileId,
          name: `${d.kind}-${m.date}.pdf`,
          mime: "application/pdf",
          size: bytes.length,
          purpose: "document",
          createdAt: now,
        });
        after.documents.push({
          id: id(),
          meetingId: m.id,
          title: `${d.kind} · ${m.title}`,
          kind: d.kind,
          issuedAt: now,
          fileId,
          snapshot: snap,
        });
        await bucket.put(key, bytes, {
          httpMetadata: { contentType: "application/pdf" },
        });
        try {
          await commitState(
            db,
            before,
            after,
            user,
            `Issued ${d.kind.toLowerCase()}`,
          );
        } catch (e) {
          await bucket.delete(key);
          throw e;
        }
        return json({ ok: true, fileId });
      }
      const after = applyCommand(before, a, input.action, input.data);
      await commitState(db, before, after, user, actionLabel(input.action));
      return json({ ok: true });
    }
    if (req.method === "GET" && url.pathname === "/api/document") {
      const lid = url.searchParams.get("lodge") || "",
        a = await requireAccess(db, lid, user);
      permit(a, ["secretary", "master"]);
      const s = await readState(db, lid),
        m = s.meetings.find((m) => m.id === url.searchParams.get("meeting"));
      assert(m, "Meeting not found.", 404);
      const kind =
        url.searchParams.get("kind") === "Minutes" ? "Minutes" : "Summons";
      const bytes = await renderPDF(
        snapshot(s, m, kind, now),
        await logoBytes(
          bucket,
          lid,
          s.lodge.brand.logoId,
          s.lodge.brand.presetLogo,
        ),
        true,
      );
      return new Response(bytes as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="draft.pdf"',
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (req.method === "GET" && url.pathname === "/api/files") {
      const lid = url.searchParams.get("lodge") || "",
        a = await requireAccess(db, lid, user),
        s = visibleState(await readState(db, lid), a),
        f = s.files.find((f) => f.id === url.searchParams.get("id"));
      assert(f, "File not found or not accessible.", 404);
      const object = await bucket.get(lid + "/" + f.id);
      assert(object, "File is unavailable.", 404);
      return new Response(object.body, {
        headers: {
          "Content-Type": f.mime,
          "Content-Disposition": `${f.mime === "image/png" ? "inline" : "attachment"}; filename="${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (req.method === "POST" && url.pathname === "/api/files") {
      assert(
        req.headers.get("content-type")?.includes("multipart/form-data"),
        "Use a file upload.",
        415,
      );
      assert(
        Number(req.headers.get("content-length") || 0) <= 11_000_000,
        "Maximum upload size is 10 MB.",
        413,
      );
      const form = await req.formData(),
        lid = String(form.get("lodgeId") || ""),
        purpose = z
          .enum(["logo", "asset", "archive"])
          .parse(form.get("purpose"));
      const a = await requireAccess(db, lid, user);
      permit(
        a,
        purpose === "asset" ? ["secretary", "treasurer"] : ["secretary"],
      );
      const before = await readState(db, lid);
      assert(
        before.access.some((x) => x.userId === a.userId && x.role === a.role),
        "Your lodge role changed. Refresh before uploading.",
        409,
      );
      assert(
        Number(form.get("revision")) === before.revision,
        "The workspace changed. Refresh before uploading.",
        409,
      );
      const file = form.get("file");
      assert(
        file instanceof File && file.size > 0 && file.size <= 10_000_000,
        "Choose a file up to 10 MB.",
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      let mime = file.type;
      if (purpose === "logo" || purpose === "asset") {
        assert(
          file.size <= 2_000_000 &&
            bytes.length > 24 &&
            [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) &&
            String.fromCharCode(...bytes.slice(12, 16)) === "IHDR",
          "Upload a PNG image up to 2 MB.",
        );
        const v = new DataView(bytes.buffer),
          w = v.getUint32(16),
          h = v.getUint32(20);
        assert(
          w > 0 && h > 0 && w * h <= 16_000_000,
          "Image dimensions are too large.",
        );
        mime = "image/png";
      } else {
        const extension = file.name.split(".").at(-1)?.toLowerCase();
        const pdf =
          extension === "pdf" &&
          String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
        const zip =
          ["docx", "xlsx"].includes(extension || "") &&
          bytes[0] === 80 &&
          bytes[1] === 75;
        assert(pdf || zip, "Archive accepts PDF, DOCX and XLSX files.");
        mime = pdf
          ? "application/pdf"
          : extension === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
      const fileId = id(),
        key = lid + "/" + fileId,
        after = structuredClone(before);
      after.files.push({
        id: fileId,
        name: file.name.slice(0, 180),
        mime,
        size: bytes.length,
        purpose,
        createdAt: now,
      });
      await bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
      try {
        await commitState(db, before, after, user, `Uploaded ${purpose} file`);
      } catch (e) {
        await bucket.delete(key);
        throw e;
      }
      return json({ ok: true, fileId });
    }
    throw new AppError("Route not found.", 404);
  } catch (e) {
    if (e instanceof z.ZodError)
      return json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (e instanceof AppError) return json({ error: e.message }, e.status);
    console.error(
      "Lodge request failed",
      e instanceof Error ? e.name : "Unknown error",
    );
    return json(
      {
        error: "Unable to complete this request. Please refresh and try again.",
      },
      500,
    );
  }
}
