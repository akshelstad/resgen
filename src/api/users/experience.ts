import { Request, Response } from "express";

import { respondWithJSON } from "../../lib/json/response.js";
import {
  saveExperience,
  saveExperiences,
  upsertExperiences,
  getExperiencesByUser,
  updateExperienceById,
  deleteExperienceById,
  deleteExperiencesByUser,
  replaceAllExperiences,
  getExperienceById,
} from "../../db/queries/users/info/experiences.js";

import { NewExperience, Experience } from "../../db/schema.js";
import { BadRequestError, UnauthorizedError } from "../../lib/errors/http.js";

type ExperiencePayload = {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  bullets?: string[];
  sortOrder?: number;
};

export async function handlerUpsertExperiences(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const expArray = Array.isArray(req.body) ? req.body : [req.body];

  const rows: NewExperience[] = expArray.map(
    (exp, index) =>
      ({
        id: exp.id,
        userId,
        company: exp.company,
        title: exp.title,
        location: exp.location ?? null,
        startDate: exp.startDate,
        endDate: exp.endDate ?? null,
        bullets: exp.bullets ?? [],
        sortOrder: exp.sortOrder ?? index,
      } satisfies NewExperience)
  );

  const results = await upsertExperiences(rows);
  if (!results) {
    throw new BadRequestError("unable to upsert experience");
  }

  respondWithJSON(res, 201, results);
}

export async function handlerGetAllExperiences(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const experiences = await getExperiencesByUser(userId);
  if (!experiences) {
    throw new BadRequestError(
      `unable to retrieve experiences for userId ${userId}`
    );
  }

  respondWithJSON(res, 200, experiences);
}

export async function handlerUpdateExperienceById(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("missing 'id' param");
  }

  const dbExp = await getExperienceById(id);
  if (!dbExp) {
    throw new BadRequestError("invalid experience id");
  }

  const { company, title, startDate, endDate, location, bullets, sortOrder } =
    req.body as ExperiencePayload;
  if (!company) throw new BadRequestError("missing required field 'company'");
  if (!title) throw new BadRequestError("missing required field 'title'");
  if (!startDate)
    throw new BadRequestError("missing required field 'startDate'");

  const exp = await updateExperienceById(id, {
    company,
    title,
    startDate,
    userId,
    id,
    endDate,
    location,
    bullets,
    sortOrder,
  } satisfies NewExperience);

  if (!exp) {
    throw new BadRequestError(`unable to update experience with id: ${id}`);
  }

  respondWithJSON(res, 200, {
    id: exp.id,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt,
    userId: exp.userId,
    title: exp.title,
    company: exp.company,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    bullets: exp.bullets,
    sortOrder: exp.sortOrder,
  } satisfies Experience);
}

export async function handlerDeleteAllExperiences(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const deleted = await deleteExperiencesByUser(userId);
  if (!deleted) {
    throw new BadRequestError(
      `unable to delete experiences for userId ${userId}`
    );
  }

  res.status(204).send();
}

export async function handlerDeleteExperienceById(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("invalid experience id");
  }

  const deleted = await deleteExperienceById(id);
  if (!deleted) {
    throw new BadRequestError(`unable to delete experience with id: ${id}`);
  }

  respondWithJSON(res, 200, {
    message: "Experience deleted successfully",
    experience: deleted,
  });
}
