import { db } from "../../../index.js";
import { sql, eq, desc } from "drizzle-orm";
import {
  educations,
  type NewEducation,
  type Education,
} from "../../../schema.js";

export async function saveEducation(row: NewEducation) {
  const [result] = await db.insert(educations).values(row).returning();
  return result;
}

export async function saveEducations(rows: NewEducation[]) {
  if (!rows.length) return []; // may not be needed. may be able to handle in API handler.
  const results = await db.insert(educations).values(rows).returning();
  return results;
}

export async function getEducationsByUser(userId: string) {
  const results = await db
    .select()
    .from(educations)
    .where(eq(educations.userId, userId))
    .orderBy(desc(educations.year));
  return results;
}

export async function getEducationById(id: string) {
  const [result] = await db
    .select()
    .from(educations)
    .where(eq(educations.id, id));
  return result;
}

export async function updateEducationById(
  id: string,
  patch: Partial<Education>
) {
  const [result] = await db
    .update(educations)
    .set({
      school: patch.school,
      credential: patch.credential,
      year: patch.year ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(educations.id, id))
    .returning();
  return result ?? null;
}

export async function deleteEducationById(id: string) {
  const [result] = await db
    .delete(educations)
    .where(eq(educations.id, id))
    .returning();
  return result ?? null;
}

export async function deleteEducationsByUser(userId: string) {
  const results = await db
    .delete(educations)
    .where(eq(educations.userId, userId))
    .returning();
  return results;
}

export async function replaceAllEducations(
  userId: string,
  rows: NewEducation[]
) {
  return db.transaction(async (tx) => {
    await tx.delete(educations).where(eq(educations.userId, userId));
    if (!rows.length) return [];
    const toInsert = rows.map((r) => ({ ...r, userId }));
    const inserted = await tx.insert(educations).values(toInsert).returning();
    return inserted;
  });
}

export async function upsertEducation(rows: NewEducation[]) {
  if (!rows.length) return []; // may not be needed. may be able to handle in API handler.
  const results = await db
    .insert(educations)
    .values(rows)
    .onConflictDoUpdate({
      target: educations.id,
      set: {
        school: sql`excluded.school`,
        credential: sql`excluded.credential`,
        year: sql`excluded.year`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return results;
}
