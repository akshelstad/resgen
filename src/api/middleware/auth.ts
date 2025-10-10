import { Request, Response, NextFunction } from "express";
import { getBearerToken, validateJWT } from "#auth";
import { UnauthorizedError } from "#lib/errors/http.js";
import { cfg } from "#config";

const SECRET = cfg.jwt.secret;

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    const payload = await validateJWT(token, SECRET);
    if (!payload?.sub) throw new UnauthorizedError("invalid token");
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
}
