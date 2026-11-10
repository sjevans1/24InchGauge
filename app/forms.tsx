"use client";
import { nextMeeting, scheduleFor, kingstonVenue } from "@/lib/calendar";
import { useState } from "react";
import {
  Plus,
  Upload,
  Check,
  Download,
  Trash2,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  degrees,
  displayDate,
  memberBalance,
  money,
  today,
  type Member,
  type Meeting,
  type Asset,
} from "@/lib/model";
import { parseCSV, csv } from "@/lib/csv";
import { useApp, type ModalSpec } from "./context";
import { Avatar, Badge, Empty, Field, Modal, download } from "./components";
const values = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
const cents = (value: string) =>
  /^\d+(\.\d{1,2})?$/.test(value) ? Math.round(Number(value) * 100) : NaN;
function Buttons({ label = "Save changes" }: { label?: string }) {
  const { busy, close } = useApp();
  return (
    <div className="form-actions">
      <button type="button" className="secondary" onClick={close}>
        Cancel
      </button>
      <button className="primary" disabled={busy}>
        {busy ? "Saving…" : label}
        <Check size={15} />
      </button>
    </div>
  );
}
function MemberSelect({
  name = "memberId",
  defaultValue = "",
  required = false,
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const { s } = useApp();
  return (
    <select name={name} defaultValue={defaultValue} required={required}>
      <option value="">
        {required ? "Select a brother" : "Unassigned / none"}
      </option>
      {s.members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
export function Forms({ spec }: { spec: ModalSpec }) {
  const { close, error, data } = useApp();
  const titles: Record<string, string> = {
    create: "Create your lodge workspace",
    member: spec.data ? "Edit member" : "Add a brother",
    memberDetail: "Membership record",
    meeting: spec.data ? "Edit meeting" : "Plan a meeting",
    confirmMeeting: "Confirm the meeting was held",
    cancelMeeting: "Cancel planned meeting",
    minutes: "Minutes of the meeting",
    task: spec.data ? "Edit task" : "Add a task",
    journal: "Record a financial entry",
    journalDetail: "Journal entry",
    reverseJournal: "Reverse a journal entry",
    asset: spec.data ? "Property record" : "Add a property item",
    assetDetail: "Property record",
    import: "Import the membership register",
    invite: "Invite an officer or member",
    revokeAccess: "Remove lodge access",
    correctDegree: "Correct a degree record",
  };
  return (
    <Modal
      title={titles[spec.kind] || "Lodge workspace"}
      onClose={close}
      wide={[
        "meeting",
        "confirmMeeting",
        "minutes",
        "import",
        "asset",
      ].includes(spec.kind)}
    >
      {data.demo && (
        <p className="notice" style={{ margin: "18px 28px 0" }}>
          This is a read-only tour with fictional records. Sign in and create a
          workspace to save changes.
        </p>
      )}
      {error && (
        <div className="error-banner modal-error" role="alert">
          {error}
        </div>
      )}
      {spec.kind === "create" ? (
        <Create />
      ) : spec.kind === "member" ? (
        <MemberForm member={spec.data} />
      ) : spec.kind === "memberDetail" ? (
        <MemberDetail member={spec.data} />
      ) : spec.kind === "meeting" ? (
        <MeetingForm meeting={spec.data} />
      ) : spec.kind === "confirmMeeting" ? (
        <ConfirmMeeting meeting={spec.data} />
      ) : spec.kind === "minutes" ? (
        <Minutes meeting={spec.data} />
      ) : spec.kind === "task" ? (
        <TaskForm task={spec.data} />
      ) : spec.kind === "journal" ? (
        <JournalForm />
      ) : spec.kind === "journalDetail" ? (
        <JournalDetail entry={spec.data} />
      ) : spec.kind === "asset" || spec.kind === "assetDetail" ? (
        <AssetForm asset={spec.data} readonly={spec.kind === "assetDetail"} />
      ) : spec.kind === "import" ? (
        <ImportForm />
      ) : spec.kind === "invite" ? (
        <Invite />
      ) : (
        <ReasonForm spec={spec} />
      )}
    </Modal>
  );
}
function Create() {
  const { command, close } = useApp();
  const [sample, setSample] = useState(false);
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await command("createLodge", { ...values(e.currentTarget), sample })
        )
          close();
      }}
    >
      <p className="muted">
        Begin with an empty register, or create a separate workspace of
        fictional records for trying the workflows.
      </p>
      <div className="choice-row">
        <button
          type="button"
          className={!sample ? "chosen" : ""}
          onClick={() => setSample(false)}
        >
          <b>My lodge</b>
          <small>Start with empty, live records</small>
        </button>
        <button
          type="button"
          className={sample ? "chosen" : ""}
          onClick={() => setSample(true)}
        >
          <b>Sample workspace</b>
          <small>Explore with fictional records</small>
        </button>
      </div>
      <Field label="Lodge name">
        <input name="name" required defaultValue="The Kingston Lodge" />
      </Field>
      <div className="form-grid">
        <Field label="Lodge number">
          <input name="number" required defaultValue="1933" />
        </Field>
        <Field label="Constitution">
          <select name="constitution">
            <option>English</option>
            <option>Scottish</option>
            <option>Irish</option>
          </select>
        </Field>
      </div>
      <Field label="Meeting venue">
        <input name="venue" required defaultValue={kingstonVenue} />
      </Field>
      <Field label="Ledger currency">
        <select name="currency">
          <option>JMD</option>
          <option>KYD</option>
          <option>USD</option>
        </select>
      </Field>
      <p className="notice">
        You will be the secretary of this workspace. This founding pilot has no
        subscription charge.
      </p>
      <Buttons
        label={sample ? "Create sample workspace" : "Create lodge workspace"}
      />
    </form>
  );
}
function MemberForm({ member: m }: { member?: Member }) {
  const { command, close } = useApp();
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        if (
          await command("saveMember", {
            ...d,
            degree: m?.degree || d.degree,
            ...(m ? { id: m.id } : {}),
          })
        )
          close();
      }}
    >
      <Field label="Full name">
        <input required name="name" defaultValue={m?.name} />
      </Field>
      <div className="form-grid">
        <Field label="Email">
          <input type="email" name="email" defaultValue={m?.email} />
        </Field>
        <Field label="Telephone">
          <input name="phone" type="tel" defaultValue={m?.phone} />
        </Field>
        <Field
          label="Current degree"
          hint={
            m
              ? "Advancements are recorded from a confirmed ceremony."
              : undefined
          }
        >
          <select
            name="degree"
            disabled={!!m}
            defaultValue={m?.degree || "Candidate"}
          >
            {degrees.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={m?.status || "Active"}>
            {["Active", "Resigned", "Deceased", "Suspended"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Office">
          <input
            name="office"
            defaultValue={m?.office}
            placeholder="e.g. Senior Warden"
          />
        </Field>
        <Field label="Date joined">
          <input
            name="joined"
            required
            type="date"
            defaultValue={m?.joined || today()}
          />
        </Field>
      </div>
      <Buttons label={m ? "Save member" : "Add brother"} />
    </form>
  );
}
function MemberDetail({ member }: { member: Member }) {
  const { s, data, open } = useApp();
  const m = s.members.find((m) => m.id === member.id) || member,
    events = s.events.filter((e) => e.memberId === m.id),
    attend = s.meetings.filter(
      (meeting) =>
        meeting.status === "Completed" && meeting.attendance.includes(m.id),
    );
  return (
    <div className="modal-body">
      <div className="member-profile">
        <Avatar name={m.name} large />
        <div>
          <h2>{m.name}</h2>
          <p>
            {m.office || "Member"} · <Badge>{m.degree}</Badge>
          </p>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <small>Status</small>
          <b>{m.status}</b>
        </div>
        <div>
          <small>Joined</small>
          <b>{displayDate(m.joined)}</b>
        </div>
        <div>
          <small>Email</small>
          <b>{m.email || "—"}</b>
        </div>
        <div>
          <small>Telephone</small>
          <b>{m.phone || "—"}</b>
        </div>
      </div>
      {data.role !== "member" || s.journal.some((j) => j.memberId === m.id) ? (
        <div className="member-finance">
          <span>Recorded dues balance</span>
          <b>{money(memberBalance(s, m.id), s.lodge.currency)}</b>
        </div>
      ) : null}
      {data.role === "secretary" && (
        <button className="secondary" onClick={() => open("member", m)}>
          Edit member details
        </button>
      )}
      <h3>Degree history</h3>
      {events.length ? (
        events.map((e, i) => (
          <div className="history-item" key={e.id}>
            <span className="activity-dot" />
            <div>
              <b>
                {e.from} → {e.to}
                {e.correctionOf ? " · Correction" : ""}
              </b>
              <small>
                {displayDate(e.date)}
                {e.reason ? " · " + e.reason : ""}
              </small>
            </div>
            {data.role === "secretary" &&
              i === events.length - 1 &&
              !e.correctionOf && (
                <button
                  className="text-button"
                  onClick={() => open("correctDegree", e)}
                >
                  Correct
                </button>
              )}
          </div>
        ))
      ) : (
        <p className="muted">
          Current degree is the opening record. Future confirmed ceremonies will
          be recorded here.
        </p>
      )}
      {data.role !== "member" && (
        <>
          <h3>Recorded attendance</h3>
          <p className="muted">
            {attend.length} completed meetings. Historical attendance has not
            been imported.
          </p>
          {attend.map((m) => (
            <p key={m.id}>
              {displayDate(m.date)} · {m.title}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
function MeetingForm({ meeting: m }: { meeting?: Meeting }) {
  const { s, command, close } = useApp(),
    [ceremonies, setCeremonies] = useState(m?.ceremonies || []),
    [candidate, setCandidate] = useState("");
  const planned = nextMeeting(s.lodge, today());
  const eligible = s.members.filter(
    (b) =>
      b.status === "Active" &&
      b.degree !== "MM" &&
      !ceremonies.some((c) => c.memberId === b.id),
  );
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        if (
          await command("saveMeeting", {
            ...d,
            agenda: d.agenda
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean),
            ceremonies,
            ...(m ? { id: m.id } : {}),
          })
        )
          close();
      }}
    >
      <Field label="Meeting title">
        <input
          name="title"
          required
          defaultValue={
            m?.title ||
            (planned ? `${planned.month} ${planned.type} Meeting` : "")
          }
          placeholder="Regular meeting"
        />
      </Field>
      <div className="form-grid thirds">
        <Field label="Date">
          <input
            name="date"
            type="date"
            required
            defaultValue={m?.date || planned?.date || today()}
          />
        </Field>
        <Field label="Time">
          <input
            name="time"
            type="time"
            required
            defaultValue={m?.time || scheduleFor(s.lodge)?.time || "18:30"}
          />
        </Field>
        <Field label="Meeting type">
          <select
            name="type"
            defaultValue={m?.type || planned?.type || "Regular"}
          >
            {["Regular", "Committee", "Installation", "Emergency"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Venue">
        <input name="venue" required defaultValue={m?.venue || s.lodge.venue} />
      </Field>
      <Field
        label="Order of business"
        hint="One agenda item per line. These items carry through to the summons and draft minutes."
      >
        <textarea
          name="agenda"
          required
          rows={7}
          defaultValue={
            m?.agenda.join("\n") ||
            "To open the Lodge.\nTo read and confirm the minutes of the previous meeting.\nTo receive correspondence.\nTo receive the Treasurer’s report.\nTo conduct other business.\nTo close the Lodge."
          }
        />
      </Field>
      <div className="field">
        <span>Scheduled ceremonies</span>
        <div className="inline">
          <select
            aria-label="Brother for scheduled ceremony"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
          >
            <option value="">Choose an eligible brother</option>
            {eligible.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.degree} → {degrees[degrees.indexOf(b.degree) + 1]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="secondary"
            disabled={!candidate}
            onClick={() => {
              const b = s.members.find((b) => b.id === candidate)!;
              setCeremonies([
                ...ceremonies,
                {
                  memberId: b.id,
                  degree: degrees[degrees.indexOf(b.degree) + 1],
                },
              ]);
              setCandidate("");
            }}
          >
            <Plus size={15} />
            Add
          </button>
        </div>
        {ceremonies.map((c) => (
          <div className="scheduled-row" key={c.memberId}>
            <span>
              {s.members.find((b) => b.id === c.memberId)?.name} → {c.degree}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Remove scheduled ceremony"
              onClick={() =>
                setCeremonies(
                  ceremonies.filter((v) => v.memberId !== c.memberId),
                )
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <p className="notice">
        Scheduling a ceremony does not change a brother’s degree. Confirm the
        work actually performed after the meeting.
      </p>
      <Buttons label="Save meeting" />
    </form>
  );
}
function ConfirmMeeting({ meeting: m }: { meeting: Meeting }) {
  const { s, command, close } = useApp();
  const [attendance, setAttendance] = useState<string[]>([]),
    [performed, setPerformed] = useState<string[]>([]);
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        if (
          await command("confirmMeeting", {
            id: m.id,
            attendance,
            performed,
            notes: d.notes,
          })
        )
          close();
      }}
    >
      <div className="notice">
        <b>
          {m.title} · {displayDate(m.date)}
        </b>
        <p>
          Confirm actual attendance and only the ceremonies performed. This
          creates draft minutes and mentoring follow-up tasks.
        </p>
      </div>
      <h3>Members present</h3>
      <p className="muted">
        Include brethren who served in an office at this meeting, even if
        omitted from a separate attendance list.
      </p>
      <div className="attendance-grid">
        {s.members
          .filter((b) => b.status === "Active")
          .map((b) => (
            <label key={b.id} className="checkbox-line">
              <input
                type="checkbox"
                checked={attendance.includes(b.id)}
                onChange={() => setAttendance(toggle(attendance, b.id))}
              />
              <span>
                <b>{b.name}</b>
                <small>{b.office || b.degree}</small>
              </span>
            </label>
          ))}
      </div>
      <h3>Ceremonies actually performed</h3>
      {m.ceremonies.length ? (
        m.ceremonies.map((c) => (
          <label className="checkbox-line" key={c.memberId}>
            <input
              type="checkbox"
              checked={performed.includes(c.memberId)}
              onChange={() => setPerformed(toggle(performed, c.memberId))}
            />
            <span>
              {s.members.find((b) => b.id === c.memberId)?.name} advanced to{" "}
              {c.degree}
            </span>
          </label>
        ))
      ) : (
        <p className="muted">No ceremonies scheduled.</p>
      )}
      <Field label="Meeting notes">
        <textarea
          name="notes"
          rows={4}
          placeholder="Decisions, apologies and any other notes for the minutes"
        />
      </Field>
      <label className="checkbox-line">
        <input type="checkbox" required />
        <span>
          I confirm that this meeting was held and these records are accurate.
        </span>
      </label>
      <Buttons label="Confirm meeting held" />
    </form>
  );
}
function Minutes({ meeting }: { meeting: Meeting }) {
  const { s, data, busy, command, close } = useApp(),
    m = s.meetings.find((m) => m.id === meeting.id)!;
  const [text, setText] = useState(m.minutes),
    [confirmed, setConfirmed] = useState(false);
  const approved = m.minutesStatus === "Approved",
    dirty = text !== m.minutes;
  return (
    <div className="modal-body">
      <div className="inline">
        <h3>{m.title}</h3>
        <Badge>{m.minutesStatus}</Badge>
      </div>
      <p className="muted">
        Complete the discussion and decisions, then record approval. Approved
        minutes cannot be overwritten.
      </p>
      <textarea
        className="minutes-editor"
        rows={18}
        aria-label="Meeting minutes"
        value={text}
        readOnly={approved || data.role !== "secretary"}
        onChange={(e) => setText(e.target.value)}
      />
      {!approved && (
        <>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I confirm that these minutes have received the required lodge
              approval.
            </span>
          </label>
          {dirty && (
            <p className="fineprint">Save changes before recording approval.</p>
          )}
        </>
      )}
      <div className="form-actions">
        <button className="secondary" onClick={close}>
          Close
        </button>
        {!approved && data.role === "secretary" && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => command("saveMinutes", { id: m.id, minutes: text })}
          >
            Save draft
          </button>
        )}
        {!approved && (
          <button
            className="primary"
            disabled={busy || dirty || !confirmed}
            onClick={() =>
              command("approveMinutes", { id: m.id, confirmed: true })
            }
          >
            Record approval
          </button>
        )}
        {approved && data.role === "secretary" && (
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              if (
                await command("issueDocument", {
                  meetingId: m.id,
                  kind: "Minutes",
                })
              )
                close();
            }}
          >
            <FileText size={15} />
            Issue approved PDF
          </button>
        )}
      </div>
    </div>
  );
}
function TaskForm({ task: t }: { task?: any }) {
  const { command, close } = useApp();
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await command("saveTask", {
            ...values(e.currentTarget),
            ...(t ? { id: t.id } : {}),
          })
        )
          close();
      }}
    >
      <Field label="Task">
        <input name="title" required defaultValue={t?.title} />
      </Field>
      <Field label="Due date">
        <input
          name="due"
          type="date"
          required
          defaultValue={t?.due || today()}
        />
      </Field>
      <Field label="Assigned brother">
        <MemberSelect defaultValue={t?.memberId} />
      </Field>
      <Buttons label="Save task" />
    </form>
  );
}
function JournalForm() {
  const { s, command, close } = useApp(),
    [type, setType] = useState("Receipt"),
    [category, setCategory] = useState("Dues");
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        if (
          await command("postJournal", {
            ...d,
            type,
            amount: cents(d.amount),
            category: type === "Assessment" ? "Dues" : category,
          })
        )
          close();
      }}
    >
      <div className="form-grid">
        <Field label="Entry type">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["Receipt", "Expense", "Assessment"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            name="date"
            type="date"
            max={today()}
            required
            defaultValue={today()}
          />
        </Field>
      </div>
      <Field label="Description">
        <input
          name="description"
          required
          placeholder="What is this entry for?"
        />
      </Field>
      <div className="form-grid">
        <Field label={"Amount (" + s.lodge.currency + ")"}>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
        </Field>
        <Field label="Fund">
          <input name="fund" required defaultValue="General" list="funds" />
          <datalist id="funds">
            <option>General</option>
            <option>Benevolence</option>
          </datalist>
        </Field>
      </div>
      <Field label="Category">
        <select
          value={type === "Assessment" ? "Dues" : category}
          disabled={type === "Assessment"}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["Dues", "Donation", "Supplies", "Rent", "Maintenance", "Other"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
      </Field>
      <Field
        label="Member"
        hint="Required for dues assessments and dues receipts."
      >
        <MemberSelect
          required={
            type === "Assessment" || (type === "Receipt" && category === "Dues")
          }
        />
      </Field>
      <p className="notice">
        The entry records activity that occurred outside the app. No payment
        will be collected.
      </p>
      <Buttons label="Post journal entry" />
    </form>
  );
}
function JournalDetail({ entry }: { entry: any }) {
  const { s, data, open } = useApp();
  const j = s.journal.find((j) => j.id === entry.id)!;
  return (
    <div className="modal-body">
      <Badge>{j.type}</Badge>
      <h2>{j.description}</h2>
      <p>
        {displayDate(j.date)} · {j.fund} · {money(j.amount, s.lodge.currency)}
      </p>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {j.entries.map((e, i) => (
            <tr key={i}>
              <td>{e.account}</td>
              <td>{money(e.debit, s.lodge.currency)}</td>
              <td>{money(e.credit, s.lodge.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="notice">
        This is a posted record. Corrections are made by a separate reversing
        entry.
      </p>
      {["secretary", "treasurer"].includes(data.role) &&
        j.type !== "Reversal" &&
        !s.journal.some((v) => v.reverses === j.id) && (
          <button
            className="secondary"
            onClick={() => open("reverseJournal", j)}
          >
            Reverse this entry
          </button>
        )}
      {s.journal.some((v) => v.reverses === j.id) && <Badge>Reversed</Badge>}
    </div>
  );
}
function AssetForm({
  asset: a,
  readonly = false,
}: {
  asset?: Asset;
  readonly?: boolean;
}) {
  const { s, busy, command, upload, close } = useApp(),
    [photoId, setPhotoId] = useState(a?.photoId || "");
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        if (readonly) return;
        const d = values(e.currentTarget);
        if (
          await command("saveAsset", {
            ...d,
            value: cents(d.value),
            photoId,
            ...(a ? { id: a.id } : {}),
          })
        )
          close();
      }}
    >
      <fieldset disabled={readonly}>
        <div className="asset-form-photo">
          {photoId ? (
            <img
              alt="Property photograph"
              src={`/api/files?lodge=${s.lodge.id}&id=${photoId}`}
            />
          ) : (
            <span>No photograph yet</span>
          )}
          {!readonly && (
            <label className="button secondary file-button">
              <Upload size={15} />
              Upload photograph
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const result = await upload(f, "asset");
                    if (result) setPhotoId(result);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <Field label="Item name">
          <input name="name" required defaultValue={a?.name} />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <input
              name="category"
              required
              defaultValue={a?.category || "Regalia"}
              list="asset-categories"
            />
            <datalist id="asset-categories">
              {["Jewels", "Regalia", "Furniture", "Equipment"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Condition">
            <select name="condition" defaultValue={a?.condition || "Good"}>
              {["Excellent", "Good", "Fair", "Needs repair"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label={"Recorded value (" + s.lodge.currency + ")"}>
            <input
              name="value"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={a ? a.value / 100 : 0}
            />
          </Field>
          <Field label="Custodian">
            <input name="custodian" required defaultValue={a?.custodian} />
          </Field>
        </div>
        <Field label="Location">
          <input name="location" required defaultValue={a?.location} />
        </Field>
      </fieldset>
      {a && (
        <>
          <h3>Custody and condition history</h3>
          {a.history.length ? (
            a.history
              .slice()
              .reverse()
              .map((h, i) => (
                <div className="history-item" key={i}>
                  <span className="activity-dot" />
                  <div>
                    <b>
                      {h.custodian} · {h.condition}
                    </b>
                    <small>
                      {displayDate(h.at.slice(0, 10))} · {h.location}
                    </small>
                  </div>
                </div>
              ))
          ) : (
            <p className="muted">
              History will be recorded with the next update.
            </p>
          )}
        </>
      )}
      {!readonly && <Buttons label="Save property record" />}
    </form>
  );
}
function ImportForm() {
  const { command, close, busy } = useApp(),
    [rows, setRows] = useState<Record<string, string>[]>([]),
    [error, setError] = useState("");
  const headers = [
    "name",
    "email",
    "phone",
    "degree",
    "office",
    "status",
    "joined",
  ];
  return (
    <div className="modal-body">
      <p>
        Save your spreadsheet as CSV using the columns below. Review the rows
        before importing. This creates opening membership records without
        generating ceremony events or messages.
      </p>
      <button
        className="secondary"
        onClick={() =>
          download(
            "membership-import-template.csv",
            csv([
              headers,
              [
                "Example Brother",
                "brother@example.com",
                "",
                "EA",
                "",
                "Active",
                "2022-02-01",
              ],
            ]),
            "text/csv",
          )
        }
      >
        <Download size={15} />
        Download CSV template
      </button>
      <p className="fineprint">
        Required: name, degree, joined (YYYY-MM-DD). Maximum 500 rows. Duplicate
        names or emails stop the entire import.
      </p>
      <Field label="Membership CSV">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (f.size > 1_000_000)
                throw new Error("Choose a CSV up to 1 MB.");
              const parsed = parseCSV(await f.text());
              if (!parsed.length || parsed.length > 500)
                throw new Error("Choose between 1 and 500 membership rows.");
              if (parsed.some((r) => !r.name || !r.degree || !r.joined))
                throw new Error("Every row needs name, degree and joined.");
              setRows(
                parsed.map((r) => ({
                  ...Object.fromEntries(headers.map((h) => [h, r[h] || ""])),
                  status: r.status || "Active",
                })),
              );
              setError("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to read CSV.");
              setRows([]);
            }
          }}
        />
      </Field>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <h3>{rows.length} rows ready for review</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Degree</th>
                  <th>Joined</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.degree}</td>
                    <td>{r.joined}</td>
                    <td>{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 20 && (
            <p className="fineprint">
              Showing the first 20 of {rows.length} rows.
            </p>
          )}
        </>
      )}
      <div className="form-actions">
        <button className="secondary" onClick={close}>
          Cancel
        </button>
        <button
          className="primary"
          disabled={busy || !rows.length}
          onClick={async () => {
            if (await command("importMembers", rows)) close();
          }}
        >
          Import {rows.length || ""} members
        </button>
      </div>
    </div>
  );
}
function Invite() {
  const { command, close } = useApp(),
    [role, setRole] = useState("member");
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        if (
          await command("invite", {
            email: d.email,
            role,
            memberId: d.memberId || null,
            endsAt: d.endsAt ? d.endsAt + "T23:59:59.000Z" : null,
          })
        )
          close();
      }}
    >
      <Field label="Email used to sign in">
        <input name="email" type="email" required />
      </Field>
      <Field label="Lodge role">
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {["member", "treasurer", "master", "secretary"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Linked membership record">
        <MemberSelect required={role === "member"} />
      </Field>
      <Field label="Access ends (optional, UTC)">
        <input name="endsAt" type="date" min={today()} />
      </Field>
      <p className="notice">
        The invitation is valid for 7 days and is bound to this email. It will
        appear on sign-in; this action does not send a message or grant access
        to the private pilot site.
      </p>
      <Buttons label="Create invitation" />
    </form>
  );
}
function ReasonForm({ spec }: { spec: ModalSpec }) {
  const { command, close } = useApp();
  const remove = spec.kind === "revokeAccess";
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = values(e.currentTarget);
        const payload =
          spec.kind === "correctDegree"
            ? { eventId: spec.data.id, reason: d.reason }
            : remove
              ? { id: spec.data.userId }
              : { id: spec.data.id, reason: d.reason };
        if (await command(spec.kind, payload)) close();
      }}
    >
      <p>
        {remove
          ? `Remove ${spec.data.email} from this lodge? Their recorded work remains in the audit history.`
          : spec.kind === "correctDegree"
            ? "This reverses the latest degree advancement and creates a review task. The original event and issued documents are preserved."
            : spec.kind === "cancelMeeting"
              ? "The meeting will be marked cancelled. Scheduled ceremonies will not change any member’s degree."
              : "A separate entry will reverse the original debit and credit. The original record remains unchanged."}
      </p>
      {!remove && (
        <Field label="Reason">
          <textarea
            name="reason"
            required
            minLength={spec.kind === "correctDegree" ? 10 : 5}
            rows={4}
          />
        </Field>
      )}
      <Buttons label={remove ? "Remove lodge access" : "Confirm correction"} />
    </form>
  );
}
