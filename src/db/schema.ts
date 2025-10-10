import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  username: varchar("username", { length: 256 }).unique().notNull(),
  hashedPassword: varchar("hashed_password").notNull().default("unset"),
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const refreshTokens = pgTable("refresh_tokens", {
  token: varchar("token", { length: 256 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});

export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    targetRole: text("target_role"),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 32 }),
    skills: text("skills")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => {
    return {
      contactRequired: {
        check: sql`CHECK (email IS NOT NULL OR phone IS NOT NULL)`,
      },
    };
  }
);

export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  // store ISO YYYY-MM or full ISO dates
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }), // nullable for "present"
  bullets: text("bullets")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  // optional UI ordering if you don’t want to rely on date sorting
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type NewExperience = typeof experiences.$inferInsert;
export type Experience = typeof experiences.$inferSelect;

export const educations = pgTable("educations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  credential: text("credential").notNull(),
  year: integer("year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type NewEducation = typeof educations.$inferInsert;
export type Education = typeof educations.$inferSelect;

export const resumeDrafts = pgTable("resume_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetRole: text("target_role"),
  bodyJson: text("body_json").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type NewResumeDraft = typeof resumeDrafts.$inferInsert;
export type ResumeDraft = typeof resumeDrafts.$inferSelect;

export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  experiences: many(experiences),
  educations: many(educations),
  drafts: many(resumeDrafts),
}));
