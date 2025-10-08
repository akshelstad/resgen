export const responseFormat = {
  type: "json_schema",
  name: "ResumeSchema",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline", "summary", "sections"],
    properties: {
      headline: { type: "string", description: "Name + target title line" },
      summary: { type: "string", description: "3–5 sentence summary" },
      sections: {
        type: "object",
        additionalProperties: false,
        required: ["experience", "skills", "education"], // ← include every key in properties
        properties: {
          experience: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["company", "title", "location", "dates", "bullets"], // ← added 'location'
              properties: {
                company: { type: "string" },
                title: { type: "string" },
                location: { type: "string" },
                dates: { type: "string" },
                bullets: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 7,
                },
              },
            },
          },
          skills: {
            type: "array",
            items: { type: "string" },
            minItems: 8,
            maxItems: 20,
          },
          education: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["school", "credential", "year"], // ← include every key in properties
              properties: {
                school: { type: "string" },
                credential: { type: "string" },
                year: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const systemPrompt =
  "You are a professional resume writer. Use action verbs, measurable outcomes, and stay factual. " +
  "Tailor to the target role. Do NOT invent details not provided. Output only valid JSON per schema.";
