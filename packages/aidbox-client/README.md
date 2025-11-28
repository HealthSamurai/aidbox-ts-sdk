# Typescript Aidbox client

### decisions

- API method per each FHIR interaction https://build.fhir.org/codesystem-restful-interaction.html
- Object argument (typed) for fixed set of params
  - `ReadOptions`
  - `SearchOptions`...
- Search sring (searchParam) builder (typed or just string)
  ``` typescript
  ifMatch: buildSearch().Patient.identifier('1234567890'),
  ```
- `Result` type pattern for returned data:
  ```typescript
  type Ok<T>  = { ok: true;  value: T; /* ... */ };
  type Err<E> = { ok: false; error: E; /* ... */ };

  type Result<T, E> = Ok<T> | Err<E>;
  ```

## Options
- [ ] Instance Level Interaction
  - [X] `read` - Read the current state of the resource
  - [X] `vread` - Read the state of a specific version of the resource
  - [X] `update` - Update an existing resource by its id (or create it if it is new)
  - [ ] `conditionalUpdate` - Update an existing resource based on some identification criteria (or create it if it is new)
  - [X] `patch` - Update an existing resource by posting a set of changes to it
  - [ ] `caonditionalPatch` - Update an existing resource, based on some identification criteria, by posting a set of changes to it
  - [X] `delete` - Delete a resource
  - [ ] `deleteHistory` - Delete all historical versions of a resource
  - [ ] `deleteHistoryVersion` - Delete a specific version of a resource
  - [X] `history` - Retrieve the change history for a particular resource
- [ ] Type Level Interaction
  - [ ] `create` - Create a new resource with a server assigned id
  - [ ] `conditionalCreate` - Create a new resource with a server assigned id if an equivalent resource does not already exist
  - [ ] `search` - Search the resource type based on some filter criteria
  - [ ] `conditionalDeleteSingle` - Conditional delete a single resource based on some identification criteria
  - [ ] `conditionalDeleteMultiple` - Conditional delete one or more resources based on some identification criteria
  - [ ] `history` - Retrieve the change history for a particular resource type
- [ ] Whole System Interaction
  - [ ] `capabilities` - Get a capability statement for the system
  - [ ] `transaction` - Perform multiple interactions (e.g., create, read, update, delete, patch, and/or [extended operations]) in a single interaction
  - [ ] `delete` - Conditional Delete across all resource types based on some filter criteria
  - [ ] `history` - Retrieve the change history for all resources
  - [ ] `search` - Search across all resource types based on some filter criteria
- [ ] Compartment Interaction
  - [ ] `search` - Search resources associated with a specific compartment instance (see [Search Contexts](https://build.fhir.org/search.html#searchcontexts) and [Compartments](https://build.fhir.org/compartmentdefinition.html))

TODO: Operations
https://build.fhir.org/operations.html

VERB [base]/[type]/[id] {?_format=[mime-type]}
VERB corresponds to the HTTP verb used for the interaction
Content surrounded by [] is mandatory, and will be replaced by the string literal identified. Possible insertion values:

- `base` The Service Base URL
- `mime-type` The Mime Type
- `type` The name of a resource type (e.g., "Patient")
- `id` The Logical Id of a resource
- `vid` The Version Id of a resource
- `compartment` The name of a compartment
- `parameters` URL parameters as defined for the particular interaction

Content surrounded by {} is optional

## Examples

``` typescript
const patient = await client.read<Patient>({type: 'Patient', id: 'patient-id'});
const encounter = await client.read<Encounter>({type: 'Encounter', id: 'encounter-id'});

const result = await client.update<Patient>({
    type: 'Patient',
    id: 'patient-id',
    ifMatch: buildSearch().Patient.identifier('1234567890'),
    resource: {
        name: 'John Doe',
    },
})
```

### Discussed Alternatives

- Generated methods for all types

``` typescript
const patient = await client.Patient.read('my-patient-id');
```

- FHIR like

``` typescript
const patient = await client.read<Patient>('Patient/my-patient-id');
```

- Sugar functions

``` typescript
const patient = await client.read<Patient>('Patient', 'my-patient-id');
```

- Method chaining

``` typescript
const patient: Patient  = await client
  .read()
  .type('Patient')
  .id('my-patient-id')
```

## Return data format

Client returns a `Result<T, E>` object, with methods to check if the request was successful:

```typescript
const result = await client.read<Patient>({type: 'Patient', id: 'patient-id'});
if (result.isErr())
    throw new Error("error reading Patient", { cause: result.error })

const { resource: patient } = result.value;

// work with patient.
```

Unwrapping is not required to modify the data in the result:

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

### Discussed alternatives

- Union type of <Patient> and <OperationOutcome>

``` typescript
const patient: Patient | OperationOutcome = await client.read({
    type: 'Patient',
    id: 'my-patient-id'
})

const bundle: Bundle | OperationOutcome = await client.search({
    type: 'Patient',
    search: client.searchBuilder('Patient').identifier('1234567890')
})
```

- Tagged {data, outcome, error}

``` typescript
const { result: Patient, outcome: OperationOutcome} = await client.read({type: 'Patient', id: 'my-patient-id'})

const { result, outcome } = await client.Patient.read({id: 'my-patient-id'})

const {result: Bundle, error: OperationOutcome} = await client.Search({type: 'Patient', id: 'my-patient-id'})
```

### Functions as FHIR operations

#### Required params

#### Search modification params (_count, _page)

#### Resource type SearchParams

``` typescript
// Supabse like client
//  https://supabase.com/docs/reference/javascript/v1/introduction

import { createClient } from '@health-samurai/aidbox-client'
  // Create a single supabase client for interacting with your database
const client = new createClient('https://your-aidbox-instance.com');

const { patient: <Patient>, error: <OperationOutcome> } = await client
  .read('Patient')
  .id('my-patient-id');

const { patient: <Patient>, error: <OperationOutcome> } = await client
  .vread('Patient')
  .id('my-patient-id')
  .vid('my-patient-id-2020');

const { result: <Bundle>, error: <OperationOutcome> } = await client
  .search({type: 'Patient'})

      .sp_family('John Doe')
      .sp_address-city_exact('Belgrade')
      .sp_address-city_contains('Nove Sad')
      .sp_birthdate('gt:2020')

  ._count(10)
  ._page(3);

//-----------

const patient = await box.read<Patient>('Patient', 'my-patient-id'});

const patient = await box.read<Patient>('Patient', 'my-patient-id');
const patient = await box.delete<Patient>('Patient', 'my-patient-id');
const patient = await box.vread<Patient>('Patient', 'my-patient-id', 'my-patient-vid');
const patient = await box.update<Patient>('Patient', 'my-patient-id', {
    name: 'John Doe',
});
const patient = await box.conditionalUpdate<Patient>( 'Patient', 'name=John%20Doe&gender=male', {
    name: 'John Doe',
});

const patient = await box.patch<Patient>( 'Patient', 'my-patient-id',
'application/json-patch+json',  // or 'application/xml-patch+xml'
{
    name: 'John Doe',
});

const patient = await box.request.Instance.Read<Patient>('Patient', 'my-patient-id');

const patient = await box.Instance.Read<Patient>('Patient', 'my-patient-id');
const patient = await box.Instance.VRead<Patient>('Patient', 'my-patient-id', 'my-patient-vid');

const patient = await box.Instance.History<Patient>('Patient', 'my-patient-id');
const patient = await box.Type.History<Patient>('Patient', 'name=foo');
const patient = await box.System.History<Patient>('name=foo');

const patient = await box.Instance.Delete<Patient>('Patient', 'my-patient-id');
const patient = await box.Instance.Delete<Patient>('Patient', 'my-patient-id', 'my-patient-vid');
const patient = await box.FHIR.Type.Delete<Patient>('Patient', 'name=foo');

const patient = await box.Logout<Patient>('Patient', 'name=foo');
const patient = await box.Validate<Patient>('Patient', 'name=foo');

const patient = await box.Operation<Patient>('Patient', 'name=foo');
```

| Interaction                 | Content-Type | Body                   | Location | Versioning             | Status Codes                                |
|-----------------------------|--------------|------------------------|----------|------------------------|---------------------------------------------|
| read                        | R            | R: Resource            | N/A      | O: ETag, Last-Modified | 200, 202, 404, 410‡                         |
| vread                       | R            | R: Resource            | N/A      | O: ETag, Last-Modified | 200, 202, 404, 410‡                         |
| update                      | R if body    | O: Resource (Prefer)   | N/A      | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| update-conditional          | R if body    | O: Resource (Prefer)   | N/A      | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| patch                       | R if body    | O: Resource (Prefer)   | N/A      | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| patch-conditional           | R if body    | O: Resource (Prefer)   | N/A      | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| delete                      | R if body    | O: OperationOutcome    | N/A      | N/A                    | 200, 202, 204, 404, 405, 409, 412           |
| delete-conditional-single   | R if body    | O: OperationOutcome    | N/A      | N/A                    | 200, 202, 204, 404, 405, 409, 412           |
| delete-conditional-multiple | R if body    | O: OperationOutcome    | N/A      | N/A                    | 200, 202, 204, 404, 405, 409, 412           |
| delete-history              | R if body    | O: OperationOutcome    | N/A      | N/A                    | 200, 202, 204, 404, 405, 409, 412           |
| delete-history-version      | R if body    | O: OperationOutcome    | N/A      | N/A                    | 200, 202, 204, 404, 405, 409, 412           |
| create                      | R if body    | O : Resource (Prefer)  | R        | O: ETag, Last-Modified | 201, 202, 400, 404, 405, 422                |
| create-conditional          | R if body    | O : Resource (Prefer)  | R        | O: ETag, Last-Modified | 201, 202, 400, 404, 405, 422                |
| search-type                 | R            | R: Bundle              | N/A      | N/A                    | 200, 202, 401, 404, 405                     |
| search-system               | R            | R: Bundle              | N/A      | N/A                    | 200, 202, 401, 404, 405                     |
| search-compartment          | R            | R: Bundle              | N/A      | N/A                    | 200, 202, 401, 404, 405                     |
| capabilities                | R            | R: CapabilityStatement | N/A      | N/A                    | 200, 202, 404                               |
| transaction                 | R            | R: Bundle              | N/A      | N/A                    | 200, 202, 400, 404, 405, 409, 412, 422      |
| batch                       | R            | R: Bundle              | N/A      | N/A                    | 200, 202, 400, 404, 405, 409, 412, 422      |
| history-instance            | R            | R: Bundle              | N/A      | N/A                    | 200, 202                                    |
| history-type                | R            | R: Bundle              | N/A      | N/A                    | 200, 202                                    |
| history-all                 | R            | R: Bundle              | N/A      | N/A                    | 200, 202                                    |
| (operation)                 | R            | R: Parameters/Resource | N/A      | N/A                    | 200, 202 + varies by operation type         |
