import { getUserByUsername } from "../../db/queries/users/users.js";
import { respondWithJSON } from "../../lib/json/response.js";
import { UnauthorizedError } from "../../lib/errors/http.js";
import {
  checkPasswordHash,
  getBearerToken,
  makeJWT,
  makeRefreshToken,
} from "../../auth.js";

import { Request, Response } from "express";
import { cfg } from "../../config.js";
import type { UserResponse } from "./users.js";
import {
  revokeRefreshToken,
  saveRefreshToken,
  userForRefreshToken,
} from "../../db/queries/auth/refresh.js";

const DEF_DURATION = cfg.jwt.defaultDuration;
const SECRET = cfg.jwt.secret;

type LoginResponse = UserResponse & {
  token: string;
  refreshToken: string;
};

export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    password: string;
    username: string;
  };

  const params: parameters = req.body;

  const user = await getUserByUsername(params.username);
  if (!user) {
    throw new UnauthorizedError("invalid username or password");
  }

  const validPw = await checkPasswordHash(params.password, user.hashedPassword);
  if (!validPw) {
    throw new UnauthorizedError("invalid password");
  }

  const accessToken = await makeJWT(user.id, DEF_DURATION, SECRET);
  const refreshToken = await makeRefreshToken();

  const saved = await saveRefreshToken(user.id, refreshToken);
  if (!saved) {
    throw new UnauthorizedError("unable to save refresh token");
  }

  respondWithJSON(res, 200, {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token: accessToken,
    refreshToken,
  } satisfies LoginResponse);
}

export async function handlerRefresh(req: Request, res: Response) {
  type tokenResponse = {
    token: string;
  };

  const refreshToken = getBearerToken(req);

  const result = await userForRefreshToken(refreshToken);
  if (!result) {
    throw new UnauthorizedError("invalid refresh token");
  }

  const user = result.user;
  const accessToken = await makeJWT(user.id, DEF_DURATION, SECRET);

  respondWithJSON(res, 200, { token: accessToken } satisfies tokenResponse);
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}
