import { Request, Response } from "express";

import { responseFormat, systemPrompt } from "../../lib/ai/promptConfig.js";
import { GenerateResumeRequest, Resume } from "../../lib/types/resume.js";
import { openai } from "../../openai.js";
import {
  BadGatewayError,
  BadRequestError,
  UnauthorizedError,
} from "../../lib/errors/http.js";
import { respondWithJSON } from "src/lib/json/response.js";
import { toGenerateResumeRequest } from "#db/queries/users/users.js";
import { renderResumePdf } from "./pdfRenderer.js";

export async function handlerGenerateResume(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const resume = await generateResumeDraft(userId);
  respondWithJSON(res, 200, resume);
}

export async function handlerGenerateResumePdf(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("invalid token");
  }

  const resume = await generateResumeDraft(userId);
  const pdfBuffer = await renderResumePdf(resume);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'inline; filename="resume.pdf"'
  );
  res.setHeader("Content-Length", String(pdfBuffer.length));
  res.status(200).send(pdfBuffer);
}

async function generateResumeDraft(userId: string): Promise<Resume> {
  const resumeRequest = await toGenerateResumeRequest(userId);
  if (!resumeRequest) {
    throw new BadRequestError(
      `unable to generate resume request for userId: ${userId}`
    );
  }

  const body = resumeRequest as GenerateResumeRequest;
  return await requestResumeFromModel(body);
}

async function requestResumeFromModel(
  body: GenerateResumeRequest
): Promise<Resume> {
  try {
    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Write a resume draft for the following candidate. Return ONLY the JSON fields defined by the schema.\n\nInput:\n" +
            JSON.stringify(body, null, 2),
        },
      ],
      text: { format: responseFormat },
    });

    const jsonText = resp.output_text;
    if (!jsonText) {
      throw new BadGatewayError(
        `No output_text from model:\n${JSON.stringify(resp)}`
      );
    }

    return JSON.parse(jsonText) as Resume;
  } catch (err) {
    if (err instanceof BadGatewayError) throw err;
    throw new BadGatewayError(`Error from model: ${(err as Error).message}`);
  }
}
