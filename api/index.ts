import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: Using the named import `json` to avoid a TypeScript overload resolution issue with `express.json()`.
app.use(json());

// Endpoint to get appointments
app.get('/api/appointments', async (req, res) => {
  try {
    // FIX: Reverted table name to 'cliente_agendamento' to match README.md and likely DB schema.
    const result = await query('SELECT * FROM cliente_agendamento ORDER BY datacriacao DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get messages
app.get('/api/messages', async (req, res) => {
  try {
    // FIX: Reverted table name to 'cliente_mensagem' to match README.md and likely DB schema.
    const result = await query('SELECT * FROM cliente_mensagem ORDER BY datahoramensagem DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
