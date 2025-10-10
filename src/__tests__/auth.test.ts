import { beforeAll, describe, expect, it } from "vitest";
import type { Request } from "express";

import { BadRequestError, UnauthorizedError } from "../lib/errors/http.js";

let authModule: typeof import("../auth.js");

beforeAll(async () => {
  process.env.PORT = process.env.PORT ?? "3000";
  process.env.PLATFORM = process.env.PLATFORM ?? "test";
  process.env.DB_URL =
    process.env.DB_URL ?? "postgres://user:pass@localhost:5432/test";
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "unit-test-secret";
  process.env.OPENAI_KEY = process.env.OPENAI_KEY ?? "test-openai-key";

  authModule = await import("../auth.js");
});

describe("auth helpers", () => {
  it("hashPassword and checkPasswordHash validate matching passwords", async () => {
    const password = "s3cret-password";
    const hash = await authModule.hashPassword(password);

    expect(hash).toBeTruthy();
    await expect(authModule.checkPasswordHash(password, hash)).resolves.toBe(
      true
    );
    await expect(authModule.checkPasswordHash("wrong", hash)).resolves.toBe(
      false
    );
  });

  it("getBearerToken extracts the bearer token from Authorization header", () => {
    const req = {
      get: (key: string) =>
        key === "Authorization" ? "Bearer token-123" : null,
    } as unknown as Request;

    const token = authModule.getBearerToken(req);
    expect(token).toBe("token-123");
  });

  it("getBearerToken throws when authorization header missing or malformed", () => {
    const missingHeaderReq = {
      get: () => null,
    } as unknown as Request;
    expect(() => authModule.getBearerToken(missingHeaderReq)).toThrow(
      UnauthorizedError
    );

    const malformedHeaderReq = {
      get: () => "Basic abc123",
    } as unknown as Request;
    expect(() => authModule.getBearerToken(malformedHeaderReq)).toThrow(
      BadRequestError
    );
  });

  it("makeJWT and validateJWT round-trip token payloads", async () => {
    const secret = process.env.JWT_SECRET!;
    const token = await authModule.makeJWT("user-123", 60, secret);
    const payload = await authModule.validateJWT(token, secret);

    expect(payload.sub).toBe("user-123");
    expect(payload.iss).toBe("resgen");
  });

  it("validateJWT rejects invalid secrets", async () => {
    const token = await authModule.makeJWT(
      "user-456",
      60,
      process.env.JWT_SECRET!
    );

    await expect(
      authModule.validateJWT(token, "incorrect-secret")
    ).rejects.toThrow(UnauthorizedError);
  });
});
