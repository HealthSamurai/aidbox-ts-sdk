# Typescript FHIR client

A typescript client for interacting with a FHIR server.

## Usage

The client is created with the `makeClient` function:

```typescript
const baseUrl = "https://fhir-server.address";
const client = makeClient({
  baseUrl,
  authProvider: new BrowserAuthProvider(baseUrl);
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

### [FHIR HTTP](https://hl7.org/fhir/http.html) methods:

Additional set of methods is provided to work with FHIR server in a more convinient way:

- [x] Instance Level Interaction
  - [x] `read` - Read the current state of the resource
  - [x] `vread` - Read the state of a specific version of the resource
  - [x] `update` - Update an existing resource by its id (or create it if it is new)
  - [x] `conditionalUpdate` - Update an existing resource based on some identification criteria (or create it if it is new)
  - [x] `patch` - Update an existing resource by posting a set of changes to it
  - [x] `conditionalPatch` - Update an existing resource, based on some identification criteria, by posting a set of changes to it
  - [x] `delete` - Delete a resource
  - [x] `deleteHistory` - Delete all historical versions of a resource
  - [x] `deleteHistoryVersion` - Delete a specific version of a resource
  - [x] `history` - Retrieve the change history for a particular resource
- [x] Type Level Interaction
  - [x] `create` - Create a new resource with a server assigned id
  - [x] `conditionalCreate` - Create a new resource with a server assigned id if an equivalent resource does not already exist
  - [x] `search` - Search the resource type based on some filter criteria
  - [x] `conditionalDelete` - Conditional delete a single or multiple resources based on some identification criteria
  - [x] `history` - Retrieve the change history for a particular resource type
- [x] Whole System Interaction
  - [x] `capabilities` - Get a capability statement for the system
  - [x] `batch`/`transaction` - Perform multiple interactions (e.g., create, read, update, delete, patch, and/or [extended operations]) in a single interaction
  - [x] `delete` - Conditional Delete across all resource types based on some filter criteria
  - [x] `history` - Retrieve the change history for all resources
  - [x] `search` - Search across all resource types based on some filter criteria
- [x] Compartment Interaction
  - [x] `search` - Search resources associated with a specific compartment instance (see [Search Contexts](https://build.fhir.org/search.html#searchcontexts) and [Compartments](https://build.fhir.org/compartmentdefinition.html))

<!--
TODO: Operations
https://build.fhir.org/operations.html
-->

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
