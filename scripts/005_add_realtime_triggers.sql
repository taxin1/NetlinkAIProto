-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for contacts table
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON public.contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for emails table (if needed)
-- Note: emails table doesn't have updated_at column, but we can add it if needed
-- ALTER TABLE public.emails ADD COLUMN updated_at timestamp with time zone default now();
-- CREATE TRIGGER update_emails_updated_at 
--     BEFORE UPDATE ON public.emails 
--     FOR EACH ROW 
--     EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Create indexes for better real-time performance
CREATE INDEX IF NOT EXISTS contacts_realtime_idx ON public.contacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_realtime_idx ON public.emails(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_realtime_idx ON public.events(user_id, created_at DESC);

-- Create a function to automatically create events when emails are sent
CREATE OR REPLACE FUNCTION create_email_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create event when email status changes to 'sent'
    IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
        INSERT INTO public.events (user_id, contact_id, event_type, description)
        VALUES (NEW.user_id, NEW.contact_id, 'email_sent', 'Email sent: ' || NEW.subject);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic email events
CREATE TRIGGER create_email_event_trigger
    AFTER UPDATE ON public.emails
    FOR EACH ROW
    EXECUTE FUNCTION create_email_event();

-- Create a function to automatically create events when contacts are added
CREATE OR REPLACE FUNCTION create_contact_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.events (user_id, contact_id, event_type, description)
    VALUES (NEW.user_id, NEW.id, 'connection', 'New contact added: ' || NEW.name);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic contact events
CREATE TRIGGER create_contact_event_trigger
    AFTER INSERT ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION create_contact_event();
