# FreelanceHub — Modern Freelance Marketplace

A full-stack, real-time freelance marketplace where clients post projects and freelancers bid in real-time.

## 🚀 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Real-Time:** Socket.io
- **Auth:** JWT + bcrypt

## 📁 Project Structure

```
freelance market/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth & error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── server.js        # Entry point
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React contexts (Auth, Socket)
│   │   ├── pages/       # Page components
│   │   ├── utils/       # API client & helpers
│   │   ├── App.jsx      # Main app with routes
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   └── tailwind.config.js
└── README.md
```

## 🛠 Setup Instructions

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** running locally or MongoDB Atlas URI
- **npm** or **yarn**

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Create/edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/freelance_marketplace
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

## 📌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET  | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects (filter/search/paginate) |
| GET | `/api/projects/:id` | Get project details + bids |
| POST | `/api/projects` | Create project (client only) |
| PUT | `/api/projects/:id` | Update project (owner only) |
| DELETE | `/api/projects/:id` | Delete project (owner only) |
| GET | `/api/projects/my-projects` | Client's projects |
| PUT | `/api/projects/:id/select-freelancer` | Select freelancer |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bids` | Place bid (freelancer only) |
| GET | `/api/bids/project/:id` | Get project bids |
| GET | `/api/bids/my-bids` | Freelancer's bids |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile` | Update own profile |
| GET | `/api/users/dashboard` | Get dashboard stats |
| GET | `/api/users/notifications` | Get notifications |
| PUT | `/api/users/notifications/read` | Mark notifications read |

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-user` | Client → Server | Join user notification room |
| `join-project` | Client → Server | Join project room for live bids |
| `leave-project` | Client → Server | Leave project room |
| `new-bid` | Server → Client | New bid on a project |
| `freelancer-selected` | Server → Client | Freelancer selected for project |
| `notification` | Server → Client | General notification |

## 👤 User Roles

- **Client:** Post projects, view bids, select freelancers
- **Freelancer:** Browse projects, place bids, manage portfolio

## 🔐 Security

- JWT-based authentication
- bcrypt password hashing (12 rounds)
- Role-based route protection
- Input validation (express-validator)
- CORS configuration
- Error handling middleware

## 📱 Features

- Real-time bidding (Socket.io)
- Live notifications
- Project search/filter/pagination
- Role-based dashboards
- Profile & portfolio management
- Responsive dark-mode UI
- Glassmorphism design system
