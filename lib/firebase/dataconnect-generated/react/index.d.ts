import { UpsertUserData, UpsertUserVariables, UpsertNetworkProfileData, UpsertNetworkProfileVariables, CreateContactData, CreateContactVariables, UpdateContactData, UpdateContactVariables, DeleteContactData, DeleteContactVariables, GetCurrentUserData, ListMyContactsData, ListMyContactsVariables, GetContactData, GetContactVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useUpsertUser(options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;
export function useUpsertUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;

export function useUpsertNetworkProfile(options?: useDataConnectMutationOptions<UpsertNetworkProfileData, FirebaseError, UpsertNetworkProfileVariables | void>): UseDataConnectMutationResult<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
export function useUpsertNetworkProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertNetworkProfileData, FirebaseError, UpsertNetworkProfileVariables | void>): UseDataConnectMutationResult<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;

export function useCreateContact(options?: useDataConnectMutationOptions<CreateContactData, FirebaseError, CreateContactVariables>): UseDataConnectMutationResult<CreateContactData, CreateContactVariables>;
export function useCreateContact(dc: DataConnect, options?: useDataConnectMutationOptions<CreateContactData, FirebaseError, CreateContactVariables>): UseDataConnectMutationResult<CreateContactData, CreateContactVariables>;

export function useUpdateContact(options?: useDataConnectMutationOptions<UpdateContactData, FirebaseError, UpdateContactVariables>): UseDataConnectMutationResult<UpdateContactData, UpdateContactVariables>;
export function useUpdateContact(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateContactData, FirebaseError, UpdateContactVariables>): UseDataConnectMutationResult<UpdateContactData, UpdateContactVariables>;

export function useDeleteContact(options?: useDataConnectMutationOptions<DeleteContactData, FirebaseError, DeleteContactVariables>): UseDataConnectMutationResult<DeleteContactData, DeleteContactVariables>;
export function useDeleteContact(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteContactData, FirebaseError, DeleteContactVariables>): UseDataConnectMutationResult<DeleteContactData, DeleteContactVariables>;

export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useListMyContacts(vars?: ListMyContactsVariables, options?: useDataConnectQueryOptions<ListMyContactsData>): UseDataConnectQueryResult<ListMyContactsData, ListMyContactsVariables>;
export function useListMyContacts(dc: DataConnect, vars?: ListMyContactsVariables, options?: useDataConnectQueryOptions<ListMyContactsData>): UseDataConnectQueryResult<ListMyContactsData, ListMyContactsVariables>;

export function useGetContact(vars: GetContactVariables, options?: useDataConnectQueryOptions<GetContactData>): UseDataConnectQueryResult<GetContactData, GetContactVariables>;
export function useGetContact(dc: DataConnect, vars: GetContactVariables, options?: useDataConnectQueryOptions<GetContactData>): UseDataConnectQueryResult<GetContactData, GetContactVariables>;
