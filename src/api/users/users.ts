import { Request, Response } from "express";

import { respondWithJSON } from "../../lib/json/response.js";
import { createUser, updateUser } from "../../db/queries/users/users.js";
import { NewUser, User } from "../../db/schema.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../lib/errors/http.js";
import { getBearerToken, hashPassword, validateJWT } from "../../auth.js";
import { cfg } from "../../config.js";

const SECRET = cfg.jwt.secret;

export type UserResponse = Omit<User, "hashedPassword">;

type RawUserPayload = {
  username?: unknown;
  password?: unknown;
};

type UserPayload = {
  username: string;
  password: string;
};

export async function handlerAddUser(req: Request, res: Response) {
  parseUserPayload(req.body);
  const { username, password } = req.body as UserPayload;

  const hashed = await hashPassword(password);

  const user = await createUser({
    username,
    hashedPassword: hashed,
  } satisfies NewUser);

  if (!user) {
    throw new InternalServerError("unable to create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies UserResponse);
}

export async function handlerUpdateUser(req: Request, res: Response) {
  parseUserPayload(req.body);
  const { username, password } = req.body as UserPayload;

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);
  if (!validJWT?.sub) {
    throw new UnauthorizedError("invalid token");
  }
  const hashed = await hashPassword(password);

  const user = await updateUser(validJWT.sub, hashed, username);
  if (!user) {
    throw new NotFoundError("user not found");
  }

  respondWithJSON(res, 200, {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies UserResponse);
}

function parseUserPayload(
  body: unknown
): asserts body is { username: string; password: string } {
  const { username, password } = body as RawUserPayload;
  if (typeof username !== "string" || username.trim().length < 3) {
    throw new BadRequestError("username must be a non-empty string");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new BadRequestError("password must be at least 8 characters");
  }
}
