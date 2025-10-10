import { Request, Response, NextFunction } from "express";
import { respondWithError } from "../../lib/json/response.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
  BadGatewayError,
} from "../../lib/errors/http.js";

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
    err instanceof NotFoundError ||
    err instanceof InternalServerError ||
    err instanceof BadGatewayError
  ) {
    console.log(`error: ${err.code} - ${err.message}`);
    respondWithError(res, err.code, err.message);
  } else {
    console.log(`error: 500 - ${err.message}`);
    respondWithError(res, 500, err.message);
  }
}
