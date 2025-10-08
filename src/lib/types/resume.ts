export interface GenerateResumeRequest {
  name?: string;
  title?: string;
  contact?: Record<string, unknown>;
  experience?: Array<Record<string, unknown>>;
  education?: Array<Record<string, unknown>>;
  targetRole?: string;
  // allow extra fields
  [k: string]: unknown;
}

export interface Resume {
  headline: string;
  summary: string;
  sections: {
    experience: Array<{
      company: string;
      title: string;
      location?: string;
      dates: string;
      bullets: string[];
    }>;
    skills: string[];
    education?: Array<{
      school: string;
      credential: string;
      year?: number;
    }>;
  };
}
