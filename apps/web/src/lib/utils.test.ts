import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", false && "c", undefined, "d")).toBe("a b d");
  });

  it("merges conflicting tailwind classes, keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conditional class objects", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});
