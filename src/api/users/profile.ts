import { Request, Response } from "express";

import { respondWithJSON } from "../../lib/json/response.js";
import {
  saveUserProfile,
  updateUserProfile,
  getUserProfile,
  deleteUserProfile,
  upsertUserProfile,
} from "../../db/queries/users/info/profiles.js";

import { NewUserProfile, UserProfile } from "../../db/schema.js";
import { BadRequestError, UnauthorizedError } from "../../lib/errors/http.js";

type ProfilePayload = {
  name: string;
  userId: string;
  title?: string;
  targetRole?: string;
  email?: string;
  phone?: string;
  skills?: string[];
};

export async function handlerUpsertUserProfile(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { name, title, targetRole, email, phone, skills } =
    req.body as ProfilePayload;

  if (!name) {
    throw new BadRequestError("missing required field 'name'");
  }

  const profile = await upsertUserProfile({
    name,
    userId,
    title,
    targetRole,
    email,
    phone,
    skills,
  } satisfies NewUserProfile);

  if (!profile) {
    throw new BadRequestError("unable to create user profile");
  }

  respondWithJSON(res, 201, {
    userId: profile.userId,
    name: profile.name,
    title: profile.title,
    targetRole: profile.targetRole,
    email: profile.email,
    phone: profile.phone,
    skills: profile.skills,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
}

export async function handlerCreateUserProfile(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { name, title, targetRole, email, phone, skills } =
    req.body as ProfilePayload;

  if (!name) {
    throw new BadRequestError("missing required field 'name'");
  }

  const profile = await saveUserProfile({
    name,
    userId,
    title,
    targetRole,
    email,
    phone,
    skills,
  } satisfies NewUserProfile);

  if (!profile) {
    throw new BadRequestError("unable to create user profile");
  }

  respondWithJSON(res, 201, {
    userId: profile.userId,
    name: profile.name,
    title: profile.title,
    targetRole: profile.targetRole,
    email: profile.email,
    phone: profile.phone,
    skills: profile.skills,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
}

export async function handlerUpdateUserProfile(req: Request, res: Response) {}

export async function handlerGetUserProfile(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new BadRequestError("unable to retrieve user profile");
  }

  respondWithJSON(res, 200, {
    userId: profile.userId,
    name: profile.name,
    title: profile.title,
    targetRole: profile.targetRole,
    email: profile.email,
    phone: profile.phone,
    skills: profile.skills,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  } satisfies UserProfile);
}

export async function handlerDeleteProfile(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const deleted = await deleteUserProfile(userId);
  if (!deleted) {
    throw new BadRequestError("unable to delete user profile");
  }

  res.status(204).send();
}
