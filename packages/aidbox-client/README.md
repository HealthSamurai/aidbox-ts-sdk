# Typescript Aidbox client

### decisions

- api method per each FHIR interaction https://build.fhir.org/codesystem-restful-interaction.html
- tcar object argument (typed) for fixed set of params
  - readOptions
  - searchOptions...
- searchSring (searchParam) builder (typed or just string) 
  ``` typescript
  ifMatch: client.Patient.buildSearch().identifier('1234567890'),
  ```
- result type pattern for returned data
  ```typescript
type Ok<T>  = { ok: true;  value: T; meta: ResponseMeta };
type Err<E> = { ok: false; error: E; meta?: ResponseMeta };

type Result<T, E> = Ok<T> | Err<E>;
  ```

## Options
TODO!!! Operations
https://build.fhir.org/operations.html

| Instance  | Type | System |
|-----------|------|------|
| `read` |  | |
| `vread` |  | |
| `update` |  | |
| `conditional update` |  | |
| `patch` |  | |
| `conditional patch` |  | |
| `delete` |  | `delete` |
| `delete-history` |  | |
| `delete-history-version` |  | |
|  | `search` | `search` |
|  | `create` | |
|  | `conditional create` | |
|  | `conditional delete single` | |
|  | `conditional delete multiple` | |
|  | | `capabilities` |
|  | | `transaction` |
| `history` | `history` | `history` |

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


## Instance Level Interactions

- `read` Read the current state of the resource
- `vread` Read the state of a specific version of the resource
- `update` Update an existing resource by its id (or create it if it is new)
- `conditional update` Update an existing resource based on some identification criteria (or create it if it is new)
- `patch` Update an existing resource by posting a set of changes to it
- `conditional patch` Update an existing resource, based on some identification criteria, by posting a set of changes to it
- `delete` Delete a resource
- `delete-history` Delete all historical versions of a resource
- `delete-history-version` Delete a specific version of a resource
- `history` Retrieve the change history for a particular resource

## Type Level Interactions

- `create` Create a new resource with a server assigned id
- `conditional create` Create a new resource with a server assigned id if an equivalent resource does not already exist
- `search` Search the resource type based on some filter criteria
- `conditional delete single` Conditional delete a single resource based on some identification criteria
- `conditional delete multiple` Conditional delete one or more resources based on some identification criteria
- `history` Retrieve the change history for a particular resource type

## Whole System Interactions

- `capabilities` Get a capability statement for the system
- `batch/transaction`	Perform multiple interactions (e.g., create, read, update, delete, patch, and/or [extended operations]) in a single interaction
- `delete` Conditional Delete across all resource types based on some filter criteria
- `history` Retrieve the change history for all resources
- `search` Search across all resource types based on some filter criteria

## Examples

### General pattern

``` typescript
const patient   = await client.Patient.read('my-patient-id');
const encounter = await client.Encounter.read('my-patient-id');

const patient   = await client.Patient.update('my-patient-id');

const result = await client.update({
    type: 'Patient',
    id: 'my-patient-id',
    ifMatch: client.Patient.buildSearch().identifier('1234567890'),
    resource: {
        name: 'John Doe',
    },
})

const result = await client.Patient.update({
    id: 'my-patient-id',
    ifMatch: client.Patient.buildSearch().identifier('1234567890'),
    resource: {
        name: 'John Doe',
    },
})

```

- FHIR like

``` typescript
const patient = await client.read<Patient>('Patient/my-patient-id');
```


- Tcar argument object  

``` typescript
const patient = await client.read<Patient>({type: 'Patient', id: 'my-patient-id'} : readQuery);
```

- Sugar functions

``` typescript
const patient = await client.read<Patient>('Patient', 'my-patient-id');
```

- `Chain` like pattern

``` typescript
const patient: Patient  = await client 
  .read()
  .type('Patient')
  .id('my-patient-id')
```


### Return data

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

```


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




| Interaction | Response | Content-Type | Body | Location | Versioning | Status Codes |
|-------------|----------|--------------|------|----------|------------|--------------|
| read | R | R: Resource | N/A | O: ETag, Last-Modified | 200, 202, 404, 410‡ |
| vread | R | R: Resource | N/A | O: ETag, Last-Modified | 200, 202, 404, 410‡ |
| update | R if body | O: Resource (Prefer) | N/A | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| update-conditional | R if body | O: Resource (Prefer) | N/A | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| patch | R if body | O: Resource (Prefer) | N/A | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| patch-conditional | R if body | O: Resource (Prefer) | N/A | O: ETag, Last-Modified | 200, 201, 202, 400, 404, 405, 409, 412, 422 |
| delete | R if body | O: OperationOutcome | N/A | N/A | 200, 202, 204, 404, 405, 409, 412 |
| delete-conditional-single | R if body | O: OperationOutcome | N/A | N/A | 200, 202, 204, 404, 405, 409, 412 |
| delete-conditional-multiple | R if body | O: OperationOutcome | N/A | N/A | 200, 202, 204, 404, 405, 409, 412 |
| delete-history | R if body | O: OperationOutcome | N/A | N/A | 200, 202, 204, 404, 405, 409, 412 |
| delete-history-version | R if body | O: OperationOutcome | N/A | N/A | 200, 202, 204, 404, 405, 409, 412 |
| create | R if body | O : Resource (Prefer) | R | O: ETag, Last-Modified | 201, 202, 400, 404, 405, 422 |
| create-conditional | R if body | O : Resource (Prefer) | R | O: ETag, Last-Modified | 201, 202, 400, 404, 405, 422 |
| search-type | R | R: Bundle | N/A | N/A | 200, 202, 401, 404, 405 |
| search-system | R | R: Bundle | N/A | N/A | 200, 202, 401, 404, 405 |
| search-compartment | R | R: Bundle | N/A | N/A | 200, 202, 401, 404, 405 |
| capabilities | R | R: CapabilityStatement | N/A | N/A | 200, 202, 404 |
| transaction | R | R: Bundle | N/A | N/A | 200, 202, 400, 404, 405, 409, 412, 422 |
| batch | R | R: Bundle | N/A | N/A | 200, 202, 400, 404, 405, 409, 412, 422 |
| history-instance | R | R: Bundle | N/A | N/A | 200, 202 |
| history-type | R | R: Bundle | N/A | N/A | 200, 202 |
| history-all | R | R: Bundle | N/A | N/A | 200, 202 |
| (operation) | R | R: Parameters/Resource | N/A | N/A | 200, 202 + varies by operation type |