import { db } from "../../../index.js";
import { sql, eq } from "drizzle-orm";
import {
  userProfiles,
  type NewUserProfile,
  type UserProfile,
} from "../../../schema.js";

export async function saveUserProfile(row: NewUserProfile) {
  const [result] = await db.insert(userProfiles).values(row).returning();
  return result;
}

export async function getUserProfile(userId: string) {
  const [result] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));
  return result ?? null;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<UserProfile> & { email?: string | null; phone?: string | null }
) {
  const set: Record<string, unknown> = { updatedAt: sql`now()` };
  if (typeof patch.name !== "undefined") set["name"] = patch.name;
  if (typeof patch.title !== "undefined") set["title"] = patch.title;
  if (typeof patch.targetRole !== "undefined")
    set["targetRole"] = patch.targetRole;
  if (typeof patch.skills !== "undefined") set["skills"] = patch.skills;
  if (typeof patch.email !== "undefined") set["email"] = patch.email;
  if (typeof patch.phone !== "undefined") set["phone"] = patch.phone;

  const [result] = await db
    .update(userProfiles)
    .set(set)
    .where(eq(userProfiles.userId, userId))
    .returning();
  return result ?? null;
}

export async function deleteUserProfile(userId: string) {
  const [result] = await db
    .delete(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .returning();
  return result ?? null;
}

export async function upsertUserProfile(row: NewUserProfile) {
  const [result] = await db
    .insert(userProfiles)
    .values(row)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        name: row.name,
        title: row.title ?? null,
        targetRole: row.targetRole ?? null,
        skills: row.skills ?? sql`'{}'::text[]`,
        email: row.email ?? null,
        phone: row.phone ?? null,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return result;
}
