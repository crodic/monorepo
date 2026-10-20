import { describe, expect, it } from "vitest";
import {
  defineQueryContract,
  isAllowedFilter,
  isAllowedSort,
  type ResourceQueryContract,
} from "./contracts";

interface TestUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  createdAt: string;
}

describe("Query Contracts", () => {
  const userContract: ResourceQueryContract<TestUser> = defineQueryContract({
    allowedSorts: ["name", "email", "createdAt"],
    allowedFilters: ["name", "email", { name: "roleId", operator: "eq" }],
    defaultSort: "-createdAt",
  });

  it("should validate allowed sorts correctly", () => {
    expect(isAllowedSort(userContract, "name")).toBe(true);
    expect(isAllowedSort(userContract, "-createdAt")).toBe(true);
    expect(isAllowedSort(userContract, "+email")).toBe(true);
    expect(isAllowedSort(userContract, "createdAt:DESC")).toBe(true);
    expect(isAllowedSort(userContract, "email:ASC")).toBe(true);
    expect(isAllowedSort(userContract, "password")).toBe(false);
  });

  it("should validate allowed filters correctly", () => {
    expect(isAllowedFilter(userContract, "name")).toBe(true);
    expect(isAllowedFilter(userContract, "roleId")).toBe(true);
    expect(isAllowedFilter(userContract, "secret")).toBe(false);
  });

  it("should freeze the contract", () => {
    expect(Object.isFrozen(userContract)).toBe(true);
  });
});
