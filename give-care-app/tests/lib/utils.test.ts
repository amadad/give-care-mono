/**
 * Tests for Crisis Detection and Profile Extraction
 * Covers false positives, PII handling, and edge cases
 */

import { describe, it, expect } from "vitest";
import {
  detectCrisis,
  extractProfileData,
  getCrisisResponse,
} from "../../convex/lib/utils";

describe("Crisis Detection", () => {
  describe("True Positives", () => {
    it("should detect high severity crisis keywords", () => {
      const cases = [
        "I want to kill myself",
        "thinking about suicide",
        "I want to end my life",
        "I can't go on anymore",
        "I'm going to overdose",
        "I want to end it all",
        "I can't take it anymore",
        "I'm thinking of hurting myself",
      ];

      cases.forEach((text) => {
        const result = detectCrisis(text);
        expect(result.isCrisis).toBe(true);
        expect(result.severity).toBe("high");
        expect(result.isFalsePositive).toBe(false);
      });
    });

    it("should detect medium severity crisis keywords", () => {
      const cases = [
        "I want to hurt myself",
        "I'm self-harming",
        "I feel hopeless",
        "I'm done with life",
        "there is no point in continuing",
        "I want to give up",
        "I can't do this anymore",
      ];

      cases.forEach((text) => {
        const result = detectCrisis(text);
        expect(result.isCrisis).toBe(true);
        expect(result.severity).toBe("medium");
        expect(result.isFalsePositive).toBe(false);
      });
    });

    it("should detect DV/abuse hints", () => {
      const cases = [
        "he'll kill me if I leave",
        "she'll hurt me",
        "they'll abuse me again",
      ];

      cases.forEach((text) => {
        const result = detectCrisis(text);
        expect(result.isDVHint).toBe(true);
      });
    });
  });

  describe("False Positives - Subscription Language", () => {
    it("should NOT detect crisis in subscription cancellation requests", () => {
      const cases = [
        "I want to end my subscription",
        "please cancel my account",
        "I'd like to unsubscribe",
        "can you stop my subscription?",
        "how do I cancel?",
      ];

      cases.forEach((text) => {
        const result = detectCrisis(text);
        expect(result.isCrisis).toBe(false);
        expect(result.isFalsePositive).toBe(true);
      });
    });

    it("should NOT detect crisis in mixed context with subscription intent", () => {
      const text = "I can't afford this, please end my subscription";
      const result = detectCrisis(text);
      expect(result.isCrisis).toBe(false);
      expect(result.isFalsePositive).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = detectCrisis("");
      expect(result.isCrisis).toBe(false);
      expect(result.isFalsePositive).toBe(false);
    });

    it("should handle very long messages", () => {
      const longText = "I'm feeling stressed. ".repeat(100) + "I want to kill myself";
      const result = detectCrisis(longText);
      expect(result.isCrisis).toBe(true);
    });

    it("should be case insensitive", () => {
      const cases = ["SUICIDE", "SuIcIdE", "suicide"];
      cases.forEach((text) => {
        const result = detectCrisis(text);
        expect(result.isCrisis).toBe(true);
      });
    });
  });

  describe("Crisis Response Templates", () => {
    it("should return base response under 160 chars", () => {
      const response = getCrisisResponse(false);
      expect(response.length).toBeLessThanOrEqual(160);
      expect(response).toContain("988");
      expect(response).toContain("741741");
      expect(response).toContain("911");
    });

    it("should return DV response under 160 chars", () => {
      const response = getCrisisResponse(true);
      expect(response.length).toBeLessThanOrEqual(160);
      expect(response).toContain("988");
      expect(response).toContain("741741");
      expect(response).toContain("911");
    });
  });
});

describe("Profile Data Extraction", () => {
  describe("ZIP Code Extraction", () => {
    it("should extract standalone ZIP codes", () => {
      const cases = [
        { input: "I live in 90210", expected: "90210" },
        { input: "My ZIP is 10001", expected: "10001" },
        { input: "zipcode 12345", expected: "12345" },
        { input: "need help in 94102", expected: "94102" },
      ];

      cases.forEach(({ input, expected }) => {
        const result = extractProfileData(input);
        expect(result.zipCode).toBe(expected);
      });
    });

    it("should extract ZIP from ZIP+4 format", () => {
      const result = extractProfileData("I'm at 90210-1234");
      expect(result.zipCode).toBe("90210");
    });

    it("should NOT extract invalid ZIP patterns", () => {
      const cases = ["12", "1234", "123456", "abcde"];
      cases.forEach((input) => {
        const result = extractProfileData(input);
        expect(result.zipCode).toBeUndefined();
      });
    });
  });

  describe("First Name Extraction", () => {
    it("should extract first names from self-introductions", () => {
      const cases = [
        { input: "I'm Sarah", expected: "Sarah" },
        { input: "My name is John", expected: "John" },
        { input: "call me Mike", expected: "Mike" },
        { input: "this is Jennifer", expected: "Jennifer" },
        { input: "Sarah here", expected: "Sarah" },
      ];

      cases.forEach(({ input, expected }) => {
        const result = extractProfileData(input);
        expect(result.firstName).toBe(expected);
      });
    });

    it("should NOT extract common false positive words as names", () => {
      const cases = [
        "I'm help",
        "I'm caring for my mom",
        "I'm looking for resources",
        "I'm need assistance",
      ];

      cases.forEach((input) => {
        const result = extractProfileData(input);
        expect(result.firstName).toBeUndefined();
      });
    });

    it("should NOT extract lowercase words as names", () => {
      const result = extractProfileData("i'm sarah");
      // Capitalization matters for name extraction
      expect(result.firstName).toBeUndefined();
    });
  });

  describe("Care Recipient Extraction", () => {
    it("should extract family role from caregiving context", () => {
      const cases = [
        { input: "caring for my mom", expected: "mom" },
        { input: "taking care of dad", expected: "dad" },
        { input: "help my grandmother", expected: "grandmother" },
        { input: "looking after my husband", expected: "husband" },
      ];

      cases.forEach(({ input, expected }) => {
        const result = extractProfileData(input);
        expect(result.careRecipientName).toBe(expected);
      });
    });

    it("should NOT extract non-family-role words", () => {
      const cases = [
        "caring for my health",
        "taking care of business",
        "help my friend",
      ];

      cases.forEach((input) => {
        const result = extractProfileData(input);
        expect(result.careRecipientName).toBeUndefined();
      });
    });
  });

  describe("PII Safety", () => {
    it("should NOT extract phone numbers", () => {
      const result = extractProfileData("Call me at 555-1234 or 555-123-4567");
      expect(result).not.toHaveProperty("phone");
      expect(result).not.toHaveProperty("phoneNumber");
    });

    it("should NOT extract email addresses", () => {
      const result = extractProfileData("Email me at test@example.com");
      expect(result).not.toHaveProperty("email");
    });

    it("should NOT extract full addresses", () => {
      const result = extractProfileData("I live at 123 Main St, Apt 4B");
      // Should only extract ZIP if present, not full address
      expect(result).not.toHaveProperty("address");
      expect(result).not.toHaveProperty("street");
    });

    it("should NOT over-capture from complex messages", () => {
      const message = "Hi, I'm Sarah. I live at 123 Main St in 90210. Call me at 555-1234.";
      const result = extractProfileData(message);

      // Should only extract firstName and zipCode
      expect(Object.keys(result).sort()).toEqual(["firstName", "zipCode"].sort());
      expect(result.firstName).toBe("Sarah");
      expect(result.zipCode).toBe("90210");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = extractProfileData("");
      expect(result).toEqual({});
    });

    it("should handle messages with no extractable data", () => {
      const result = extractProfileData("Hello, how are you?");
      expect(result).toEqual({});
    });

    it("should handle multiple ZIP codes (use first match)", () => {
      const result = extractProfileData("Moving from 10001 to 90210");
      expect(result.zipCode).toBe("10001");
    });
  });
});
