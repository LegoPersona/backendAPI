## How to Run (Local)

## API Documentation

### Authentication

All profile and persona history endpoints require `Authorization: Bearer <accessToken>`.

### Current User Profile

`GET /api/v1/users/me/profile`

Returns authenticated user profile data including safe user info, stats, persona summaries and achievements.

Response shape:

```json
{
   "user": {
      "id": "user-id",
      "username": "ofek_morali"
   },
   "stats": {
      "personasCount": 2,
      "unlockedAchievementsCount": 1,
      "totalAchievementsCount": 6
   },
   "personas": [
      {
         "id": "persona-id",
         "createdAt": "2026-07-01T10:00:00.000Z",
         "partsCount": 24,
         "originalImageUrl": null,
         "legoImageUrl": "http://localhost:3000/api/v1/personas/persona-id/image"
      }
   ],
   "achievements": [
      {
         "id": "brick-starter",
         "name": "Brick Starter",
         "description": "Created your first LEGO Persona",
         "isUnlocked": true,
         "unlockedAt": "2026-07-01T10:00:00.000Z",
         "progress": 1,
         "target": 1
      }
   ]
}
```

Status codes:

`200` profile returned
`401` missing/invalid token
`404` authenticated user no longer exists

### Get Persona By ID (Owner Only)

`GET /api/v1/personas/:personaId`

Returns a persona only when it belongs to the authenticated user.

Status codes:

`200` persona returned
`400` invalid `personaId`
`401` missing/invalid token
`404` persona not found (or not owned by caller)

### Delete Persona (Owner Only)

`DELETE /api/v1/personas/:personaId`

Deletes a persona only when it belongs to the authenticated user.

Status codes:

`204` persona deleted
`400` invalid `personaId`
`401` missing/invalid token
`404` persona not found (or not owned by caller)
# My Node.js Backend Project

This is a Node.js backend project built with TypeScript and Express. It serves as a template for creating scalable and maintainable web applications.

## Project Structure

```
my-node-backend
├── src
│   ├── app.ts                # Initializes the Express application and sets up middleware
│   ├── server.ts             # Entry point for starting the server
│   ├── config
│   │   └── env.ts           # Loads environment variables
│   ├── controllers
│   │   └── index.ts         # Contains business logic for routes
│   ├── routes
│   │   └── index.ts         # Sets up application routes
│   ├── middlewares
│   │   └── index.ts         # Middleware functions for the Express app
│   ├── services
│   │   └── index.ts         # Data processing or external API calls
│   ├── models
│   │   └── index.ts         # Data models or schemas for database interactions
│   ├── utils
│   │   └── index.ts         # Utility functions
│   └── types
│       └── index.ts         # TypeScript interfaces and types
├── package.json              # npm configuration and scripts
├── tsconfig.json             # TypeScript configuration
├── nodemon.json              # Nodemon configuration
├── .env.example              # Example environment variables
├── .gitignore                # Files and directories to ignore by Git
└── README.md                 # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-node-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and set your environment variables.

### Development

To start the development server with automatic reloading, run:
```
npm run dev
```

### Build

To build the project for production, run:
```
npm run build
```

### Running the Application

After building, you can start the application with:
```
npm start
```

### License

This project is licensed under the MIT License. See the LICENSE file for details.