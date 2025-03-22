# Admin Initialization Scripts

This directory contains scripts for initializing and managing admin accounts in the database.

## init-admin.ts

This script initializes the master admin account in the database using the credentials defined in the `.env` file.

### Environment Variables

The script requires the following environment variables to be set:

- `MASTER_ADMIN_USERNAME`: The username for the master admin
- `MASTER_ADMIN_EMAIL`: The email address for the master admin
- `MASTER_ADMIN_PASSWORD`: The password for the master admin

### Usage

To run this script locally:

```bash
npm run init-admin
```

### Vercel Deployment

During Vercel deployment, this script is automatically run as part of the build process via the `vercel-build` script in `package.json`. This ensures that the master admin account is always available in the database.

### What it does

1. Checks if a user with the specified email already exists
2. If the user exists:
   - Updates the user's role to MASTER_ADMIN
   - Updates the password to match the one in the .env file
   - Creates MasterAdmin and TournamentAdmin records if they don't exist
3. If the user doesn't exist:
   - Creates a new user with the MASTER_ADMIN role
   - Creates associated MasterAdmin and TournamentAdmin records

### Security Notes

- Only users defined in the .env file can become admins
- The registration API prevents users from registering with admin roles
- The password is securely hashed before storage in the database 