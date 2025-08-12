# 🍃 Booch Buddy

A comprehensive kombucha brewing tracking application built with React, TypeScript, and MySQL.

## 🚀 Features

- **Batch Tracking**: Track your kombucha batches from start to finish
- **Fermentation Monitoring**: Log measurements, pH, Brix, and more
- **Recipe Templates**: Save and reuse your favorite recipes
- **Photo Documentation**: Upload photos to track visual progress
- **Equipment Management**: Keep track of your brewing equipment
- **User Authentication**: Secure user accounts and data
- **Advanced Analytics**: Visualize your brewing patterns and success

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **MySQL 8.0+** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn package manager

## 🏗️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project_booch
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create MySQL Database

```sql
-- Connect to MySQL as root or admin user
CREATE DATABASE booch_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Run Database Schema

```bash
# Import the database schema
mysql -u your_username -p booch_buddy < database/schema.sql
```

### 4. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:

```env
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=booch_buddy

# Authentication (Generate a secure secret)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
```

### 5. Build the Backend

```bash
npm run build:server
```

### 6. Start Development Servers

For full-stack development with both frontend and backend:

```bash
npm run dev:full
```

Or start them separately:

```bash
# Backend only
npm run dev:server

# Frontend only (in separate terminal)
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 👤 Default Login

The database schema creates a default admin user:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the default password after first login!

## 📊 Database Schema

The application uses the following main tables:

- `users` - User accounts and authentication
- `batches` - Kombucha batch records
- `batch_intervals` - Time-series measurements
- `enhanced_measurements` - Detailed brewing measurements
- `recipe_templates` - Saved brewing recipes
- `batch_photos` - Photo documentation
- `equipment` - Brewing equipment tracking
- `chat_conversations` & `chat_messages` - AI chat functionality
- `user_settings` - User preferences and API keys

## 🔧 Production Deployment

### For Plesk/cPanel Hosting:

1. **Upload Files**: Upload the entire project to your hosting directory

2. **Database Setup**: 
   - Create MySQL database through hosting control panel
   - Import `database/schema.sql` through phpMyAdmin or similar

3. **Environment Variables**:
   - Create `.env` file with production database credentials
   - Use strong JWT secret
   - Set NODE_ENV=production

4. **Build Application**:
   ```bash
   npm run build
   npm run build:server
   ```

5. **Start Application**:
   ```bash
   node server/dist/index.js
   ```

### Environment Variables for Production:

```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=booch_buddy
JWT_SECRET=your-very-secure-production-jwt-secret
FRONTEND_URL=https://yourdomain.com
```

## 📁 Project Structure

```
project_booch/
├── database/           # Database schema and migrations
├── server/            # Backend API server
│   ├── config/        # Database configuration
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   └── services/      # Business logic
├── src/               # Frontend React application
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── services/      # API services
│   └── types/         # TypeScript type definitions
└── dist/              # Built frontend files
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Batches
- `GET /api/batches` - Get all batches for user
- `POST /api/batches` - Create new batch
- `GET /api/batches/:id` - Get batch by ID
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue on the GitHub repository.

## 🏆 Acknowledgments

- Built with love for the home brewing community
- Inspired by the art and science of kombucha brewing