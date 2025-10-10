import { db } from "../../index.js";
import { eq } from "drizzle-orm";
import { NewUser, users } from "../../schema.js";
import { getUserProfile } from "./info/profiles.js";
import { getExperiencesByUser } from "./info/experiences.js";
import { getEducationsByUser } from "./info/educations.js";

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

export async function hydrateUserData(userId: string) {
  const [profile, exp, edu] = await Promise.all([
    getUserProfile(userId),
    getExperiencesByUser(userId),
    getEducationsByUser(userId),
  ]);
  return { profile, experiences: exp, educations: edu };
}

export async function toGenerateResumeRequest(userId: string) {
  const {
    profile,
    experiences: exp,
    educations: edu,
  } = await hydrateUserData(userId);

  return {
    name: profile?.name ?? "",
    title: profile?.title ?? "",
    target_role: profile?.targetRole ?? "",
    contact: {
      email: profile?.email ?? undefined,
      phone: profile?.phone ?? undefined,
    },
    experience: exp.map((e) => ({
      company: e.company,
      location: e.location ?? "",
      title: e.title,
      start_date: e.startDate,
      end_date: e.endDate ?? "",
      achievements: e.bullets ?? [],
    })),
    education: edu.map((d) => ({
      school: d.school,
      degree: d.credential,
      year: d.year ?? undefined,
    })),
  };
}
