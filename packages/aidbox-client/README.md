# Typescript FHIR client

A typescript client for interacting with a FHIR server.

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

This project is designed around the type generator [atomic-ehr/codegen](https://github.com/atomic-ehr/codegen) that provides FHIR types based on the specified package.
The default set of types is based on FHIR R4 Core, but it is possible to override that through type parameters when creating a client:

```typescript
import type { Bundle, OperationOutcome } from "hl7-fhir-r5-core";
import type { User } from "@health-samurai/aidbox-client";

const baseUrl = "https://fhir-server.address";
const client = new AidboxClient<
  // now using FHIR R5 Core types
  Bundle,
  OperationOutcome,
  User
> (
  baseUrl,
  new BrowserAuthProvider(baseUrl),
);
```

## [FHIR Interactions](https://hl7.org/fhir/http.html)

This client provides a set of methods to work with a FHIR server in a more convinient way:

- Instance Level Interaction
  - `read` - Read the current state of the resource
  - `vread` - Read the state of a specific version of the resource
  - `update` - Update an existing resource by its id (or create it if it is new)
  - `conditionalUpdate` - Update an existing resource based on some identification criteria (or create it if it is new)
  - `patch` - Update an existing resource by posting a set of changes to it
  - `conditionalPatch` - Update an existing resource, based on some identification criteria, by posting a set of changes to it
  - `delete` - Delete a resource
  - `deleteHistory` - Delete all historical versions of a resource
  - `deleteHistoryVersion` - Delete a specific version of a resource
  - `history` - Retrieve the change history for a particular resource
- Type Level Interaction
  - `create` - Create a new resource with a server assigned id
  - `conditionalCreate` - Create a new resource with a server assigned id if an equivalent resource does not already exist
  - `search` - Search the resource type based on some filter criteria
  - `conditionalDelete` - Conditional delete a single or multiple resources based on some identification criteria
  - `history` - Retrieve the change history for a particular resource type
- Whole System Interaction
  - `capabilities` - Get a capability statement for the system
  - `batch`/`transaction` - Perform multiple interactions (e.g., create, read, update, delete, patch, and/or [extended operations]) in a single interaction
  - `delete` - Conditional Delete across all resource types based on some filter criteria
  - `history` - Retrieve the change history for all resources
  - `search` - Search across all resource types based on some filter criteria
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

## Methods

The client provides two basic methods of interaction:

- `rawRequest` - send request to the FHIR server and recieve response in a raw format
- `request<T>` - send request to the FHIR server and recieve response with its body parsed to the specified type `T`

In successful case, the `rawRequest` returns an object with JavaScript Repsonse, and additional meta information.
When server responds with an error code, this function throws an error:

```typescript
const result = await client.rawRequest({
  method: "GET",
  url: "/fhir/Patient/patient-id",
  headers: {Accept: "application/json"},
  params: [["some" "parameters"], ["if", "needed"]],
}).then((result) => {
  const patient: Patient = await result.response.json();
  // ...
}).catch ((error) => {
  if (error instanceof ErrorResponse) {
    const outcome = await error.responseWithMeta.response.json
    // ...
  }
});
```

Alternatively, a `request` method can be used.
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

Both methods can throw `RequestError` class, if the error happened before the request was actually made.

## Return data format

Most client methods return a `Result<T, E>` object, with methods to check if the request was successful:

```typescript
const result = await client.read<Patient>({type: 'Patient', id: 'patient-id'});
if (result.isErr())
    throw new Error("error reading Patient", { cause: result.value })

const { resource: patient } = result.value;

// work with patient.
```

Unwrapping is not required to modify the data in the `Result`:

```typescript
const result = await client.read<Patient>({type: 'Patient', id: 'patient-id'});

return result
  .map(({resource}: {resource: Patient}): Patient => {
    /* work with Patient resource */
  })
  .mapErr(({resource}: {resource: OperationOutcome}): OperationOutcome => {
    /* work with OperationOutcome resource */
  });
  // result is still Result<Patient, OperationOutcome>
```
