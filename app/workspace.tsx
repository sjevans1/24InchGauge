"use client";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Files,
  Wallet,
  Gem,
  ListChecks,
  Settings,
  Compass,
  ChevronDown,
  Plus,
  Menu,
  X,
  Search,
  RotateCw,
  ArrowUpRight,
  ArrowRight,
  Check,
  ShieldCheck,
  LogOut,
  Bell,
} from "lucide-react";
import {
  balance,
  displayDate,
  money,
  today,
  type StateResponse,
} from "@/lib/model";
import { Context, type ModalSpec, type Page } from "./context";
import { Avatar, Badge, Empty, SectionHead, pngFile } from "./components";
import {
  Members,
  Meetings,
  Documents,
  Finances,
  Property,
  Tasks,
  SettingsPanel,
} from "./modules";
import { Forms } from "./forms";
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Members", icon: Users },
  { name: "Meetings", icon: CalendarDays },
  { name: "Documents", icon: Files },
  { name: "Finances", icon: Wallet },
  { name: "Property", icon: Gem },
  { name: "Tasks", icon: ListChecks },
] as const;
export default function Workspace() {
  const [settingsTab, setSettingsTab] = useState("Branding");
  const [data, setData] = useState<StateResponse | null>(null),
    [page, setPageRaw] = useState<Page>("Overview"),
    [modal, setModal] = useState<ModalSpec | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [selectedMeeting, setSelectedMeeting] = useState("");
  const load = useCallback(async (lodge?: string) => {
    const response = await fetch(
      "/api/state" + (lodge ? "?lodge=" + encodeURIComponent(lodge) : ""),
      { cache: "no-store" },
    );
    const body = (await response.json()) as StateResponse & { error?: string };
    if (!response.ok) throw new Error(body.error);
    setData(body);
    return body as StateResponse;
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const setPage = (p: Page) => {
    setPageRaw(p);
    if (p === "Settings") setSettingsTab("Branding");
    setMenu(false);
    setQuery("");
  };
  const command = async (action: string, payload: unknown) => {
    if (!data || busy) return null;
    if (data.demo && !["createLodge", "acceptInvite"].includes(action)) {
      setToast(
        "This is a read-only tour. Create your own workspace to save changes.",
      );
      return null;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          lodgeId: data.demo ? undefined : data.state.lodge.id,
          revision: data.state.revision,
          data: payload,
        }),
      });
      const result = (await r.json()) as {
        error?: string;
        lodgeId?: string;
        fileId?: string;
        ok?: boolean;
      };
      if (!r.ok) throw new Error(result.error);
      await load(result.lodgeId || data.state.lodge.id);
      setToast(
        action === "issueDocument"
          ? "Document issued and saved. No messages were sent."
          : "Changes saved to your lodge.",
      );
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file: File, purpose: "logo" | "asset" | "archive") => {
    if (!data || busy) return null;
    if (data.demo) {
      setToast("Create a workspace before uploading files.");
      return null;
    }
    setBusy(true);
    setError("");
    try {
      const converted = purpose === "archive" ? file : await pngFile(file),
        form = new FormData();
      form.set("file", converted);
      form.set("lodgeId", data.state.lodge.id);
      form.set("revision", String(data.state.revision));
      form.set("purpose", purpose);
      const r = await fetch("/api/files", { method: "POST", body: form }),
        result = (await r.json()) as { error?: string; fileId?: string };
      if (!r.ok) throw new Error(result.error);
      await load(data.state.lodge.id);
      setToast("File uploaded.");
      return result.fileId as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const open = (kind: string, payload?: any) => {
    setError("");
    setModal({ kind, data: payload });
  };
  if (!data)
    return (
      <div className="loading">
        <Compass size={46} />
        <h1>24 Inch Gauge</h1>
        <p>{error || "Opening your lodge workspace…"}</p>
        {error && (
          <button onClick={() => load().catch((e) => setError(e.message))}>
            Try again
          </button>
        )}
      </div>
    );
  const s = data.state,
    secretary = data.role === "secretary",
    officer = data.role !== "member";
  const upcoming = s.meetings
      .filter((m) => m.status === "Planned")
      .sort((a, b) => a.date.localeCompare(b.date)),
    nextMeeting = upcoming[0];
  const searchResults = query.trim()
    ? s.members
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    : [];
  const context = {
    data,
    s,
    busy,
    error,
    page,
    setPage,
    open,
    close: () => setModal(null),
    command,
    upload,
    selectedMeeting,
    setSelectedMeeting,
    notify: setToast,
  };
  return (
    <Context.Provider value={context}>
      <div className="app-shell">
        {menu && (
          <button
            className="nav-scrim"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}
        <aside className={"sidebar " + (menu ? "open" : "")}>
          <a
            className="wordmark"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage("Overview");
            }}
          >
            <Compass size={34} strokeWidth={1.2} />
            <span>
              24 Inch Gauge<small>THE LODGE WORKSPACE</small>
            </span>
          </a>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
          <div className="lodge-switch">
            <div className="lodge-seal">
              <Compass size={25} />
            </div>
            <div>
              <strong>{s.lodge.name}</strong>
              <span>
                No. {s.lodge.number} · {s.lodge.constitution}
              </span>
            </div>
            <ChevronDown size={15} />
            <select
              aria-label="Select lodge workspace"
              value={data.demo ? "tour" : s.lodge.id}
              onChange={(e) => {
                if (e.target.value === "new") open("create");
                else load(e.target.value).catch((e) => setError(e.message));
              }}
            >
              {data.demo && <option value="tour">Sample tour</option>}
              {data.lodges.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.number}
                  {l.sample ? " (sample)" : ""}
                </option>
              ))}
              {data.user && (
                <option value="new">+ Create another workspace</option>
              )}
            </select>
          </div>
          <span className="nav-label">WORKSPACE</span>
          <nav>
            {nav
              .filter((n) => officer || !["Property"].includes(n.name))
              .map((n) => (
                <button
                  key={n.name}
                  className={page === n.name ? "active" : ""}
                  onClick={() => setPage(n.name)}
                >
                  <n.icon size={18} />
                  <span>{n.name}</span>
                  {n.name === "Tasks" && (
                    <small>{s.tasks.filter((t) => !t.done).length}</small>
                  )}
                </button>
              ))}
          </nav>
          <div className="sidebar-bottom">
            {secretary && (
              <button
                className={
                  "settings-nav " + (page === "Settings" ? "active" : "")
                }
                onClick={() => setPage("Settings")}
              >
                <Settings size={18} />
                Lodge settings
              </button>
            )}
            <div className="plan-note">
              <ShieldCheck size={20} />
              <div>
                <b>Complimentary pilot</b>
                <p>
                  A considered beginning.
                  <br />
                  No subscription charges.
                </p>
              </div>
            </div>
            <div className="profile">
              <Avatar name={data.user?.name || "Sample Secretary"} />
              <div>
                <strong>
                  {data.user?.name?.split("@")[0] || "Sample Secretary"}
                </strong>
                <small>{data.demo ? "Read-only tour" : data.role}</small>
              </div>
              {data.user && (
                <a
                  title="Sign out"
                  aria-label="Sign out"
                  href="/signout-with-chatgpt?return_to=/"
                  target="_top"
                >
                  <LogOut size={16} />
                </a>
              )}
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <b>{page}</b>
            </div>
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label="Find a member"
                placeholder="Find a brother…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className="search-results">
                  {searchResults.length ? (
                    searchResults.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          open("memberDetail", m);
                          setQuery("");
                        }}
                      >
                        <Avatar name={m.name} />
                        {m.name}
                        <Badge>{m.degree}</Badge>
                      </button>
                    ))
                  ) : (
                    <p>No matching members.</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-button"
              aria-label="Refresh workspace"
              disabled={busy}
              onClick={() =>
                load(data.demo ? undefined : s.lodge.id)
                  .then(() => setToast("Workspace refreshed."))
                  .catch((e) => setError(e.message))
              }
            >
              <RotateCw size={17} />
            </button>
            <span className="today">{displayDate(today())}</span>
          </header>
          <main>
            <div
              className={
                "environment-banner " +
                (data.demo || s.lodge.sample ? "sample" : "")
              }
            >
              <span>
                <span className="status-dot" />
                {data.demo
                  ? "Read-only tour · fictional records"
                  : s.lodge.sample
                    ? "Sample workspace · fictional records"
                    : "Your lodge workspace"}
              </span>
              {data.demo ? (
                data.user ? (
                  <button onClick={() => open("create")}>
                    Create your workspace <ArrowRight size={13} />
                  </button>
                ) : (
                  <a href="/signin-with-chatgpt?return_to=/" target="_top">
                    Sign in to begin <ArrowRight size={13} />
                  </a>
                )
              ) : s.lodge.sample && secretary ? (
                <button onClick={() => open("create")}>
                  Create a live lodge <ArrowRight size={13} />
                </button>
              ) : (
                <span>Saved securely · {data.role}</span>
              )}
            </div>
            {data.pendingInvites.map((i) => (
              <div className="invitation-banner" key={i.id}>
                <Bell size={18} />
                <span>
                  You are invited to {i.lodgeName} as {i.role}.
                </span>
                <button
                  disabled={busy}
                  onClick={() => command("acceptInvite", { id: i.id })}
                >
                  Accept invitation
                </button>
              </div>
            ))}
            {error && (
              <div className="error-banner" role="alert">
                {error}
                <button
                  className="icon-button"
                  aria-label="Dismiss error"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {page === "Overview" && (
              <>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">THE SECRETARY’S DESK</span>
                    <h1>Your lodge, in good order.</h1>
                    <p>
                      People, meetings and records. Thoughtfully brought
                      together.
                    </p>
                  </div>
                  {secretary && (
                    <button className="primary" onClick={() => open("meeting")}>
                      <Plus size={16} />
                      Plan a meeting
                    </button>
                  )}
                </div>
                <div className="stats">
                  <div>
                    <span>
                      Active brethren
                      <Users size={16} />
                    </span>
                    <strong>
                      {s.members.filter((m) => m.status === "Active").length}
                    </strong>
                    <small>In your membership register</small>
                  </div>
                  <div>
                    <span>
                      Upcoming meetings
                      <CalendarDays size={16} />
                    </span>
                    <strong>{upcoming.length}</strong>
                    <small>Planned and ready to prepare</small>
                  </div>
                  <div>
                    <span>
                      {officer ? "Recorded bank balance" : "My dues balance"}
                      <Wallet size={16} />
                    </span>
                    <strong className="money-stat">
                      {money(
                        balance(
                          s.journal,
                          officer ? "Bank" : "Dues receivable",
                        ),
                        s.lodge.currency,
                      )}
                    </strong>
                    <small>
                      {officer
                        ? "From the lodge ledger"
                        : "From your dues records"}
                    </small>
                  </div>
                  <div>
                    <span>
                      Open tasks
                      <ListChecks size={16} />
                    </span>
                    <strong>{s.tasks.filter((t) => !t.done).length}</strong>
                    <small>A little attention goes a long way</small>
                  </div>
                </div>
                <div className="overview-grid">
                  <div className="overview-main">
                    <section className="next-meeting">
                      <div className="next-heading">
                        <span className="eyebrow">NEXT IN THE DIARY</span>
                        <CalendarDays size={20} />
                      </div>
                      {nextMeeting ? (
                        <>
                          <div className="next-body">
                            <div className="date-tile">
                              <strong>{nextMeeting.date.slice(8)}</strong>
                              <span>
                                {new Date(
                                  nextMeeting.date + "T12:00Z",
                                ).toLocaleDateString("en", { month: "short" })}
                              </span>
                            </div>
                            <div>
                              <h2>{nextMeeting.title}</h2>
                              <p>
                                {displayDate(nextMeeting.date)} ·{" "}
                                {nextMeeting.time}
                              </p>
                              <small>{nextMeeting.venue}</small>
                            </div>
                          </div>
                          <div className="next-bottom">
                            <span>
                              {nextMeeting.agenda.length} agenda items ·{" "}
                              {nextMeeting.ceremonies.length} scheduled
                              ceremonies
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMeeting(nextMeeting.id);
                                setPage("Documents");
                              }}
                            >
                              {secretary ? "Prepare summons" : "View documents"}
                              <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <Empty title="Space for your next meeting">
                          {secretary
                            ? "Plan a meeting to start preparing its summons."
                            : "Issued meeting notices will appear here."}
                        </Empty>
                      )}
                    </section>
                    <section className="panel">
                      <SectionHead
                        title="The brethren"
                        action="View register"
                        onClick={() => setPage("Members")}
                      />
                      <div className="member-list">
                        {s.members.slice(0, 5).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => open("memberDetail", m)}
                          >
                            <Avatar name={m.name} />
                            <div>
                              <b>{m.name}</b>
                              <small>{m.office || "Member"}</small>
                            </div>
                            <Badge>{m.degree}</Badge>
                            <ArrowRight size={14} />
                          </button>
                        ))}
                      </div>
                      {!s.members.length && (
                        <Empty title="Your register starts here">
                          Add members individually or import a CSV.
                        </Empty>
                      )}
                    </section>
                  </div>
                  <div className="overview-aside">
                    <section className="panel">
                      <SectionHead
                        title="On your desk"
                        action="All tasks"
                        onClick={() => setPage("Tasks")}
                      />
                      <div className="desk-tasks">
                        {s.tasks
                          .filter((t) => !t.done)
                          .slice(0, 4)
                          .map((t) => (
                            <div key={t.id}>
                              <button
                                className="task-check"
                                aria-label={"Complete " + t.title}
                                disabled={busy}
                                onClick={() =>
                                  command("toggleTask", {
                                    id: t.id,
                                    done: true,
                                  })
                                }
                              >
                                <Check size={13} />
                              </button>
                              <div>
                                <b>{t.title}</b>
                                <small>Due {displayDate(t.due)}</small>
                              </div>
                            </div>
                          ))}
                        {!s.tasks.some((t) => !t.done) && (
                          <Empty title="A clear desk">
                            There are no open tasks.
                          </Empty>
                        )}
                      </div>
                    </section>
                    <div className="heritage-card">
                      <Compass size={37} strokeWidth={1} />
                      <span className="eyebrow">
                        A BETTER WAY TO KEEP RECORDS
                      </span>
                      <h2>
                        Record it once.
                        <br />
                        Carry it forward.
                      </h2>
                      <p>
                        A confirmed ceremony updates the brother’s degree, the
                        draft minutes and his mentoring follow-up.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => setPage("Meetings")}
                      >
                        Explore meetings <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                {secretary && (
                  <section className="panel activity-preview">
                    <SectionHead
                      title="Recent lodge activity"
                      action="View activity"
                      onClick={() => {
                        setPage("Settings");
                        setSettingsTab("Activity & export");
                      }}
                    />
                    {s.audit.length ? (
                      s.audit.slice(0, 4).map((a) => (
                        <div key={a.id}>
                          <span className="activity-dot" />
                          <b>{a.action}</b>
                          <span>{a.actor}</span>
                          <small>{a.at.slice(0, 10)}</small>
                        </div>
                      ))
                    ) : (
                      <p className="muted">
                        Changes made in your workspace will leave a clear audit
                        trail here.
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
            {page === "Members" && <Members key={s.lodge.id + data.role} />}
            {page === "Meetings" && <Meetings key={s.lodge.id + data.role} />}
            {page === "Documents" && <Documents key={s.lodge.id + data.role} />}
            {page === "Finances" && <Finances key={s.lodge.id + data.role} />}
            {page === "Property" && <Property key={s.lodge.id + data.role} />}
            {page === "Tasks" && <Tasks key={s.lodge.id + data.role} />}
            {page === "Settings" && secretary && (
              <SettingsPanel
                key={s.lodge.id + data.role}
                initialTab={settingsTab}
              />
            )}
            <footer className="workspace-footer">
              <span>24 Inch Gauge</span>
              <span>Built for the work behind the Lodge.</span>
            </footer>
          </main>
        </div>
        {modal && <Forms spec={modal} />}
        <div className={"toast " + (toast ? "visible" : "")} role="status">
          {toast && (
            <>
              <Check size={16} />
              {toast}
            </>
          )}
        </div>
      </div>
    </Context.Provider>
  );
}
