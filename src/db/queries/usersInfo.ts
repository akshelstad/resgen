import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { userProfiles, NewUserProfile, UserProfile } from "../schema.js";

export async function saveUserProfile(userProfile: NewUserProfile) {
  const [result] = await db
    .insert(userProfiles)
    .values(userProfile)
    .returning();
  return result;
}

export async function getUserProfile(userId: string) {
  const [result] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));
  return result;
}

export async function updateUserProfile(
  userId: string,
  userProfile: UserProfile
) {
  const [result] = await db
    .update(userProfiles)
    .set({
      name: userProfile.name,
      title: userProfile.title,
      targetRole: userProfile.targetRole,
      skills: userProfile.skills,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))
    .returning();
  return result;
}

export async function deleteUserProfile(userId: string) {
  const [result] = await db
    .delete(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .returning();
  return result;
}
