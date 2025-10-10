import { Router } from "express";

import { asyncHandler } from "#lib/http/asyncHandler.js";
import { requireAuth } from "#api/middleware/auth.js";
import { handlerReadiness } from "./dev/readiness.js";
import {
  handlerLogin,
  handlerRefresh,
  handlerRevoke,
} from "./users/auth.js";
import { router as usersRouter } from "./users/router.js";
import { router as resumeRouter } from "./resume/router.js";

export const router = Router();

router.get("/healthz", asyncHandler(handlerReadiness));

router.post("/login", asyncHandler(handlerLogin));
router.post("/refresh", asyncHandler(handlerRefresh));
router.post("/revoke", requireAuth, asyncHandler(handlerRevoke));

router.use("/users", usersRouter);
router.use("/resume", resumeRouter);
