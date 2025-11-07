# Orgbac

<AIDBOX_BASE_URL>/Organization/<org-id>/fhir

``` typescript
	const read = async <T>(
		opts: ReadOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "GET",
		});
	};
```


# Auth

## Browser

- cookie

## Server

- client credentials (client id and secret) (recommended)
- basic auth (aidbox app)
- external auth (token introspector, oidc)
- authorization code (for CLI) where exists Resource Owner

## Auth design

- Split client and auth providers
- Client communicates with auth provider only for authentication


``` typescript

const baseUrl = "https://fhir-server.address";
const auth_provider = Auth.Browser({ baseUrl }); 
const client = makeClient({ baseUrl, auth_provider });

const orgId = 'asdf-1212-asdfasfdasdf-12312';

URL: https://smartbox.aidbox.io/tenant/<org-id>

// TODO: tenant fn namign
const client = client.tenant('asdf-1212-asdfasfdasdf-12312');

const resp = await orgClient.read({type: 'Patient', id: 'PatientId'});




async function read(opts: ReadOptions) {
  const req = fetch(`${baseUrl}/${opts.type}/${opts.id}`) 
  const req = auth_provider.authenticate(req)
  return await req
}
```

``` typescript
import {Auth, makeClient} from "@health-samurai/aidbox-client";


const auth = Auth.ClientCredentials({
  client_id: "client_id",
  client_secret: "client_secret",
});


// by default just inject to query HTTP only cookies
// TODO: think about namings

const baseUrl = "https://fhir-server.address";
const auth_provider = Auth.Browser({ baseUrl }); 
const client = makeClient({ baseUrl, auth_provider });
```

## Refresh

 - It depends ...

# Decisions

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

## Discussed Request APIs

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

## Discussed Response APIs

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
