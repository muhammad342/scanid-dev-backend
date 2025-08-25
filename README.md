# Riders Emergency Info Backend

A production-ready Node.js backend application built with TypeScript, Express.js, and PostgreSQL. This application follows clean architecture principles and implements best practices for security, logging, and error handling.

## 🚀 Features

- **TypeScript** - Type-safe development
- **Express.js** - Fast and minimalist web framework
- **PostgreSQL** - Robust relational database
- **Sequelize** - Promise-based ORM
- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Admin and user roles
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - Protection against abuse
- **Security Headers** - Helmet.js for security
- **CORS** - Cross-origin resource sharing
- **Logging** - Winston logger with multiple transports
- **Error Handling** - Comprehensive error handling
- **API Documentation** - Clean and consistent API responses
- **Environment Configuration** - dotenv for environment variables
- **Code Quality** - ESLint and Prettier
- **Testing** - Jest testing framework setup

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── database/        # Database migrations and seeders
└── index.ts         # Application entry point
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RidersEmergencyInfo-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb riders_emergency_db
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `3000` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `riders_emergency_db` |
| `DB_USERNAME` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit max requests | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login

### User Management
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update current user profile
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID (admin only)
- `PUT /api/v1/users/:id` - Update user by ID (admin only)
- `DELETE /api/v1/users/:id` - Delete user by ID (admin only)

### Health Check
- `GET /api/v1/health` - API health check

## 🔐 Authentication & Authorization

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **user** - Standard user with basic permissions
- **admin** - Administrator with full permissions

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Run database seeders

## 🔧 Development

### Code Quality
- **ESLint** - Code linting with TypeScript rules
- **Prettier** - Code formatting
- **Husky** - Git hooks (optional)

### Database
- **Sequelize CLI** - Database migrations and seeders
- **PostgreSQL** - Primary database

### Security
- **Helmet** - Security headers
- **Rate Limiting** - Request rate limiting
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Request validation with express-validator
- **Password Hashing** - bcryptjs for password hashing

## 📊 Logging

The application uses Winston for logging with different levels:
- **error** - Error messages
- **warn** - Warning messages
- **info** - Information messages
- **debug** - Debug messages

Logs are written to:
- Console (formatted for development)
- `logs/error.log` (error messages only)
- `logs/combined.log` (all messages)

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   # Set other production variables
   ```

3. **Start the application**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ using Node.js, TypeScript, and PostgreSQL 