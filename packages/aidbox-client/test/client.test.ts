import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeClient } from "../src/client.js";
import type { Patient } from "@fhir-types/hl7-fhir-r4-core";

describe("AidboxClient", () => {
  describe("GET request", () => {
    it("should successfully fetch a resource", async () => {
      const mockResponse = {
        resourceType: "Patient",
        id: "example-patient",
        name: [{ given: ["John"], family: "Doe" }],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "application/json",
        }),
        json: async () => mockResponse,
        clone: () => ({
          json: async () => mockResponse,
        }),
      });

      const client = makeClient({
        baseurl: "http://localhost:8080",
      });

      const result = await client.aidboxRequest<Patient>({
        method: "GET",
        url: "/Patient/example-patient",
      });

      expect(result.response.status).toBe(200);
      expect(result.response.body).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/Patient/example-patient",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "content-type": "application/json",
            accept: "application/json",
          }),
          credentials: "include",
        })
      );
    });
  });
});
