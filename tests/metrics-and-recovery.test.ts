import { describe, expect, it } from "vitest";
import {
  activationMetric,
  repeatUseMetric,
  validatedClosureMetric,
} from "@/lib/domain/metrics";
import { applyImportSnapshot } from "@/lib/domain/import-service";
import {
  syntheticWorkflows,
  workflowList,
} from "@/lib/fixtures/synthetic-data";

describe("metric receipts", () => {
  it("exposes activation numerator and denominator", () => {
    expect(activationMetric(syntheticWorkflows.staleEvidence)).toMatchObject({
      numerator: 8,
      denominator: 12,
      value: 0.6667,
    });
  });

  it("excludes an incomplete observation window", () => {
    const receipt = repeatUseMetric({
      ...syntheticWorkflows.verified,
      observationWindowComplete: false,
    });
    expect(receipt.value).toBeNull();
    expect(receipt.denominator).toBe(0);
    expect(receipt.exclusions).toContain("Incomplete observation window");
  });

  it("separates internally resolved from customer-validated closure", () => {
    expect(validatedClosureMetric(workflowList)).toMatchObject({
      numerator: 1,
      denominator: 2,
      value: 0.5,
    });
  });
});

describe("atomic import recovery", () => {
  const previous = [
    { id: "accepted-1", observedAt: "2026-07-01T00:00:00Z", value: 4 },
  ];

  it("retains the accepted snapshot when a candidate row is invalid", () => {
    const result = applyImportSnapshot(previous, [
      { id: "candidate-1", observedAt: "not-a-date", value: 8 },
    ]);
    expect(result.accepted).toBe(false);
    expect(result.rows).toBe(previous);
  });

  it("rejects duplicate IDs transactionally", () => {
    const result = applyImportSnapshot(previous, [
      { id: "duplicate", observedAt: "2026-08-01T00:00:00Z", value: 1 },
      { id: "duplicate", observedAt: "2026-08-01T00:00:00Z", value: 2 },
    ]);
    expect(result.accepted).toBe(false);
    expect(result.rows).toEqual(previous);
  });

  it("accepts a complete candidate as one snapshot", () => {
    const candidate = [
      { id: "candidate-1", observedAt: "2026-08-01T00:00:00Z", value: 8 },
    ];
    expect(applyImportSnapshot(previous, candidate)).toEqual({
      accepted: true,
      rows: candidate,
      errors: [],
    });
  });
});
