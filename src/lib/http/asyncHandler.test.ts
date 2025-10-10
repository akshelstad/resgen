import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

import { asyncHandler } from "./asyncHandler.js";

describe("asyncHandler", () => {
  it("invokes wrapped handler and skips next on success", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();
    const wrappedFn = vi.fn(async () => {});

    const handler = asyncHandler(wrappedFn as unknown as any);

    await handler(req, res, next);

    expect(wrappedFn).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards errors to next", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();
    const error = new Error("boom");

    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });
});
