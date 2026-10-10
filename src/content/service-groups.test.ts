import { describe, expect, it } from "vitest";
import { services } from "./services";
import { serviceGroups } from "./service-groups";

describe("professional service taxonomy", () => {
  it("places every approved service in exactly one customer-goal group", () => {
    const grouped = serviceGroups.flatMap((group) => group.services.map((service) => service.path));
    expect(grouped).toHaveLength(services.length);
    expect(new Set(grouped).size).toBe(services.length);
    expect(new Set(grouped)).toEqual(new Set(services.map((service) => service.path)));
  });
});
