# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useUpsertUser, useUpsertNetworkProfile, useCreateContact, useUpdateContact, useDeleteContact, useGetCurrentUser, useListMyContacts, useGetContact } from '@netlink/dataconnect/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useUpsertUser(upsertUserVars);

const { data, isPending, isSuccess, isError, error } = useUpsertNetworkProfile(upsertNetworkProfileVars);

const { data, isPending, isSuccess, isError, error } = useCreateContact(createContactVars);

const { data, isPending, isSuccess, isError, error } = useUpdateContact(updateContactVars);

const { data, isPending, isSuccess, isError, error } = useDeleteContact(deleteContactVars);

const { data, isPending, isSuccess, isError, error } = useGetCurrentUser();

const { data, isPending, isSuccess, isError, error } = useListMyContacts(listMyContactsVars);

const { data, isPending, isSuccess, isError, error } = useGetContact(getContactVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertUser, upsertNetworkProfile, createContact, updateContact, deleteContact, getCurrentUser, listMyContacts, getContact } from '@netlink/dataconnect';


// Operation UpsertUser:  For variables, look at type UpsertUserVars in ../index.d.ts
const { data } = await UpsertUser(dataConnect, upsertUserVars);

// Operation UpsertNetworkProfile:  For variables, look at type UpsertNetworkProfileVars in ../index.d.ts
const { data } = await UpsertNetworkProfile(dataConnect, upsertNetworkProfileVars);

// Operation CreateContact:  For variables, look at type CreateContactVars in ../index.d.ts
const { data } = await CreateContact(dataConnect, createContactVars);

// Operation UpdateContact:  For variables, look at type UpdateContactVars in ../index.d.ts
const { data } = await UpdateContact(dataConnect, updateContactVars);

// Operation DeleteContact:  For variables, look at type DeleteContactVars in ../index.d.ts
const { data } = await DeleteContact(dataConnect, deleteContactVars);

// Operation GetCurrentUser: 
const { data } = await GetCurrentUser(dataConnect);

// Operation ListMyContacts:  For variables, look at type ListMyContactsVars in ../index.d.ts
const { data } = await ListMyContacts(dataConnect, listMyContactsVars);

// Operation GetContact:  For variables, look at type GetContactVars in ../index.d.ts
const { data } = await GetContact(dataConnect, getContactVars);


```