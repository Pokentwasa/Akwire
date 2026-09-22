import { describe, expect, it } from "vitest";
import { assertValidTransition, InvalidLeadTransitionError } from "@/domain/leads/pipeline";

describe("assertValidTransition", () => {
  it("allows the documented happy path", () => {
    expect(() => assertValidTransition("new", "qualified")).not.toThrow();
    expect(() => assertValidTransition("qualified", "pitch_ready")).not.toThrow();
    expect(() => assertValidTransition("pitch_ready", "pitch_sent")).not.toThrow();
    expect(() => assertValidTransition("pitch_sent", "meeting")).not.toThrow();
    expect(() => assertValidTransition("meeting", "proposal")).not.toThrow();
    expect(() => assertValidTransition("proposal", "won")).not.toThrow();
  });

  it("rejects skipping straight to won from new", () => {
    expect(() => assertValidTransition("new", "won")).toThrow(InvalidLeadTransitionError);
  });

  it("rejects any transition out of a terminal state", () => {
    expect(() => assertValidTransition("won", "lost")).toThrow(InvalidLeadTransitionError);
    expect(() => assertValidTransition("lost", "new")).toThrow(InvalidLeadTransitionError);
    expect(() => assertValidTransition("declined", "qualified")).toThrow(InvalidLeadTransitionError);
  });

  it("allows staying in the same state (no-op)", () => {
    expect(() => assertValidTransition("meeting", "meeting")).not.toThrow();
  });

  it("rejects moving backwards from proposal to pitch_ready", () => {
    expect(() => assertValidTransition("proposal", "pitch_ready")).toThrow(
      InvalidLeadTransitionError,
    );
  });
});
