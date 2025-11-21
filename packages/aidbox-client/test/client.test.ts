import { describe, it, expect,  vi } from "vitest";
import { makeClient } from "src/client.js";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { AidboxResponse, User } from "src/types.js";

describe("AidboxClient", () => {
  describe("GET request", () => {
    it("should successfully fetch a resource", async () => {
      const mockResponse: Bundle = {
        resourceType: "Bundle",
        id: "foo",
        type: "searchset",
        total: 2,
        entry: [
          {
            resource: {
              resourceType: "Resource",
              id: "patient-1"
            },
          },
          {
            resource: {
              resourceType: "Resource",
              id: "patient-2",
            },
          },
        ],
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

      const client = makeClient<Bundle, OperationOutcome, User>({
        baseurl: "http://localhost:8080",
      });

      const result: AidboxResponse<Bundle | OperationOutcome> = await client.request<Bundle>({
        method: "GET",
        url: "/Bundle/foo",
      });

      expect(result.response.status).toBe(200);
      expect(result.responseBody).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/Bundle/foo",
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
