import { Router } from "express";

import { asyncHandler } from "#lib/http/asyncHandler.js";
import { requireAuth } from "#api/middleware/auth.js";
import { handlerAddUser, handlerUpdateUser } from "./users.js";
import {
  handlerUpsertUserProfile,
  handlerGetUserProfile,
  handlerDeleteProfile,
} from "./profile.js";
import {
  handlerUpsertExperiences,
  handlerDeleteAllExperiences,
  handlerGetAllExperiences,
  handlerUpdateExperienceById,
  handlerDeleteExperienceById,
} from "./experience.js";
import {
  handlerUpsertEducations,
  handlerDeleteAllEducations,
  handlerGetAllEducations,
  handlerUpdateEducationById,
  handlerDeleteEducationById,
} from "./education.js";

export const router = Router();

router.post("/", asyncHandler(handlerAddUser));
router.put("/", requireAuth, asyncHandler(handlerUpdateUser));

router.post(
  "/profile",
  requireAuth,
  asyncHandler(handlerUpsertUserProfile)
);
router.put(
  "/profile",
  requireAuth,
  asyncHandler(handlerUpsertUserProfile)
);
router.get(
  "/profile",
  requireAuth,
  asyncHandler(handlerGetUserProfile)
);
router.delete(
  "/profile",
  requireAuth,
  asyncHandler(handlerDeleteProfile)
);

router.post(
  "/experience",
  requireAuth,
  asyncHandler(handlerUpsertExperiences)
);
router.get(
  "/experience",
  requireAuth,
  asyncHandler(handlerGetAllExperiences)
);
router.put(
  "/experience/:id",
  requireAuth,
  asyncHandler(handlerUpdateExperienceById)
);
router.delete(
  "/experience",
  requireAuth,
  asyncHandler(handlerDeleteAllExperiences)
);
router.delete(
  "/experience/:id",
  requireAuth,
  asyncHandler(handlerDeleteExperienceById)
);

router.post(
  "/education",
  requireAuth,
  asyncHandler(handlerUpsertEducations)
);
router.get(
  "/education",
  requireAuth,
  asyncHandler(handlerGetAllEducations)
);
router.put(
  "/education/:id",
  requireAuth,
  asyncHandler(handlerUpdateEducationById)
);
router.delete(
  "/education",
  requireAuth,
  asyncHandler(handlerDeleteAllEducations)
);
router.delete(
  "/education/:id",
  requireAuth,
  asyncHandler(handlerDeleteEducationById)
);
