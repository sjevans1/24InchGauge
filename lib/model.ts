export type Role = "secretary" | "master" | "treasurer" | "member";
export type Degree = "Candidate" | "EA" | "FC" | "MM";
export const degrees: Degree[] = ["Candidate", "EA", "FC", "MM"];
export const roles: Role[] = ["secretary", "master", "treasurer", "member"];
export type Brand = {
  color: string;
  layout: "traditional" | "compact";
  logoId: string;
  greeting: string;
  footer: string;
  sections: string[];
};
export type Lodge = {
  id: string;
  name: string;
  number: string;
  constitution: "English" | "Scottish" | "Irish";
  currency: "JMD" | "KYD" | "USD";
  venue: string;
  sample: boolean;
  plan: "Complimentary pilot";
  brand: Brand;
};
export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  degree: Degree;
  office: string;
  status: "Active" | "Resigned" | "Deceased" | "Suspended";
  joined: string;
};
export type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  type: "Regular" | "Committee" | "Installation" | "Emergency";
  agenda: string[];
  ceremonies: { memberId: string; degree: Degree }[];
  status: "Planned" | "Completed" | "Cancelled";
  attendance: string[];
  minutes: string;
  minutesStatus: "Draft" | "Approved";
};
export type Task = {
  id: string;
  title: string;
  due: string;
  memberId: string;
  done: boolean;
  meetingId?: string;
};
export type Entry = { account: string; debit: number; credit: number };
export type Journal = {
  id: string;
  date: string;
  description: string;
  type: "Receipt" | "Expense" | "Assessment" | "Reversal";
  category: string;
  amount: number;
  memberId: string;
  fund: string;
  entries: Entry[];
  reverses?: string;
};
export type Asset = {
  id: string;
  name: string;
  category: string;
  condition: "Excellent" | "Good" | "Fair" | "Needs repair";
  value: number;
  custodian: string;
  location: string;
  photoId: string;
  history: {
    at: string;
    custodian: string;
    condition: string;
    location: string;
  }[];
};
export type DegreeEvent = {
  id: string;
  memberId: string;
  from: Degree;
  to: Degree;
  date: string;
  meetingId: string;
  correctionOf?: string;
  reason?: string;
};
export type DocumentSnapshot = {
  lodge: Lodge;
  meeting: Meeting;
  officers: { name: string; office: string }[];
  ceremonies: { name: string; degree: Degree }[];
  kind: "Summons" | "Minutes";
  issuedAt: string;
};
export type Document = {
  id: string;
  meetingId: string;
  title: string;
  kind: "Summons" | "Minutes";
  issuedAt: string;
  fileId: string;
  snapshot: DocumentSnapshot;
};
export type FileRecord = {
  id: string;
  name: string;
  mime: string;
  size: number;
  purpose: "logo" | "asset" | "archive" | "document";
  createdAt: string;
};
export type Access = {
  userId: string;
  email: string;
  role: Role;
  memberId: string | null;
  endsAt: string | null;
};
export type Invitation = {
  id: string;
  email: string;
  role: Role;
  memberId: string | null;
  endsAt: string | null;
  expiresAt: string;
  acceptedBy?: string | null;
};
export type Audit = { id: string; actor: string; action: string; at: string };
export type State = {
  lodge: Lodge;
  revision: number;
  members: Member[];
  meetings: Meeting[];
  tasks: Task[];
  journal: Journal[];
  assets: Asset[];
  events: DegreeEvent[];
  documents: Document[];
  files: FileRecord[];
  access: Access[];
  invites: Invitation[];
  audit: Audit[];
};
export type Identity = { id: string; email: string; name: string };
export type StateResponse = {
  user: Identity | null;
  lodges: {
    id: string;
    name: string;
    number: string;
    sample: boolean;
    role: Role;
  }[];
  state: State;
  role: Role;
  demo: boolean;
  pendingInvites: (Invitation & { lodgeName: string })[];
};
export const defaultBrand: Brand = {
  color: "#2e4b40",
  layout: "traditional",
  logoId: "",
  greeting:
    "Dear Sir and Brother, you are requested to attend the following meeting of the Lodge.",
  footer: "Brotherly love · Relief · Truth",
  sections: ["Notice", "Agenda", "Officers", "Notices"],
};
export function emptyState(lodge: Lodge): State {
  return {
    lodge,
    revision: 0,
    members: [],
    meetings: [],
    tasks: [],
    journal: [],
    assets: [],
    events: [],
    documents: [],
    files: [],
    access: [],
    invites: [],
    audit: [],
  };
}
export const id = () => crypto.randomUUID();
export const today = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export const money = (cents: number, currency = "JMD") =>
  new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const displayDate = (date: string) =>
  date
    ? new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "America/Jamaica",
      })
    : "—";
export const balance = (journal: Journal[], account: string) =>
  journal
    .flatMap((j) => j.entries)
    .reduce(
      (sum, e) => sum + (e.account === account ? e.debit - e.credit : 0),
      0,
    );
export const memberBalance = (s: State, memberId: string) =>
  balance(
    s.journal.filter((j) => j.memberId === memberId),
    "Dues receivable",
  );
export function snapshot(
  s: State,
  meeting: Meeting,
  kind: DocumentSnapshot["kind"],
  issuedAt: string,
): DocumentSnapshot {
  return structuredClone({
    lodge: s.lodge,
    meeting,
    kind,
    issuedAt,
    officers: s.members
      .filter((m) => m.status === "Active" && m.office)
      .map((m) => ({ name: m.name, office: m.office })),
    ceremonies: meeting.ceremonies.map((c) => ({
      name:
        s.members.find((m) => m.id === c.memberId)?.name || "Unknown member",
      degree: c.degree,
    })),
  });
}
export function visibleState(state: State, access: Access): State {
  const s = structuredClone(state);
  if (access.role === "secretary") return s;
  s.access = [];
  s.invites = [];
  s.audit = [];
  s.files = s.files.filter((f) => f.purpose !== "archive");
  if (access.role === "treasurer") {
    s.events = [];
    s.tasks = s.tasks.filter((t) => t.memberId === access.memberId);
  }
  if (access.role !== "member") return s;
  s.members = s.members.map((m) =>
    m.id === access.memberId ? m : { ...m, email: "", phone: "", joined: "" },
  );
  s.journal = s.journal.filter((j) => j.memberId === access.memberId);
  s.assets = [];
  s.events = s.events.filter((e) => e.memberId === access.memberId);
  s.tasks = s.tasks.filter((t) => t.memberId === access.memberId);
  const issued = new Set(s.documents.map((d) => d.meetingId));
  s.meetings = s.meetings
    .filter((m) => issued.has(m.id))
    .map((m) => ({
      ...m,
      attendance: [],
      ceremonies: [],
      minutes: m.minutesStatus === "Approved" ? m.minutes : "",
    }));
  s.files = s.files.filter(
    (f) => f.purpose === "logo" || s.documents.some((d) => d.fileId === f.id),
  );
  // Issued document snapshots are intentional member-visible publications.
  return s;
}
