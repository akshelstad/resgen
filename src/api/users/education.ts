import { Request, Response } from "express";

import { respondWithJSON } from "../../lib/json/response.js";
import {
  saveEducation,
  saveEducations,
  upsertEducation,
  getEducationsByUser,
  getEducationById,
  replaceAllEducations,
  updateEducationById,
  deleteEducationsByUser,
  deleteEducationById,
} from "../../db/queries/users/info/educations.js";

import { NewEducation, Education } from "../../db/schema.js";
import { BadRequestError, UnauthorizedError } from "../../lib/errors/http.js";

type EducationPayload = {
  school: string;
  credential: string;
  year?: number;
};

export async function handlerUpsertEducations(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const eduArray = Array.isArray(req.body) ? req.body : [req.body];

  const rows: NewEducation[] = eduArray.map(
    (edu) =>
      ({
        id: edu.id,
        userId,
        school: edu.school,
        credential: edu.credential,
        year: edu.year,
      } satisfies NewEducation)
  );

  const results = await upsertEducation(rows);
  if (!results) {
    throw new BadRequestError("unable to upsert education");
  }

  respondWithJSON(res, 201, results);
}

export async function handlerGetAllEducations(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const educations = await getEducationsByUser(userId);
  if (!educations) {
    throw new BadRequestError(
      `unable to retrieve experiences for userId ${userId}`
    );
  }

  respondWithJSON(res, 200, educations);
}

export async function handlerUpdateEducationById(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("missing 'id' param");
  }

  const dbEdu = await getEducationById(id);
  if (!dbEdu) {
    throw new BadRequestError("invalid education id");
  }

  const { school, credential, year } = req.body as EducationPayload;
  if (!school) throw new BadRequestError("missing required field 'school'");
  if (!credential)
    throw new BadRequestError("missing required field 'credential'");

  const edu = await updateEducationById(id, {
    userId,
    school,
    credential,
    id,
    year,
  } satisfies NewEducation);

  if (!edu) {
    throw new BadRequestError(`unable to update education with id: ${id}`);
  }

  respondWithJSON(res, 200, {
    id: edu.id,
    createdAt: edu.createdAt,
    updatedAt: edu.updatedAt,
    userId: edu.userId,
    school: edu.school,
    credential: edu.credential,
    year: edu.year,
  } satisfies Education);
}

export async function handlerDeleteAllEducations(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const deleted = await deleteEducationsByUser(userId);
  if (!deleted) {
    throw new BadRequestError(
      `unable to delete educations for userId ${userId}`
    );
  }

  res.status(204).send();
}

export async function handlerDeleteEducationById(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("invalid education id");
  }

  const deleted = await deleteEducationById(id);
  if (!deleted) {
    throw new BadRequestError(`unable to delete education with id: ${id}`);
  }

  respondWithJSON(res, 200, {
    message: "Education deleted successfully",
    education: deleted,
  });
}
