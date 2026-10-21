# Task Manager REST API

A REST API for managing personal tasks. Users register, log in to receive a JWT, and manage their own tasks. Each user can only access their own data.

## Features
- User registration and login with bcrypt-hashed passwords
- JWT authentication (tokens expire after 2 hours)
- Full CRUD for tasks
- Filter tasks by status (`todo`, `in_progress`, `done`)
- Input validation and clear error responses (400, 401, 404, 409)

## Tech Used
Node.js, Express, SQLite (better-sqlite3), JSON Web Tokens, bcryptjs

## Setup
1. Clone the repo and run `npm install`
2. Copy `.env.example` to `.env` and set `JWT_SECRET` to a long random string
3. Run `npm run dev`
4. The API runs on `http://localhost:3000`

## Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /register | Create an account | No |
| POST | /login | Get a token | No |
| POST | /tasks | Create a task | Yes |
| GET | /tasks | List your tasks (optional `?status=done`) | Yes |
| GET | /tasks/:id | Get one task | Yes |
| PUT | /tasks/:id | Update a task | Yes |
| DELETE | /tasks/:id | Delete a task | Yes |

Send the token in the header: `Authorization: Bearer <token>`

## Testing
Open `test.http` in VS Code with the REST Client extension to try every endpoint.