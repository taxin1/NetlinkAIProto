import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Contact_Key {
  id: UUIDString;
  __typename?: 'Contact_Key';
}

export interface CreateContactData {
  contact_insert: Contact_Key;
}

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

export interface DeleteContactData {
  contact_delete?: Contact_Key | null;
}

export interface DeleteContactVariables {
  id: UUIDString;
}

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

export interface GetContactVariables {
  id: UUIDString;
}

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

export interface ListMyContactsVariables {
  limit?: number | null;
}

export interface NetworkProfile_Key {
  userId: string;
  __typename?: 'NetworkProfile_Key';
}

export interface UpdateContactData {
  contact_update?: Contact_Key | null;
}

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

export interface UpsertNetworkProfileData {
  networkProfile_upsert: NetworkProfile_Key;
}

export interface UpsertNetworkProfileVariables {
  headline?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
}

export interface UpsertUserData {
  user_upsert: User_Key;
}

export interface UpsertUserVariables {
  email: string;
  displayName?: string | null;
  supabaseUserId?: string | null;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface UpsertUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  operationName: string;
}
export const upsertUserRef: UpsertUserRef;

export function upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertNetworkProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpsertNetworkProfileVariables): MutationRef<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpsertNetworkProfileVariables): MutationRef<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
  operationName: string;
}
export const upsertNetworkProfileRef: UpsertNetworkProfileRef;

export function upsertNetworkProfile(vars?: UpsertNetworkProfileVariables): MutationPromise<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;
export function upsertNetworkProfile(dc: DataConnect, vars?: UpsertNetworkProfileVariables): MutationPromise<UpsertNetworkProfileData, UpsertNetworkProfileVariables>;

interface CreateContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
  operationName: string;
}
export const createContactRef: CreateContactRef;

export function createContact(vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;
export function createContact(dc: DataConnect, vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface UpdateContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateContactVariables): MutationRef<UpdateContactData, UpdateContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateContactVariables): MutationRef<UpdateContactData, UpdateContactVariables>;
  operationName: string;
}
export const updateContactRef: UpdateContactRef;

export function updateContact(vars: UpdateContactVariables): MutationPromise<UpdateContactData, UpdateContactVariables>;
export function updateContact(dc: DataConnect, vars: UpdateContactVariables): MutationPromise<UpdateContactData, UpdateContactVariables>;

interface DeleteContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteContactVariables): MutationRef<DeleteContactData, DeleteContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteContactVariables): MutationRef<DeleteContactData, DeleteContactVariables>;
  operationName: string;
}
export const deleteContactRef: DeleteContactRef;

export function deleteContact(vars: DeleteContactVariables): MutationPromise<DeleteContactData, DeleteContactVariables>;
export function deleteContact(dc: DataConnect, vars: DeleteContactVariables): MutationPromise<DeleteContactData, DeleteContactVariables>;

interface GetCurrentUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
  operationName: string;
}
export const getCurrentUserRef: GetCurrentUserRef;

export function getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;
export function getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface ListMyContactsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMyContactsVariables): QueryRef<ListMyContactsData, ListMyContactsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListMyContactsVariables): QueryRef<ListMyContactsData, ListMyContactsVariables>;
  operationName: string;
}
export const listMyContactsRef: ListMyContactsRef;

export function listMyContacts(vars?: ListMyContactsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyContactsData, ListMyContactsVariables>;
export function listMyContacts(dc: DataConnect, vars?: ListMyContactsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyContactsData, ListMyContactsVariables>;

interface GetContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetContactVariables): QueryRef<GetContactData, GetContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetContactVariables): QueryRef<GetContactData, GetContactVariables>;
  operationName: string;
}
export const getContactRef: GetContactRef;

export function getContact(vars: GetContactVariables, options?: ExecuteQueryOptions): QueryPromise<GetContactData, GetContactVariables>;
export function getContact(dc: DataConnect, vars: GetContactVariables, options?: ExecuteQueryOptions): QueryPromise<GetContactData, GetContactVariables>;

