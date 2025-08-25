# Setup Guide: Super Admin & Login API

This guide explains how to set up a Super Admin user and use the login API.

## Prerequisites

1. Ensure your database is running and configured
2. Run database migrations: `npm run db:migrate`
3. Build the project: `npm run build`

## 1. Create Super Admin User

### Using the Script

Run the following command to create a Super Admin user:

```bash
npm run create-super-admin
```

### Default Super Admin Credentials

The script creates a Super Admin with the following default credentials:

- **Email**: `admin@example.com`
- **Password**: `SuperAdmin123!`
- **Role**: `super_admin`
- **Status**: Active and Email Verified

### Customizing Super Admin Data

To customize the Super Admin user data, edit the `superAdminData` object in:
`src/scripts/createSuperAdmin.ts`

```typescript
const superAdminData = {
  email: 'your-email@example.com',
  password: 'YourSecurePassword123!',
  firstName: 'Your First Name',
  lastName: 'Your Last Name',
  phoneNumber: '+1234567890',
};
```

### Script Features

- ✅ Checks if Super Admin already exists
- ✅ Hashes password securely
- ✅ Sets appropriate role and permissions
- ✅ Provides clear feedback and instructions
- ✅ Handles errors gracefully

## 2. Login API

### Endpoint

```
POST /api/v1/users/login
```

### Request Body

```json
{
  "email": "admin@example.com",
  "password": "SuperAdmin123!"
}
```

### Response

#### Success Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "admin@example.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "super_admin",
      "isActive": true,
      "emailVerified": true,
      "phoneNumber": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Using the JWT Token

After successful login, include the token in the Authorization header for authenticated requests:

```javascript
// Example with axios
const response = await axios.get('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Login Validation

The login endpoint includes validation for:
- ✅ Valid email format
- ✅ Required password field
- ✅ User existence check
- ✅ Password verification
- ✅ Account active status

## 3. User Roles

The system supports the following user roles:

- `super_admin` - Full system access
- `edition_admin` - Edition-specific admin access
- `company_admin` - Company-specific admin access
- `user` - Regular user access
- `delegate` - Delegated user access

## 4. Testing the Setup

### Test Super Admin Creation

```bash
# Create the super admin
npm run create-super-admin

# Check the logs for success message
# Should output: "✅ Super admin created successfully!"
```

### Test Login API

```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SuperAdmin123!"
  }'
```

### Test Protected Route

```bash
# First login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "SuperAdmin123!"}' \
  | jq -r '.data.token')

# Use token to access protected route
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Security Considerations

### Password Security
- ✅ Passwords are hashed using bcrypt
- ✅ Salt rounds configurable via environment variables
- ✅ Default password should be changed after first login

### JWT Security
- ✅ Tokens are signed with a secret key
- ✅ Configurable expiration time
- ✅ Include user ID, email, and role in payload

### Environment Variables
Make sure to set secure values in your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

## 6. Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your database configuration in `.env`
   - Ensure PostgreSQL is running
   - Run `npm run db:migrate` if needed

2. **User Already Exists**
   - The script will inform you if a user with the same email exists
   - Use a different email or manually delete the existing user

3. **Permission Errors**
   - Make sure the database user has CREATE permissions
   - Check that the `users` table exists

4. **Token Errors**
   - Ensure `JWT_SECRET` is set in environment variables
   - Check token expiration time
   - Verify the token is included in the Authorization header

### Logs

Check the application logs for detailed error information:
- Console output during development
- `logs/error.log` for error messages
- `logs/combined.log` for all messages

## 7. Next Steps

After setting up the Super Admin and testing the login API:

1. **Change Default Password**: Login and update the default password
2. **Configure Environment**: Set production-ready environment variables
3. **Create Additional Users**: Use the admin interface to create other users
4. **Set Up Frontend**: Configure your frontend to use the login API
5. **Test Role-Based Access**: Ensure different roles have appropriate permissions 