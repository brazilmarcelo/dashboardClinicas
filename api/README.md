# AI Dashboard Backend

This is a simple Node.js and Express backend to serve data from a PostgreSQL database for the AI Atendimento Dashboard.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A running PostgreSQL instance

## Setup

1.  **Install Dependencies:**
    Navigate to the `api` directory and run:
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

2.  **Database Setup:**
    Ensure your PostgreSQL database has the required tables (`cliente_agendamento` and `cliente_mensagem`) with schemas matching the types defined in the frontend (`/types.ts`).

3.  **Environment Variables:**
    Create a `.env` file in the `api` directory by copying the `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and set your `DATABASE_URL` and the desired `PORT`.

## Running the Server

-   **For development (with auto-reloading):**
    ```bash
    npm run dev
    ```
-   **For production:**
    ```bash
    npm start
    ```

The server will start on the port specified in your `.env` file (default is 3001).

## API Endpoints

-   `GET /api/appointments`: Returns a list of all appointments.
-   `GET /api/messages`: Returns a list of all messages.
