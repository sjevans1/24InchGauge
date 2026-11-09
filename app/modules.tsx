"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ArrowRight,
  Download,
  Upload,
  CalendarDays,
  FileText,
  Eye,
  Send,
  Gem,
  MapPin,
  UserRound,
  Check,
  CheckCircle2,
  ArrowUp,
  Trash2,
  Palette,
  Building2,
  ShieldCheck,
  History,
  Compass,
} from "lucide-react";
import {
  balance,
  memberBalance,
  money,
  displayDate,
  degrees,
  type Brand,
} from "@/lib/model";
import { csv } from "@/lib/csv";
import { useApp } from "./context";
import { Avatar, Badge, Empty, Field, Paper, download } from "./components";
function Heading({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Members() {
  const { s, data, open } = useApp(),
    [filter, setFilter] = useState("All"),
    [query, setQuery] = useState("");
  const canEdit = data.role === "secretary";
  const members = s.members.filter(
    (m) =>
      (filter === "All" || m.degree === filter) &&
      (m.name + " " + m.office).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        label="MEMBERSHIP"
        title="The brethren."
        description="One register. A complete picture of each brother’s journey."
      >
        {canEdit && (
          <>
            <button className="secondary" onClick={() => open("import")}>
              <Upload size={15} />
              Import CSV
            </button>
            <button className="primary" onClick={() => open("member")}>
              <Plus size={15} />
              Add a brother
            </button>
          </>
        )}
      </Heading>
      <section className="panel">
        <div className="toolbar">
          <div className="tabs compact">
            {["All", ...degrees].map((d) => (
              <button
                className={filter === d ? "selected" : ""}
                onClick={() => setFilter(d)}
                key={d}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="search-input">
            <Search size={16} />
            <input
              aria-label="Search membership"
              placeholder="Search name or office"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="icon-button"
            title="Export visible members"
            aria-label="Export visible members"
            onClick={() =>
              download(
                "lodge-members.csv",
                csv([
                  [
                    "name",
                    "email",
                    "phone",
                    "degree",
                    "office",
                    "status",
                    "joined",
                  ],
                  ...members.map((m) => [
                    m.name,
                    m.email,
                    m.phone,
                    m.degree,
                    m.office,
                    m.status,
                    m.joined,
                  ]),
                ]),
                "text/csv",
              )
            }
          >
            <Download size={17} />
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Brother</th>
                <th>Degree</th>
                <th>Office</th>
                <th>Status</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <button
                      className="table-name"
                      onClick={() => open("memberDetail", m)}
                    >
                      <Avatar name={m.name} />
                      <span>
                        <b>{m.name}</b>
                        <small>{m.email || "Lodge member"}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <Badge>{m.degree}</Badge>
                  </td>
                  <td>{m.office || "—"}</td>
                  <td>
                    <span className={"status " + m.status.toLowerCase()}>
                      {m.status}
                    </span>
                  </td>
                  <td>{displayDate(m.joined)}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={"View " + m.name}
                      onClick={() => open("memberDetail", m)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!members.length && (
          <Empty title="No members to show">
            Add a brother or adjust your search.
          </Empty>
        )}
        <div className="table-footer">
          {members.length} {members.length === 1 ? "brother" : "brethren"} shown
          · {s.members.length} in the register
        </div>
      </section>
    </>
  );
}
export function Meetings() {
  const { s, data, open, setPage, setSelectedMeeting } = useApp(),
    [filter, setFilter] = useState("All");
  const canEdit = data.role === "secretary";
  return (
    <>
      <Heading
        label="THE LODGE DIARY"
        title="Meet with purpose."
        description="Plan the work, record what happened and keep the next step moving."
      >
        {canEdit && (
          <button className="primary" onClick={() => open("meeting")}>
            <Plus size={15} />
            Plan a meeting
          </button>
        )}
      </Heading>
      <div className="tabs">
        {["All", "Planned", "Completed", "Cancelled"].map((v) => (
          <button
            key={v}
            className={filter === v ? "selected" : ""}
            onClick={() => setFilter(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="meeting-list">
        {s.meetings
          .filter((m) => filter === "All" || m.status === filter)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((m) => (
            <article className="panel meeting-card" key={m.id}>
              <div className="meeting-title">
                <div className="calendar-box">
                  <strong>{m.date.slice(8)}</strong>
                  <span>
                    {new Date(m.date + "T12:00Z").toLocaleDateString("en", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div>
                  <div className="inline">
                    <span className="eyebrow">
                      {m.type.toUpperCase()} MEETING
                    </span>
                    <Badge kind={m.status.toLowerCase()}>{m.status}</Badge>
                  </div>
                  <h2>{m.title}</h2>
                  <p>
                    {displayDate(m.date)} · {m.time} · {m.venue}
                  </p>
                </div>
              </div>
              <details>
                <summary>
                  {m.agenda.length} agenda items
                  {m.ceremonies.length > 0
                    ? ` · ${m.ceremonies.length} scheduled ceremonies`
                    : ""}
                </summary>
                <ol className="agenda-list">
                  {m.agenda.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
                {m.ceremonies.map((c) => (
                  <p key={c.memberId} className="note">
                    {s.members.find((b) => b.id === c.memberId)?.name} →{" "}
                    {c.degree} · scheduled work
                  </p>
                ))}
                {m.status === "Completed" && (
                  <p>
                    {m.attendance.length} members recorded present · Minutes:{" "}
                    {m.minutesStatus}
                  </p>
                )}
                {m.status === "Cancelled" && <p>{m.minutes}</p>}
              </details>
              <div className="card-actions">
                {m.status === "Planned" && canEdit && (
                  <>
                    <button
                      className="secondary"
                      onClick={() => open("meeting", m)}
                    >
                      Edit meeting
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        setSelectedMeeting(m.id);
                        setPage("Documents");
                      }}
                    >
                      <FileText size={14} />
                      Prepare summons
                    </button>
                    <button
                      className="primary"
                      onClick={() => open("confirmMeeting", m)}
                    >
                      <Check size={15} />
                      Confirm held
                    </button>
                    <button
                      className="text-button danger"
                      onClick={() => open("cancelMeeting", m)}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {m.status === "Completed" &&
                  ["secretary", "master"].includes(data.role) && (
                    <button
                      className="secondary"
                      onClick={() => open("minutes", m)}
                    >
                      <FileText size={15} />
                      Review minutes
                    </button>
                  )}
                {data.role === "member" && (
                  <button
                    className="secondary"
                    onClick={() => setPage("Documents")}
                  >
                    View issued documents
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>
      {!s.meetings.length && (
        <Empty title="Your diary is ready">
          Meeting notices will appear here as they are prepared and issued.
        </Empty>
      )}
    </>
  );
}
export function Documents() {
  const {
    s,
    data,
    busy,
    command,
    upload,
    selectedMeeting,
    setSelectedMeeting,
    setPage,
    notify,
  } = useApp();
  const secretary = data.role === "secretary",
    drafts = ["secretary", "master"].includes(data.role);
  const [tab, setTab] = useState(
    drafts ? "Summons builder" : "Issued documents",
  );
  const meeting =
    s.meetings.find((m) => m.id === selectedMeeting) ||
    s.meetings.find((m) => m.status === "Planned");
  return (
    <>
      <Heading
        label="DOCUMENT WORKSPACE"
        title="A lodge’s own hand."
        description="Branded summons, enduring minutes and an orderly archive."
      >
        {secretary && (
          <button className="secondary" onClick={() => setPage("Settings")}>
            <Palette size={15} />
            Lodge branding
          </button>
        )}
      </Heading>
      <div className="tabs">
        {[
          ...(drafts ? ["Summons builder"] : []),
          "Issued documents",
          ...(secretary ? ["Source archive"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Summons builder" && (
        <div className="document-layout">
          <aside className="panel document-controls">
            <span className="eyebrow">PREPARE YOUR SUMMONS</span>
            <h2>From meeting to notice.</h2>
            <Field label="Meeting">
              <select
                value={meeting?.id || ""}
                onChange={(e) => setSelectedMeeting(e.target.value)}
              >
                <option value="" disabled>
                  Select a meeting
                </option>
                {s.meetings
                  .filter((m) => m.status === "Planned")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
              </select>
            </Field>
            {meeting && (
              <>
                <div className="document-facts">
                  <div>
                    <CalendarDays size={16} />
                    <span>
                      {displayDate(meeting.date)}
                      <small>
                        {meeting.time} · {meeting.venue}
                      </small>
                    </span>
                  </div>
                  <div>
                    <FileText size={16} />
                    <span>
                      {meeting.agenda.length} agenda items
                      <small>From the meeting record</small>
                    </span>
                  </div>
                </div>
                <Badge kind="draft">Draft · ready for your review</Badge>
                <p className="muted">
                  The preview follows your lodge’s branding. Download the draft
                  PDF to check its final pagination.
                </p>
                {data.demo ? (
                  <button
                    className="secondary full"
                    onClick={() =>
                      notify(
                        "Create a workspace to generate PDFs from your lodge records.",
                      )
                    }
                  >
                    <Eye size={15} />
                    Preview draft PDF
                  </button>
                ) : (
                  <a
                    className="button secondary full"
                    href={`/api/document?lodge=${s.lodge.id}&meeting=${meeting.id}&kind=Summons`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Eye size={15} />
                    Preview draft PDF
                  </a>
                )}
                {secretary && (
                  <button
                    className="primary full"
                    disabled={busy || meeting.status !== "Planned"}
                    onClick={async () => {
                      if (
                        await command("issueDocument", {
                          meetingId: meeting.id,
                          kind: "Summons",
                        })
                      )
                        setTab("Issued documents");
                    }}
                  >
                    <Send size={15} />
                    Issue & save summons
                  </button>
                )}
                <p className="fineprint">
                  Issuing preserves a dated PDF and its source snapshot. Email
                  and WhatsApp delivery are not connected in this pilot.
                </p>
              </>
            )}
            {!meeting && <p className="muted">Plan a meeting to begin.</p>}
          </aside>
          <div className="paper-surface">
            <Paper state={s} meeting={meeting} />
            <p className="preview-caption">
              LIVE LAYOUT PREVIEW · FINAL PAGINATION IN PDF
            </p>
          </div>
        </div>
      )}
      {tab === "Issued documents" && (
        <section className="panel">
          {s.documents.length ? (
            <div className="document-files">
              {[...s.documents].reverse().map((d) => (
                <div key={d.id}>
                  <div className="file-icon">
                    <FileText />
                  </div>
                  <div>
                    <h3>{d.title}</h3>
                    <p>
                      Issued {displayDate(d.issuedAt.slice(0, 10))} · Preserved
                      PDF
                    </p>
                  </div>
                  <a
                    className="button secondary"
                    href={`/api/files?lodge=${s.lodge.id}&id=${d.fileId}`}
                  >
                    <Download size={15} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="The archive begins with your first issue">
              Issued summons and approved minutes are preserved here, even when
              lodge branding later changes.
            </Empty>
          )}
        </section>
      )}
      {tab === "Source archive" && (
        <section className="panel padded">
          <div className="archive-intro">
            <div>
              <h2>A home for earlier records.</h2>
              <p>
                Upload historical Word documents, Excel workbooks and PDFs.
                Files remain private to the secretary. This preserves the
                originals; it does not extract or import their contents.
              </p>
            </div>
            <label
              className={
                "button primary file-button " + (busy ? "disabled" : "")
              }
            >
              <Upload size={15} />
              Upload source file
              <input
                type="file"
                accept=".pdf,.docx,.xlsx"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await upload(file, "archive");
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="fineprint">
            PDF, DOCX or XLSX · Up to 10 MB per file. Import membership data
            through Members → Import CSV.
          </p>
          <div className="document-files">
            {s.files
              .filter((f) => f.purpose === "archive")
              .map((f) => (
                <div key={f.id}>
                  <FileText size={20} />
                  <div>
                    <h3>{f.name}</h3>
                    <p>
                      {Math.ceil(f.size / 1024)} KB ·{" "}
                      {displayDate(f.createdAt.slice(0, 10))}
                    </p>
                  </div>
                  <a
                    className="button secondary"
                    href={`/api/files?lodge=${s.lodge.id}&id=${f.id}`}
                  >
                    <Download size={15} />
                    Download
                  </a>
                </div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
export function Finances() {
  const { s, data, open } = useApp(),
    [fund, setFund] = useState("All");
  const editable = ["secretary", "treasurer"].includes(data.role),
    rows = s.journal.filter((j) => fund === "All" || j.fund === fund);
  return (
    <>
      <Heading
        label="FINANCIAL RECORDS"
        title="Every entry accounted for."
        description={
          data.role === "member"
            ? "Your lodge dues assessments, receipts and balance."
            : "Track receipts, expenses and dues with a balanced, auditable ledger."
        }
      >
        {editable && (
          <button className="primary" onClick={() => open("journal")}>
            <Plus size={15} />
            Record an entry
          </button>
        )}
      </Heading>
      <div className="stats finance-stats">
        {data.role !== "member" && (
          <div>
            <span>Recorded bank balance</span>
            <strong className="money-stat">
              {money(balance(rows, "Bank"), s.lodge.currency)}
            </strong>
            <small>{fund === "All" ? "All funds" : fund}</small>
          </div>
        )}
        <div>
          <span>Dues receivable</span>
          <strong className="money-stat">
            {money(balance(rows, "Dues receivable"), s.lodge.currency)}
          </strong>
          <small>Assessments less recorded dues receipts</small>
        </div>
        <div>
          <span>Journal entries</span>
          <strong>{rows.length}</strong>
          <small>Originals and any reversing entries</small>
        </div>
      </div>
      <section className="panel">
        <div className="toolbar">
          <h2>The lodge ledger</h2>
          <select
            aria-label="Filter by fund"
            value={fund}
            onChange={(e) => setFund(e.target.value)}
          >
            {["All", ...new Set(s.journal.map((j) => j.fund))].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <button
            className="secondary"
            onClick={() =>
              download(
                "lodge-ledger.csv",
                csv([
                  [
                    "date",
                    "description",
                    "fund",
                    "type",
                    "account",
                    "debit_minor_units",
                    "credit_minor_units",
                    "currency",
                  ],
                  ...rows.flatMap((j) =>
                    j.entries.map((e) => [
                      j.date,
                      j.description,
                      j.fund,
                      j.type,
                      e.account,
                      e.debit,
                      e.credit,
                      s.lodge.currency,
                    ]),
                  ),
                ]),
                "text/csv",
              )
            }
          >
            <Download size={15} />
            Export ledger
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Fund</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((j) => (
                <tr key={j.id}>
                  <td>{displayDate(j.date)}</td>
                  <td>
                    <b>{j.description}</b>
                    <small className="block muted">
                      {s.members.find((m) => m.id === j.memberId)?.name ||
                        j.category}
                    </small>
                  </td>
                  <td>
                    <Badge kind={j.type.toLowerCase()}>{j.type}</Badge>
                  </td>
                  <td>{j.fund}</td>
                  <td className="numeric">
                    {money(j.amount, s.lodge.currency)}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={"View entry " + j.description}
                      onClick={() => open("journalDetail", j)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty title="A clear ledger">
            Record an assessment, receipt or expense to begin.
          </Empty>
        )}
      </section>
      <p className="module-note">
        This records financial activity; it does not collect payments or move
        funds. Bank reconciliation, opening balances and year-end accounting are
        planned for a later release.
      </p>
    </>
  );
}
export function Property() {
  const { s, data, open } = useApp(),
    editable = ["secretary", "treasurer"].includes(data.role);
  return (
    <>
      <Heading
        label="THE PROPERTY REGISTER"
        title="In good hands."
        description="Jewels, regalia, furniture and equipment—with a record of their care."
      >
        {editable && (
          <button className="primary" onClick={() => open("asset")}>
            <Plus size={15} />
            Add an item
          </button>
        )}
      </Heading>
      <div className="property-summary">
        <span>
          <b>{s.assets.length}</b> registered items
        </span>
        <span>
          Recorded value{" "}
          <b>
            {money(
              s.assets.reduce((n, a) => n + a.value, 0),
              s.lodge.currency,
            )}
          </b>
        </span>
      </div>
      <div className="asset-grid">
        {s.assets.map((a) => (
          <article className="panel asset-card" key={a.id}>
            <div className="asset-image">
              {a.photoId ? (
                <img
                  alt={a.name}
                  src={`/api/files?lodge=${s.lodge.id}&id=${a.photoId}`}
                />
              ) : (
                <Gem size={52} strokeWidth={1} />
              )}
              <Badge
                kind={a.condition === "Needs repair" ? "cancelled" : "good"}
              >
                {a.condition}
              </Badge>
            </div>
            <div className="asset-info">
              <span className="eyebrow">{a.category.toUpperCase()}</span>
              <h2>{a.name}</h2>
              <div>
                <UserRound size={15} />
                {a.custodian}
              </div>
              <div>
                <MapPin size={15} />
                {a.location}
              </div>
              <footer>
                <b>{money(a.value, s.lodge.currency)}</b>
                <button
                  className="text-button"
                  onClick={() => open(editable ? "asset" : "assetDetail", a)}
                >
                  View record <ArrowRight size={14} />
                </button>
              </footer>
            </div>
          </article>
        ))}
      </div>
      {!s.assets.length && (
        <Empty title="Give each item a record">
          Add a photograph, condition, value and the person responsible for its
          custody.
        </Empty>
      )}
    </>
  );
}
export function Tasks() {
  const { s, data, busy, open, command } = useApp(),
    [showDone, setShowDone] = useState(false),
    editable = ["secretary", "master"].includes(data.role);
  const list = s.tasks.filter((t) => t.done === showDone);
  return (
    <>
      <Heading
        label="FOLLOW-THROUGH"
        title="On the lodge’s desk."
        description="The small actions that keep everything moving."
      >
        {editable && (
          <button className="primary" onClick={() => open("task")}>
            <Plus size={15} />
            Add a task
          </button>
        )}
      </Heading>
      <div className="tabs">
        <button
          className={!showDone ? "selected" : ""}
          onClick={() => setShowDone(false)}
        >
          Open ({s.tasks.filter((t) => !t.done).length})
        </button>
        <button
          className={showDone ? "selected" : ""}
          onClick={() => setShowDone(true)}
        >
          Completed ({s.tasks.filter((t) => t.done).length})
        </button>
      </div>
      <section className="panel task-list">
        {list.map((t) => (
          <div key={t.id}>
            <button
              disabled={busy}
              className={"task-check " + (t.done ? "checked" : "")}
              aria-label={(t.done ? "Reopen " : "Complete ") + t.title}
              onClick={() => command("toggleTask", { id: t.id, done: !t.done })}
            >
              <Check size={14} />
            </button>
            <div>
              <h3>{t.title}</h3>
              <p>
                {s.members.find((m) => m.id === t.memberId)?.name ||
                  "Lodge task"}{" "}
                · Due {displayDate(t.due)}
              </p>
            </div>
            {t.meetingId && <Badge>Meeting follow-up</Badge>}
            {editable && (
              <button className="text-button" onClick={() => open("task", t)}>
                Edit
              </button>
            )}
          </div>
        ))}
        {!list.length && (
          <Empty
            title={
              showDone ? "Completed work will appear here" : "A clear desk"
            }
          >
            Tasks created by confirmed ceremonies also appear in this list.
          </Empty>
        )}
      </section>
    </>
  );
}
export function SettingsPanel({
  initialTab = "Branding",
}: {
  initialTab?: string;
}) {
  const { s, data, busy, command, upload, open, notify } = useApp();
  const [tab, setTab] = useState(initialTab),
    [brand, setBrand] = useState<Brand>(structuredClone(s.lodge.brand));
  useEffect(() => setBrand(structuredClone(s.lodge.brand)), [s.lodge.id]);
  const preview = { ...s, lodge: { ...s.lodge, brand } };
  return (
    <>
      <Heading
        label="LODGE SETTINGS"
        title="Make it your own."
        description="Your identity, your officers and a clear record of access."
      />
      <div className="tabs">
        {[
          { n: "Branding", i: Palette },
          { n: "Lodge details", i: Building2 },
          { n: "Access & invitations", i: ShieldCheck },
          { n: "Activity & export", i: History },
        ].map((t) => (
          <button
            key={t.n}
            className={tab === t.n ? "selected" : ""}
            onClick={() => setTab(t.n)}
          >
            <t.i size={15} />
            {t.n}
          </button>
        ))}
      </div>
      {tab === "Branding" && (
        <div className="document-layout settings-layout">
          <section className="panel padded">
            <h2>A distinctive lodge identity.</h2>
            <p className="muted">
              Start with the built-in design. No existing template is needed.
            </p>
            <div className="logo-uploader">
              {brand.logoId ? (
                <img
                  alt="Uploaded lodge crest"
                  src={`/api/files?lodge=${s.lodge.id}&id=${brand.logoId}`}
                />
              ) : (
                <Compass size={38} />
              )}
              <div>
                <b>Lodge logo or crest</b>
                <p>PNG, JPEG or WebP · We resize your image.</p>
                <label className="button secondary file-button">
                  <Upload size={14} />
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const result = await upload(file, "logo");
                        if (result) setBrand((b) => ({ ...b, logoId: result }));
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                {brand.logoId && (
                  <button
                    className="text-button"
                    onClick={() => setBrand({ ...brand, logoId: "" })}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="field">
              <span>Document style</span>
              <div className="style-options">
                {(["traditional", "compact"] as const).map((style) => (
                  <button
                    key={style}
                    className={brand.layout === style ? "chosen" : ""}
                    onClick={() => setBrand({ ...brand, layout: style })}
                  >
                    <FileText size={23} />
                    <b>{style === "traditional" ? "Traditional" : "Compact"}</b>
                    <small>
                      {style === "traditional"
                        ? "A formal, generous layout"
                        : "A closer, economical layout"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Lodge colour">
              <div className="color-control">
                <input
                  aria-label="Lodge colour"
                  type="color"
                  value={brand.color}
                  onChange={(e) =>
                    setBrand({ ...brand, color: e.target.value })
                  }
                />
                <code>{brand.color.toUpperCase()}</code>
              </div>
            </Field>
            <Field label="Opening greeting">
              <textarea
                rows={4}
                value={brand.greeting}
                onChange={(e) =>
                  setBrand({ ...brand, greeting: e.target.value })
                }
              />
            </Field>
            <Field label="Footer or general notice">
              <textarea
                rows={3}
                value={brand.footer}
                onChange={(e) => setBrand({ ...brand, footer: e.target.value })}
              />
            </Field>
            <div className="field">
              <span>Summons sections</span>
              <p className="fineprint">
                Notice and Agenda are required. Reorder sections to suit your
                lodge.
              </p>
              <div className="section-order">
                {brand.sections.map((section, i) => (
                  <div key={section}>
                    <span>{i + 1}</span>
                    <b>{section}</b>
                    <button
                      aria-label={"Move " + section + " up"}
                      className="icon-button"
                      disabled={!i}
                      onClick={() => {
                        const sections = [...brand.sections];
                        [sections[i - 1], sections[i]] = [
                          sections[i],
                          sections[i - 1],
                        ];
                        setBrand({ ...brand, sections });
                      }}
                    >
                      <ArrowUp size={15} />
                    </button>
                    {["Officers", "Notices"].includes(section) && (
                      <button
                        aria-label={"Remove " + section}
                        className="icon-button"
                        onClick={() =>
                          setBrand({
                            ...brand,
                            sections: brand.sections.filter(
                              (v) => v !== section,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="inline">
                {["Officers", "Notices"]
                  .filter((v) => !brand.sections.includes(v))
                  .map((v) => (
                    <button
                      key={v}
                      className="text-button"
                      onClick={() =>
                        setBrand({ ...brand, sections: [...brand.sections, v] })
                      }
                    >
                      + Add {v}
                    </button>
                  ))}
              </div>
            </div>
            <button
              className="primary full"
              disabled={busy}
              onClick={() => command("saveBrand", brand)}
            >
              <Check size={15} />
              Save lodge branding
            </button>
          </section>
          <div className="paper-surface">
            <Paper
              state={preview}
              meeting={s.meetings.find((m) => m.status === "Planned")}
            />
            <p className="preview-caption">YOUR CHANGES, AS THEY WILL APPEAR</p>
          </div>
        </div>
      )}
      {tab === "Lodge details" && (
        <div className="settings-columns">
          <form
            className="panel padded"
            key={s.lodge.id}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await command("saveLodge", {
                name: f.get("name"),
                number: f.get("number"),
                constitution: f.get("constitution"),
                currency: f.get("currency") || s.lodge.currency,
                venue: f.get("venue"),
              });
            }}
          >
            <h2>Lodge identity</h2>
            <Field label="Lodge name">
              <input required name="name" defaultValue={s.lodge.name} />
            </Field>
            <div className="form-grid">
              <Field label="Lodge number">
                <input required name="number" defaultValue={s.lodge.number} />
              </Field>
              <Field label="Constitution">
                <select name="constitution" defaultValue={s.lodge.constitution}>
                  {["English", "Scottish", "Irish"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Meeting venue">
              <input required name="venue" defaultValue={s.lodge.venue} />
            </Field>
            <Field
              label="Ledger currency"
              hint="Currency is locked once the first financial entry is recorded."
            >
              <select
                name="currency"
                defaultValue={s.lodge.currency}
                disabled={s.journal.length > 0}
              >
                {["JMD", "KYD", "USD"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <button className="primary" disabled={busy}>
              Save lodge details
            </button>
          </form>
          <section className="panel padded">
            <span className="eyebrow">YOUR PLAN</span>
            <h2>Complimentary pilot.</h2>
            <p>
              No charges for the founding pilot. Lodge subscription checkout has
              not been activated.
            </p>
            <ul className="feature-list">
              <li>
                <CheckCircle2 size={16} />
                Membership and linked meeting workflows
              </li>
              <li>
                <CheckCircle2 size={16} />
                Branded documents and source archive
              </li>
              <li>
                <CheckCircle2 size={16} />
                Ledger, assets and access controls
              </li>
            </ul>
            <p className="module-note">
              Constitution labels and document branding are configurable.
              Statutory returns and constitution-specific approval rules still
              require implementation and lodge validation.
            </p>
          </section>
        </div>
      )}
      {tab === "Access & invitations" && (
        <section className="panel padded">
          <div className="section-head">
            <div>
              <h2>The right access for each brother.</h2>
              <p className="muted">
                Secretaries manage all lodge records. Treasurers manage finances
                and property. Masters review meetings and tasks. Members see
                their own personal records and issued documents.
              </p>
            </div>
            <button className="primary" onClick={() => open("invite")}>
              <Plus size={15} />
              Invite an officer or member
            </button>
          </div>
          <p className="notice">
            Invitations appear when the invited email signs in. No email is
            sent. Access to this private pilot site must also be granted
            separately before another person can reach it.
          </p>
          <div className="access-list">
            {s.access.map((a) => (
              <div key={a.userId}>
                <Avatar name={a.email} />
                <div>
                  <b>{a.email}</b>
                  <p>
                    {a.role}{" "}
                    {a.memberId
                      ? "· " + s.members.find((m) => m.id === a.memberId)?.name
                      : ""}
                    {a.endsAt
                      ? " · Ends " + displayDate(a.endsAt.slice(0, 10))
                      : ""}
                  </p>
                </div>
                {a.userId === data.user?.id ? (
                  <Badge>You</Badge>
                ) : (
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => open("revokeAccess", a)}
                  >
                    Remove access
                  </button>
                )}
              </div>
            ))}
          </div>
          <h3>Pending invitations</h3>
          {s.invites.length ? (
            s.invites.map((i) => (
              <div className="invite-row" key={i.id}>
                <div>
                  <b>{i.email}</b>
                  <p>
                    {i.role} · Expires {displayDate(i.expiresAt.slice(0, 10))}
                  </p>
                </div>
                <button
                  className="text-button danger"
                  disabled={busy}
                  onClick={() => command("revokeInvite", { id: i.id })}
                >
                  Revoke
                </button>
              </div>
            ))
          ) : (
            <p className="muted">No pending invitations.</p>
          )}
        </section>
      )}
      {tab === "Activity & export" && (
        <section className="panel padded">
          <div className="section-head">
            <div>
              <h2>A clear trail of lodge work.</h2>
              <p className="muted">
                The 500 most recent actions are shown. Actor, action and date
                are recorded at every successful save.
              </p>
            </div>
            <button
              className="secondary"
              onClick={() => {
                download(
                  "lodge-records.json",
                  JSON.stringify(s, null, 2),
                  "application/json",
                );
                notify(
                  "Record export downloaded. Keep this file private; original uploaded files must be downloaded separately.",
                );
              }}
            >
              <Download size={15} />
              Export lodge records
            </button>
          </div>
          <p className="fineprint">
            The export includes personal and financial records. It contains file
            metadata, not the original file bytes. A complete backup/restore
            workflow is not enabled.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {s.audit.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {new Date(a.at).toLocaleString("en-GB", {
                        timeZone: "America/Jamaica",
                      })}
                    </td>
                    <td>{a.action}</td>
                    <td>{a.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!s.audit.length && <Empty title="Your activity will appear here" />}
        </section>
      )}
    </>
  );
}
