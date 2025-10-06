import { Request, Response, NextFunction } from "express";
import { respondWithError } from "../lib/utils/json.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../lib/utils/errors.js";

export function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.on("finish", () => {
    const { statusCode } = res;

    if (statusCode > 399) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });

  next();
}

export function middlewareErrors(
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction
) {
  if (
    err instanceof BadRequestError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError ||
    err instanceof NotFoundError
  ) {
    console.log(`error: ${err.code} - ${err.message}`);
    respondWithError(res, err.code, err.message);
  } else {
    console.log(`error: 500 - ${err.message}`);
    respondWithError(res, 500, err.message);
  }
}
