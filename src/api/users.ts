import { Request, Response } from "express";

import { respondWithJSON } from "../lib/utils/json.js";
import { createUser, updateUser } from "../db/queries/users.js";
import { NewUser, User } from "../db/schema.js";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../lib/utils/errors.js";
import { getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { cfg } from "../config.js";

const SECRET = cfg.jwt.secret;

export type UserResponse = Omit<User, "hashedPassword">;

type parameters = {
  username: string;
  password: string;
};

export async function handlerAddUser(req: Request, res: Response) {
  const params: parameters = req.body;
  if (!params.username || !params.password) {
    throw new BadRequestError("missing required fields for user");
  }

  const hashed = await hashPassword(params.password);

  const user = await createUser({
    username: params.username,
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
  const params: parameters = req.body;
  if (!params.username || !params.password) {
    throw new BadRequestError("missing required fields for user");
  }

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);
  if (!validJWT?.sub) {
    throw new UnauthorizedError("invalid token");
  }
  const hashed = await hashPassword(params.password);

  const user = await updateUser(validJWT.sub, hashed, params.username);

  respondWithJSON(res, 200, {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies UserResponse);
}
