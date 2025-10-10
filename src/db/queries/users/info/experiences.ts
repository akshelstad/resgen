import { db } from "../../../index.js";
import { sql, eq, desc, asc } from "drizzle-orm";
import {
  experiences,
  type NewExperience,
  type Experience,
} from "../../../schema.js";

export async function saveExperience(row: NewExperience) {
  const [result] = await db.insert(experiences).values(row).returning();
  return result;
}

export async function saveExperiences(rows: NewExperience[]) {
  if (!rows.length) return []; // may not be needed. may be able to handle in API handler.
  const results = await db.insert(experiences).values(rows).returning();
  return results;
}

export async function getExperiencesByUser(userId: string) {
  const result = await db
    .select()
    .from(experiences)
    .where(eq(experiences.userId, userId))
    .orderBy(desc(experiences.startDate), asc(experiences.sortOrder));
  return result;
}

export async function getExperienceById(id: string) {
  const [result] = await db
    .select()
    .from(experiences)
    .where(eq(experiences.id, id));
  return result;
}

export async function updateExperienceById(
  id: string,
  patch: Partial<Experience>
) {
  const [result] = await db
    .update(experiences)
    .set({
      company: patch.company,
      title: patch.title,
      location: patch.location ?? null,
      startDate: patch.startDate,
      endDate: patch.endDate ?? null,
      bullets: patch.bullets,
      sortOrder: patch.sortOrder,
      updatedAt: sql`now()`,
    })
    .where(eq(experiences.id, id))
    .returning();
  return result ?? null;
}

export async function deleteExperienceById(id: string) {
  const [result] = await db
    .delete(experiences)
    .where(eq(experiences.id, id))
    .returning();
  return result ?? null;
}

export async function deleteExperiencesByUser(userId: string) {
  const results = await db
    .delete(experiences)
    .where(eq(experiences.userId, userId))
    .returning();
  return results;
}

export async function replaceAllExperiences(
  userId: string,
  rows: NewExperience[]
) {
  return db.transaction(async (tx) => {
    await tx.delete(experiences).where(eq(experiences.userId, userId));
    if (!rows.length) return [];
    const toInsert = rows.map((r) => ({ ...r, userId }));
    const inserted = await tx.insert(experiences).values(toInsert).returning();
    return inserted;
  });
}

export async function upsertExperiences(rows: NewExperience[]) {
  if (!rows.length) return []; // may not be needed. may be able to handle in API handler.
  const results = await db
    .insert(experiences)
    .values(rows)
    .onConflictDoUpdate({
      target: experiences.id,
      set: {
        company: sql`excluded.company`,
        title: sql`excluded.title`,
        location: sql`excluded.location`,
        startDate: sql`excluded.start_date`,
        endDate: sql`excluded.end_date`,
        bullets: sql`excluded.bullets`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return results;
}
