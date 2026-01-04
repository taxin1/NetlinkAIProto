# Admin Dashboard Setup

To enable the Admin Dashboard features (Analytics and User List), you need to run a database migration script.

## Instructions

1.  **Open Supabase Dashboard**: Go to your project dashboard at [supabase.com](https://supabase.com/dashboard).
2.  **SQL Editor**: Navigate to the SQL Editor section.
3.  **New Query**: Create a new query.
4.  **Copy Script**: Open the file `scripts/019_add_admin_funcs.sql` in your local project, copy its entire content.
5.  **Run Script**: Paste the content into the Supabase SQL Editor and click **Run**.

## Accessing the Dashboard

Once the script is run:
1.  Navigate to `/admin` (e.g., `http://localhost:3000/admin`).
2.  **Login**:
    *   **Username**: `Admin`
    *   **Password**: `Cognisor@2025`

## Troubleshooting

*   **"Error loading dashboard data"**: This means the SQL functions haven't been created or the secret key doesn't match. Ensure you ran the script successfully.
*   **"Unauthorized"**: The hardcoded password in the code must match the one in the SQL function.
