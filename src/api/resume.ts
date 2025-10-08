import { Request, Response } from "express";
import { responseFormat, systemPrompt } from "../lib/ai/promptConfig.js";
import { GenerateResumeRequest, Resume } from "src/lib/types/resume.js";
import { openai } from "../openai.js";
import {
  BadGatewayError,
  BadRequestError,
  UnauthorizedError,
} from "../lib/utils/errors.js";
import { respondWithJSON } from "src/lib/utils/json.js";
import { getBearerToken, validateJWT } from "src/auth.js";
import { cfg } from "src/config.js";

const SECRET = cfg.jwt.secret;

export async function handlerGenerateResume(req: Request, res: Response) {
  if (!isObject(req.body)) {
    throw new BadRequestError("Body must be a JSON object");
  }

  const token = getBearerToken(req);
  const validJWT = await validateJWT(token, SECRET);
  if (!validJWT?.sub) {
    throw new UnauthorizedError("invalid token");
  }

  const body = req.body as GenerateResumeRequest;

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

    const data = JSON.parse(jsonText) as Resume;
    respondWithJSON(res, 200, data);
  } catch (err: any) {
    throw new BadGatewayError(`Error from model: ${(err as Error).message}`);
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
