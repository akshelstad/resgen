import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUserByUsername(username: string) {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return result;
}

export async function getUserById(userId: string) {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  return result;
}

export async function updateUser(
  userId: string,
  hashedPassword: string,
  username: string
) {
  const [result] = await db
    .update(users)
    .set({
      username: username,
      hashedPassword: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return result;
}

export async function reset() {
  await db.delete(users);
}
