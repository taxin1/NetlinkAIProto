-- Add structured meeting context to contacts
alter table contacts
  add column if not exists where_met text,
  add column if not exists met_at date;

comment on column contacts.where_met is 'Where/how the user first met this contact (event, platform, intro)';
comment on column contacts.met_at is 'Date the user first met this contact';
