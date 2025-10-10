import { Router } from "express";

import { asyncHandler } from "#lib/http/asyncHandler.js";
import { requireAuth } from "#api/middleware/auth.js";
import {
  handlerGenerateResume,
  handlerGenerateResumePdf,
} from "./resume.js";

export const router = Router();

router.post("/", requireAuth, asyncHandler(handlerGenerateResume));
router.post("/pdf", requireAuth, asyncHandler(handlerGenerateResumePdf));
