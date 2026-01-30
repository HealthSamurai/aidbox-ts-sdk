# Typescript FHIR client

A TypeScript client for interacting with a FHIR server.

## Usage

The client is created with the `makeClient` function:

```typescript
const baseUrl = "https://fhir-server.address";
const client = new AidboxClient(
  baseUrl,
  new BrowserAuthProvider(baseUrl),
);
```

## Documentation

Documentation is generated automatically, and can be found [here](https://healthsamurai.github.io/aidbox-ts-sdk/aidbox-client/).

## Type Generator

This project is designed around the type generator that provides FHIR types based on the specified package.
However, not all types are provided in the client itself, only the necessary ones, like `Bundle`, and `OperationOutcome`.
If your application requires more types, use [atomic-ehr/codegen](https://github.com/atomic-ehr/codegen) to generate more types.

For example, using `atomic-ehr/codegen`, we can generate and import an `Observation` type, and ensure that all fields are provided when creating a resource:

```typescript
import type { Observation } from "hl7-fhir-r4-core";

client.create<Observation>({
  resourceType: "Observation",
  status: "final",
  code: {
    coding: [{
      system: "http://loinc.org",
      code: "59408-5",
      display: "Blood pressure systolic & diastolic"
    }],
    text: "Blood pressure"
  },
  subject: {
    reference: "Patient/pt-1"
  },
  effectiveDateTime: "2025-12-05T00:00:00Z",
  valueString: "minimal"
})
```

The default set of types in the client is based on FHIR R4 Core.
If your application requires a different set of types, it is possible to override that through type parameters when creating a client:

```typescript
import type * as R5 from "hl7-fhir-r5-core";
import type { User } from "@health-samurai/aidbox-client";

const baseUrl = "https://fhir-server.address";

const client = new AidboxClient<R5.Bundle, R5.OperationOutcome, User> (
  baseUrl,
  new BrowserAuthProvider(baseUrl),
);
```

## [FHIR Interactions](https://hl7.org/fhir/http.html)

This client provides a set of methods to work with a FHIR server in a more convenient way:

- Instance Level Interaction
  - `read` - Read the current state of the resource
  - `vread` - Read the state of a specific version of the resource
  - `update` - Update an existing resource by its id (or create it if it is new)
  - `conditionalUpdate` - Update an existing resource based on some identification criteria (or create it if it is new).
  - `patch` - Update an existing resource by posting a set of changes to it.
  - `conditionalPatch` - Update an existing resource, based on some identification criteria, by posting a set of changes to it.
  - `delete` - Delete a resource.
  - `deleteHistory` - Delete all historical versions of a resource.
  - `deleteHistoryVersion` - Delete a specific version of a resource.
  - `history` - Retrieve the change history for a particular resource.
- Type Level Interaction
  - `create` - Create a new resource with a server assigned id
  - `conditionalCreate` - Create a new resource with a server assigned id if an equivalent resource does not already exist.
  - `search` - Search the resource type based on some filter criteria.
  - `conditionalDelete` - Conditional delete a single or multiple resources based on some identification criteria.
  - `history` - Retrieve the change history for a particular resource type.
- Whole System Interaction
  - `capabilities` - Get a capability statement for the system.
  - `batch`/`transaction` - Perform multiple interactions (e.g., create, read, update, delete, patch, and/or [extended operations]) in a single interaction.
  - `delete` - Conditional Delete across all resource types based on some filter criteria.
  - `history` - Retrieve the change history for all resources.
  - `search` - Search across all resource types based on some filter criteria.
- Compartment Interaction
  - `search` - Search resources associated with a specific compartment instance (see [Search Contexts](https://build.fhir.org/search.html#searchcontexts) and [Compartments](https://build.fhir.org/compartmentdefinition.html))
- Operations Framework
  - `operation` - Perform an operation as defined by an `OperationDefinition`.
  - `validate` - Perform the Validate Operation.

### Patient CRUD Example

Here's an example of

```typescript
import { AidboxClient, BrowserAuthProvider } from "@health-samurai/aidbox-client";
import type { Patient } from "hl7-fhir-r4-core";
import { formatOperationOutcome } from "utils";

const client = new AidboxClient(
  "http://localhost:8080",
  new BrowserAuthProvider("http://localhost:8080"),
);

// Create a new Patient resource
const result = await client.create<Patient>({
  type: "Patient",
  resource: {
    gender: "female",
    resourceType: "Patient",
  },
});

// Check if interaction was successful
if (result.isErr())
  throw Error(formatOperationOutcome(result.value.resource), {
    cause: result.value.resource,
  });

const patient = result.value.resource;

if (!patient.id)
  throw Error(
    "id is optional in FHIR, so we check it to satisfy the type checker",
  );

// Updating the patient

patient.name = [
  {
    given: ["Jane"],
    family: "Doe",
  },
];

const updateResult = await client.update<Patient>({
  id: patient.id,
  type: "Patient",
  resource: patient,
});

if (updateResult.isErr())
  throw Error(formatOperationOutcome(updateResult.value.resource), {
    cause: updateResult.value.resource,
  });

// Deleting the patient

const deleteResult = await client.delete<Patient>({
  id: patient.id,
  type: "Patient",
});

if (deleteResult.isErr())
  throw Error(formatOperationOutcome(deleteResult.value.resource), {
    cause: deleteResult.value.resource,
  });
```

### Return data format

As seen in the example above, most methods return a `Result<T, E>` object.
This object represents a successful or erroneous state of the response.

A general usage pattern is as follows:

```typescript
const result = await client.read<Patient>({ type: 'Patient', id: 'patient-id' });

if (result.isErr())
  throw new Error("error reading Patient", { cause: result.value.resource })

const patient = result.value.resource;

// work with patient.
```

It is also possible to work with resources without unwrapping the `Result` object:

```typescript
const result = await client.read<Patient>({ type: 'Patient', id: 'patient-id' });

return result
  .map(({resource}: {resource: Patient}): Patient => {
  /* work with Patient resource */
  })
  .mapErr(({resource}: {resource: OperationOutcome}): OperationOutcome => {
  /* work with OperationOutcome resource */
  });
  // result is still Result<Patient, OperationOutcome>
```

See the [documentation](https://healthsamurai.github.io/aidbox-ts-sdk/aidbox-client/) for more info.

## Low-level methods

The client provides two basic methods for writing custom interactions:

- `rawRequest` - send request to the FHIR server and receive response in a raw format
- `request<T>` - send request to the FHIR server and receive response with its body parsed to the specified type `T`

In a successful case, the `rawRequest` returns an object with JavaScript Response and additional meta information.
When the server responds with an error code, this function throws an error:

```typescript
const result = await client.rawRequest({
  method: "GET",
  url: "/fhir/Patient/patient-id",
  headers: {Accept: "application/json"},
  params: [["some" "parameters"], ["if", "needed"]],
}).then((result) => {
  const patient: Patient = await result.response.json();
  // ...
}).catch((error) => {
  if (error instanceof ErrorResponse) {
    const outcome = await error.responseWithMeta.response.json
    // ...
  }
});
```

Alternatively, the `request` method can be used.
It returns a `Result<T, OperationOutcome>`, which contains an already parsed result, coerced to the specified type `T`.

```typescript
const result: Result<Patient, OperationOutcome> = client.request<Patient>({
  method: "GET",
  url: "/fhir/Patient/patient-id",
  headers: {Accept: "application/json"},
  params: [["some" "parameters"], ["if", "needed"]],
});

if (result.isOk()) {
  const patient: Patient = result.value.resource;
  // work with patient
}

if (result.isErr()) {
  const outcome: OperationOutcome = result.value.resource;
  // process OperationOutcome
}
```

Both methods can throw the `RequestError` class if the error happened before the request was actually made.

## Authentication Providers

Authentication is managed via the `AuthProvider` interface. The client ships with three built-in providers:

| Provider | Environment | Auth Method |
|----------|-------------|-------------|
| `BrowserAuthProvider` | Browser | Cookie-based sessions |
| `BasicAuthProvider` | Any | HTTP Basic Auth |
| `SmartBackendServicesAuthProvider` | Server-side | OAuth 2.0 client_credentials with JWT bearer |

### BrowserAuthProvider

For browser applications. Uses cookie-based sessions and redirects to the login page on 401.

```typescript
import { AidboxClient, BrowserAuthProvider } from "@health-samurai/aidbox-client";

const baseUrl = "https://fhir-server.address";
const client = new AidboxClient(baseUrl, new BrowserAuthProvider(baseUrl));
```

### BasicAuthProvider

For server-side applications using HTTP Basic Auth.

```typescript
import { AidboxClient, BasicAuthProvider } from "@health-samurai/aidbox-client";

const baseUrl = "https://fhir-server.address";
const client = new AidboxClient(
  baseUrl,
  new BasicAuthProvider(baseUrl, "username", "password"),
);
```

### SmartBackendServicesAuthProvider

For server-to-server authentication using [SMART Backend Services](https://www.hl7.org/fhir/smart-app-launch/backend-services.html) (OAuth 2.0 client_credentials grant with JWT bearer assertion).

Features:
- Token caching with proactive refresh before expiry
- Thundering herd prevention — concurrent requests share a single token fetch
- Automatic retry on 401 with fresh token
- OAuth2 discovery from `.well-known/smart-configuration`

```typescript
import { AidboxClient, SmartBackendServicesAuthProvider } from "@health-samurai/aidbox-client";

// Generate or import your private key using Web Crypto API
const privateKey = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-384" },
  true,
  ["sign", "verify"]
).then(kp => kp.privateKey);

const auth = new SmartBackendServicesAuthProvider({
  baseUrl: "https://fhir-server.address",
  clientId: "my-service",
  privateKey: privateKey,                     // CryptoKey from Web Crypto API
  keyId: "key-001",                           // Must match kid in JWKS
  scope: "system/*.read",
  // tokenExpirationBuffer: 30,              // Optional: seconds before expiry to refresh (default: 30)
});

const client = new AidboxClient("https://fhir-server.address", auth);
```

### Custom Auth Provider

For other authentication methods, implement the `AuthProvider` interface:

```typescript
import type { AuthProvider } from "@health-samurai/aidbox-client";

export class CustomAuthProvider implements AuthProvider {
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async establishSession() {
    /* code to establish a session */
  }

  public async revokeSession() {
    /* code to revoke the session */
  }

  /**
   * A wrapper around the `fetch` function, that does all the
   * necessary preparations and argument patching required for the
   * request to go through.
   *
   * Optionally, security checks can be implemented, like verifying
   * that the request indeed goes to the `baseUrl`, and not
   * somewhere else.
   */
  public async fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    /* ... */
  }
}
```
