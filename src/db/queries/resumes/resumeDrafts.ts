import { db } from "../../index.js";
import { eq, desc } from "drizzle-orm";
import { resumeDrafts, type NewResumeDraft } from "../../schema.js";

export async function saveResumeDraft(row: NewResumeDraft) {
  const [result] = await db.insert(resumeDrafts).values(row).returning();
  return result;
}

export async function getResumeDraftsByUser(userId: string) {
  const results = await db
    .select()
    .from(resumeDrafts)
    .where(eq(resumeDrafts.userId, userId))
    .orderBy(desc(resumeDrafts.createdAt));
  return results;
}

export async function getLatestResumeDraft(userId: string) {
  const [result] = await db
    .select()
    .from(resumeDrafts)
    .where(eq(resumeDrafts.userId, userId))
    .orderBy(desc(resumeDrafts.createdAt))
    .limit(1);
  return result ?? null;
}

export async function deleteResumeDraft(id: string) {
  const [result] = await db
    .delete(resumeDrafts)
    .where(eq(resumeDrafts.id, id))
    .returning();
  return result ?? null;
}
