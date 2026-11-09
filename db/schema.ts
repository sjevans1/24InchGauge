import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const lodges = sqliteTable("lodges", {
  id: text("id").primaryKey(),
  config: text("config").notNull(),
  revision: integer("revision").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const access = sqliteTable(
  "lodge_access",
  {
    lodgeId: text("lodge_id")
      .notNull()
      .references(() => lodges.id),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    memberId: text("member_id"),
    endsAt: text("ends_at"),
  },
  (t) => [
    primaryKey({ columns: [t.lodgeId, t.userId] }),
    index("access_user").on(t.userId),
  ],
);
export const records = sqliteTable(
  "records",
  {
    lodgeId: text("lodge_id")
      .notNull()
      .references(() => lodges.id),
    id: text("id").notNull(),
    kind: text("kind").notNull(),
    data: text("data").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.lodgeId, t.id] }),
    index("records_lodge_kind").on(t.lodgeId, t.kind),
  ],
);
export const audit = sqliteTable(
  "audit",
  {
    id: text("id").primaryKey(),
    lodgeId: text("lodge_id")
      .notNull()
      .references(() => lodges.id),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("audit_lodge_time").on(t.lodgeId, t.createdAt)],
);
export const invites = sqliteTable(
  "invites",
  {
    id: text("id").primaryKey(),
    lodgeId: text("lodge_id")
      .notNull()
      .references(() => lodges.id),
    email: text("email").notNull(),
    role: text("role").notNull(),
    memberId: text("member_id"),
    expiresAt: text("expires_at").notNull(),
    endsAt: text("ends_at"),
    acceptedBy: text("accepted_by"),
  },
  (t) => [index("invites_email").on(t.email)],
);
export const transactionGuards = sqliteTable(
  "transaction_guards",
  { id: text("id").primaryKey(), valid: integer("valid").notNull() },
  (t) => [check("guard_valid", sql`${t.valid} = 1`)],
);
