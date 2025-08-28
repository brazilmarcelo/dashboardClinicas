import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to the database!');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Fix: Replaced process.exit with throw to terminate on unrecoverable error, avoiding a TypeScript type issue.
    throw err;
});

export const query = (text: string, params?: any[]) => pool.query(text, params);