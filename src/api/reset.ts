import { Request, Response } from "express";
import { ForbiddenError } from "../lib/utils/errors.js";
import { reset } from "../db/queries/users.js";
import { cfg } from "../config.js";

export async function handlerReset(_: Request, res: Response) {
  if (cfg.api.platform !== "dev") {
    console.log(`Platform: ${cfg.api.platform}`);
    throw new ForbiddenError("reset is only allowed in dev environment.");
  }
  await reset();

  res.write("Database has been reset successfully");
  res.end();
}
