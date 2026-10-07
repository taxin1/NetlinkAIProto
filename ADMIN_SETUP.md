# Admin Dashboard Setup

To enable the Admin Dashboard features (Analytics and User List), you need to run a database migration script.

## Instructions

1.  **Open Supabase Dashboard**: Go to your project dashboard at [supabase.com](https://supabase.com/dashboard).
2.  **SQL Editor**: Navigate to the SQL Editor section.
3.  **New Query**: Create a new query.
4.  **Copy Script**: Open the file `scripts/019_add_admin_funcs.sql` in your local project, copy its entire content.
5.  **Run Script**: Paste the content into the Supabase SQL Editor and click **Run**.

## Accessing the Dashboard

Once the migration is applied:
1. Ensure your server environment (e.g. `.env.local` or hosting provider) has:
   ```env
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_admin_password
   ADMIN_SECRET=your_secure_admin_secret
   ```
2. Navigate to `/admin` (e.g., `http://localhost:3000/admin`).
3. **Login**: Enter the username and password configured in your environment variables.

## Troubleshooting

*   **"Error loading dashboard data"**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured and database migrations are applied.
*   **"Unauthorized"**: Verify your `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`. Ensure you restart the development server after modifying environment variables.
