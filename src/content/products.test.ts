import { describe, expect, it } from "vitest";
import { productCategories, products, searchProducts } from "./products";

describe("shop catalogue", () => {
  it("keeps product slugs unique and sample data explicit", () => {
    expect(new Set(products.map(({ slug }) => slug)).size).toBe(products.length);
    expect(products.every(({ placeholder }) => placeholder)).toBe(true);
  });

  it("searches names, descriptions, keywords, features and specifications", () => {
    expect(searchProducts("laptop").length).toBeGreaterThanOrEqual(2);
    expect(searchProducts("VLAN").map(({ slug }) => slug)).toContain("managed-gigabit-switch");
    expect(searchProducts("automatic document feeder").map(({ slug }) => slug)).toContain("document-scanner");
  });

  it("filters by category and returns an empty result safely", () => {
    const network = searchProducts("", "networking-wifi");
    expect(network).toHaveLength(2);
    expect(network.every(({ category }) => category === "networking-wifi")).toBe(true);
    expect(searchProducts("definitely-not-a-product")).toEqual([]);
    expect(productCategories).toHaveLength(6);
  });
});
