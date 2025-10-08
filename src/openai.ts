import OpenAI from "openai";
import { cfg } from "./config.js";

const OPENAI_KEY = cfg.ai.key;

export const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});
