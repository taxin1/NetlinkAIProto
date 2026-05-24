# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `netlink`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCurrentUser*](#getcurrentuser)
  - [*ListMyContacts*](#listmycontacts)
  - [*GetContact*](#getcontact)
- [**Mutations**](#mutations)
  - [*UpsertUser*](#upsertuser)
  - [*UpsertNetworkProfile*](#upsertnetworkprofile)
  - [*CreateContact*](#createcontact)
  - [*UpdateContact*](#updatecontact)
  - [*DeleteContact*](#deletecontact)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `netlink`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@netlink/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@netlink/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@netlink/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `netlink` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCurrentUser
You can execute the `GetCurrentUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface GetCurrentUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
}
export const getCurrentUserRef: GetCurrentUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface GetCurrentUserRef {
  ...
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
}
export const getCurrentUserRef: GetCurrentUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCurrentUserRef:
```typescript
const name = getCurrentUserRef.operationName;
console.log(name);
```

### Variables
The `GetCurrentUser` query has no variables.
### Return Type
Recall that executing the `GetCurrentUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCurrentUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetCurrentUserData {
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    supabaseUserId?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    profile?: {
      headline?: string | null;
      bio?: string | null;
      company?: string | null;
      location?: string | null;
      websiteUrl?: string | null;
      linkedinUrl?: string | null;
    };
  } & User_Key;
}
```
### Using `GetCurrentUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCurrentUser } from '@netlink/dataconnect';


// Call the `getCurrentUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCurrentUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCurrentUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getCurrentUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetCurrentUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCurrentUserRef } from '@netlink/dataconnect';


// Call the `getCurrentUserRef()` function to get a reference to the query.
const ref = getCurrentUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCurrentUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListMyContacts
You can execute the `ListMyContacts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyContacts(vars?: ListMyContactsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyContactsData, ListMyContactsVariables>;

interface ListMyContactsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMyContactsVariables): QueryRef<ListMyContactsData, ListMyContactsVariables>;
}
export const listMyContactsRef: ListMyContactsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyContacts(dc: DataConnect, vars?: ListMyContactsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyContactsData, ListMyContactsVariables>;

interface ListMyContactsRef {
  ...
  (dc: DataConnect, vars?: ListMyContactsVariables): QueryRef<ListMyContactsData, ListMyContactsVariables>;
}
export const listMyContactsRef: ListMyContactsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyContactsRef:
```typescript
const name = listMyContactsRef.operationName;
console.log(name);
```

### Variables
The `ListMyContacts` query has an optional argument of type `ListMyContactsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyContactsVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListMyContacts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyContactsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyContactsData {
  contacts: ({
    id: UUIDString;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    position?: string | null;
    notes?: string | null;
    linkedinUrl?: string | null;
    avatarUrl?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Contact_Key)[];
}
```
### Using `ListMyContacts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyContacts, ListMyContactsVariables } from '@netlink/dataconnect';

// The `ListMyContacts` query has an optional argument of type `ListMyContactsVariables`:
const listMyContactsVars: ListMyContactsVariables = {
  limit: ..., // optional
};

// Call the `listMyContacts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyContacts(listMyContactsVars);
// Variables can be defined inline as well.
const { data } = await listMyContacts({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListMyContactsVariables` argument.
const { data } = await listMyContacts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyContacts(dataConnect, listMyContactsVars);

console.log(data.contacts);

// Or, you can use the `Promise` API.
listMyContacts(listMyContactsVars).then((response) => {
  const data = response.data;
  console.log(data.contacts);
});
```

### Using `ListMyContacts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyContactsRef, ListMyContactsVariables } from '@netlink/dataconnect';

// The `ListMyContacts` query has an optional argument of type `ListMyContactsVariables`:
const listMyContactsVars: ListMyContactsVariables = {
  limit: ..., // optional
};

// Call the `listMyContactsRef()` function to get a reference to the query.
const ref = listMyContactsRef(listMyContactsVars);
// Variables can be defined inline as well.
const ref = listMyContactsRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListMyContactsVariables` argument.
const ref = listMyContactsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyContactsRef(dataConnect, listMyContactsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.contacts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.contacts);
});
```

## GetContact
You can execute the `GetContact` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getContact(vars: GetContactVariables, options?: ExecuteQueryOptions): QueryPromise<GetContactData, GetContactVariables>;

interface GetContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetContactVariables): QueryRef<GetContactData, GetContactVariables>;
}
export const getContactRef: GetContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getContact(dc: DataConnect, vars: GetContactVariables, options?: ExecuteQueryOptions): QueryPromise<GetContactData, GetContactVariables>;

interface GetContactRef {
  ...
  (dc: DataConnect, vars: GetContactVariables): QueryRef<GetContactData, GetContactVariables>;
}
export const getContactRef: GetContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getContactRef:
```typescript
const name = getContactRef.operationName;
console.log(name);
```

### Variables
The `GetContact` query requires an argument of type `GetContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetContactVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetContact` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetContactData {
  contact?: {
    id: UUIDString;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    position?: string | null;
    notes?: string | null;
    linkedinUrl?: string | null;
    avatarUrl?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Contact_Key;
}
```
### Using `GetContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getContact, GetContactVariables } from '@netlink/dataconnect';

// The `GetContact` query requires an argument of type `GetContactVariables`:
const getContactVars: GetContactVariables = {
  id: ..., 
};

// Call the `getContact()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getContact(getContactVars);
// Variables can be defined inline as well.
const { data } = await getContact({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getContact(dataConnect, getContactVars);

console.log(data.contact);

// Or, you can use the `Promise` API.
getContact(getContactVars).then((response) => {
  const data = response.data;
  console.log(data.contact);
});
```

### Using `GetContact`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getContactRef, GetContactVariables } from '@netlink/dataconnect';

// The `GetContact` query requires an argument of type `GetContactVariables`:
const getContactVars: GetContactVariables = {
  id: ..., 
};

// Call the `getContactRef()` function to get a reference to the query.
const ref = getContactRef(getContactVars);
// Variables can be defined inline as well.
const ref = getContactRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getContactRef(dataConnect, getContactVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.contact);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.contact);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `netlink` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertUser
You can execute the `UpsertUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertUserRef:
```typescript
const name = upsertUserRef.operationName;
console.log(name);
```

### Variables
The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertUserVariables {
  email: string;
  displayName?: string | null;
  supabaseUserId?: string | null;
}
```
### Return Type
Recall that executing the `UpsertUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertUserData {
  user_upsert: User_Key;
}
```
### Using `UpsertUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertUser, UpsertUserVariables } from '@netlink/dataconnect';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  email: ..., 
  displayName: ..., // optional
  supabaseUserId: ..., // optional
};

// Call the `upsertUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertUser(upsertUserVars);
// Variables can be defined inline as well.
const { data } = await upsertUser({ email: ..., displayName: ..., supabaseUserId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertUser(dataConnect, upsertUserVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
upsertUser(upsertUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `UpsertUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertUserRef, UpsertUserVariables } from '@netlink/dataconnect';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  email: ..., 
  displayName: ..., // optional
  supabaseUserId: ..., // optional
};

// Call the `upsertUserRef()` function to get a reference to the mutation.
const ref = upsertUserRef(upsertUserVars);
// Variables can be defined inline as well.
const ref = upsertUserRef({ email: ..., displayName: ..., supabaseUserId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertUserRef(dataConnect, upsertUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

## UpsertNetworkProfile
You can execute the `UpsertNetworkProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertNetworkProfile(vars?: UpsertNetworkProfileVariables): MutationPromise<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;

interface UpsertNetworkProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpsertNetworkProfileVariables): MutationRef<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
}
export const upsertNetworkProfileRef: UpsertNetworkProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertNetworkProfile(dc: DataConnect, vars?: UpsertNetworkProfileVariables): MutationPromise<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;

interface UpsertNetworkProfileRef {
  ...
  (dc: DataConnect, vars?: UpsertNetworkProfileVariables): MutationRef<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
}
export const upsertNetworkProfileRef: UpsertNetworkProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertNetworkProfileRef:
```typescript
const name = upsertNetworkProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertNetworkProfile` mutation has an optional argument of type `UpsertNetworkProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertNetworkProfileVariables {
  headline?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
}
```
### Return Type
Recall that executing the `UpsertNetworkProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertNetworkProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertNetworkProfileData {
  networkProfile_upsert: NetworkProfile_Key;
}
```
### Using `UpsertNetworkProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertNetworkProfile, UpsertNetworkProfileVariables } from '@netlink/dataconnect';

// The `UpsertNetworkProfile` mutation has an optional argument of type `UpsertNetworkProfileVariables`:
const upsertNetworkProfileVars: UpsertNetworkProfileVariables = {
  headline: ..., // optional
  bio: ..., // optional
  company: ..., // optional
  location: ..., // optional
  websiteUrl: ..., // optional
  linkedinUrl: ..., // optional
};

// Call the `upsertNetworkProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertNetworkProfile(upsertNetworkProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertNetworkProfile({ headline: ..., bio: ..., company: ..., location: ..., websiteUrl: ..., linkedinUrl: ..., });
// Since all variables are optional for this mutation, you can omit the `UpsertNetworkProfileVariables` argument.
const { data } = await upsertNetworkProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertNetworkProfile(dataConnect, upsertNetworkProfileVars);

console.log(data.networkProfile_upsert);

// Or, you can use the `Promise` API.
upsertNetworkProfile(upsertNetworkProfileVars).then((response) => {
  const data = response.data;
  console.log(data.networkProfile_upsert);
});
```

### Using `UpsertNetworkProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertNetworkProfileRef, UpsertNetworkProfileVariables } from '@netlink/dataconnect';

// The `UpsertNetworkProfile` mutation has an optional argument of type `UpsertNetworkProfileVariables`:
const upsertNetworkProfileVars: UpsertNetworkProfileVariables = {
  headline: ..., // optional
  bio: ..., // optional
  company: ..., // optional
  location: ..., // optional
  websiteUrl: ..., // optional
  linkedinUrl: ..., // optional
};

// Call the `upsertNetworkProfileRef()` function to get a reference to the mutation.
const ref = upsertNetworkProfileRef(upsertNetworkProfileVars);
// Variables can be defined inline as well.
const ref = upsertNetworkProfileRef({ headline: ..., bio: ..., company: ..., location: ..., websiteUrl: ..., linkedinUrl: ..., });
// Since all variables are optional for this mutation, you can omit the `UpsertNetworkProfileVariables` argument.
const ref = upsertNetworkProfileRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertNetworkProfileRef(dataConnect, upsertNetworkProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.networkProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.networkProfile_upsert);
});
```

## CreateContact
You can execute the `CreateContact` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createContact(vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface CreateContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
}
export const createContactRef: CreateContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createContact(dc: DataConnect, vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface CreateContactRef {
  ...
  (dc: DataConnect, vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
}
export const createContactRef: CreateContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createContactRef:
```typescript
const name = createContactRef.operationName;
console.log(name);
```

### Variables
The `CreateContact` mutation requires an argument of type `CreateContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateContactVariables {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateContact` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateContactData {
  contact_insert: Contact_Key;
}
```
### Using `CreateContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createContact, CreateContactVariables } from '@netlink/dataconnect';

// The `CreateContact` mutation requires an argument of type `CreateContactVariables`:
const createContactVars: CreateContactVariables = {
  name: ..., 
  email: ..., // optional
  phone: ..., // optional
  company: ..., // optional
  position: ..., // optional
  notes: ..., // optional
  linkedinUrl: ..., // optional
  avatarUrl: ..., // optional
};

// Call the `createContact()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createContact(createContactVars);
// Variables can be defined inline as well.
const { data } = await createContact({ name: ..., email: ..., phone: ..., company: ..., position: ..., notes: ..., linkedinUrl: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createContact(dataConnect, createContactVars);

console.log(data.contact_insert);

// Or, you can use the `Promise` API.
createContact(createContactVars).then((response) => {
  const data = response.data;
  console.log(data.contact_insert);
});
```

### Using `CreateContact`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createContactRef, CreateContactVariables } from '@netlink/dataconnect';

// The `CreateContact` mutation requires an argument of type `CreateContactVariables`:
const createContactVars: CreateContactVariables = {
  name: ..., 
  email: ..., // optional
  phone: ..., // optional
  company: ..., // optional
  position: ..., // optional
  notes: ..., // optional
  linkedinUrl: ..., // optional
  avatarUrl: ..., // optional
};

// Call the `createContactRef()` function to get a reference to the mutation.
const ref = createContactRef(createContactVars);
// Variables can be defined inline as well.
const ref = createContactRef({ name: ..., email: ..., phone: ..., company: ..., position: ..., notes: ..., linkedinUrl: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createContactRef(dataConnect, createContactVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contact_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contact_insert);
});
```

## UpdateContact
You can execute the `UpdateContact` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateContact(vars: UpdateContactVariables): MutationPromise<UpdateContactData, UpdateContactVariables>;

interface UpdateContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateContactVariables): MutationRef<UpdateContactData, UpdateContactVariables>;
}
export const updateContactRef: UpdateContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateContact(dc: DataConnect, vars: UpdateContactVariables): MutationPromise<UpdateContactData, UpdateContactVariables>;

interface UpdateContactRef {
  ...
  (dc: DataConnect, vars: UpdateContactVariables): MutationRef<UpdateContactData, UpdateContactVariables>;
}
export const updateContactRef: UpdateContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateContactRef:
```typescript
const name = updateContactRef.operationName;
console.log(name);
```

### Variables
The `UpdateContact` mutation requires an argument of type `UpdateContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateContactVariables {
  id: UUIDString;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
}
```
### Return Type
Recall that executing the `UpdateContact` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateContactData {
  contact_update?: Contact_Key | null;
}
```
### Using `UpdateContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateContact, UpdateContactVariables } from '@netlink/dataconnect';

// The `UpdateContact` mutation requires an argument of type `UpdateContactVariables`:
const updateContactVars: UpdateContactVariables = {
  id: ..., 
  name: ..., // optional
  email: ..., // optional
  phone: ..., // optional
  company: ..., // optional
  position: ..., // optional
  notes: ..., // optional
  linkedinUrl: ..., // optional
  avatarUrl: ..., // optional
};

// Call the `updateContact()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateContact(updateContactVars);
// Variables can be defined inline as well.
const { data } = await updateContact({ id: ..., name: ..., email: ..., phone: ..., company: ..., position: ..., notes: ..., linkedinUrl: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateContact(dataConnect, updateContactVars);

console.log(data.contact_update);

// Or, you can use the `Promise` API.
updateContact(updateContactVars).then((response) => {
  const data = response.data;
  console.log(data.contact_update);
});
```

### Using `UpdateContact`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateContactRef, UpdateContactVariables } from '@netlink/dataconnect';

// The `UpdateContact` mutation requires an argument of type `UpdateContactVariables`:
const updateContactVars: UpdateContactVariables = {
  id: ..., 
  name: ..., // optional
  email: ..., // optional
  phone: ..., // optional
  company: ..., // optional
  position: ..., // optional
  notes: ..., // optional
  linkedinUrl: ..., // optional
  avatarUrl: ..., // optional
};

// Call the `updateContactRef()` function to get a reference to the mutation.
const ref = updateContactRef(updateContactVars);
// Variables can be defined inline as well.
const ref = updateContactRef({ id: ..., name: ..., email: ..., phone: ..., company: ..., position: ..., notes: ..., linkedinUrl: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateContactRef(dataConnect, updateContactVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contact_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contact_update);
});
```

## DeleteContact
You can execute the `DeleteContact` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteContact(vars: DeleteContactVariables): MutationPromise<DeleteContactData, DeleteContactVariables>;

interface DeleteContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteContactVariables): MutationRef<DeleteContactData, DeleteContactVariables>;
}
export const deleteContactRef: DeleteContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteContact(dc: DataConnect, vars: DeleteContactVariables): MutationPromise<DeleteContactData, DeleteContactVariables>;

interface DeleteContactRef {
  ...
  (dc: DataConnect, vars: DeleteContactVariables): MutationRef<DeleteContactData, DeleteContactVariables>;
}
export const deleteContactRef: DeleteContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteContactRef:
```typescript
const name = deleteContactRef.operationName;
console.log(name);
```

### Variables
The `DeleteContact` mutation requires an argument of type `DeleteContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteContactVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteContact` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteContactData {
  contact_delete?: Contact_Key | null;
}
```
### Using `DeleteContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteContact, DeleteContactVariables } from '@netlink/dataconnect';

// The `DeleteContact` mutation requires an argument of type `DeleteContactVariables`:
const deleteContactVars: DeleteContactVariables = {
  id: ..., 
};

// Call the `deleteContact()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteContact(deleteContactVars);
// Variables can be defined inline as well.
const { data } = await deleteContact({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteContact(dataConnect, deleteContactVars);

console.log(data.contact_delete);

// Or, you can use the `Promise` API.
deleteContact(deleteContactVars).then((response) => {
  const data = response.data;
  console.log(data.contact_delete);
});
```

### Using `DeleteContact`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteContactRef, DeleteContactVariables } from '@netlink/dataconnect';

// The `DeleteContact` mutation requires an argument of type `DeleteContactVariables`:
const deleteContactVars: DeleteContactVariables = {
  id: ..., 
};

// Call the `deleteContactRef()` function to get a reference to the mutation.
const ref = deleteContactRef(deleteContactVars);
// Variables can be defined inline as well.
const ref = deleteContactRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteContactRef(dataConnect, deleteContactVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contact_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contact_delete);
});
```

