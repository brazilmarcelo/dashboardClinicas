import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: Using express.json() to parse JSON request bodies. This resolves the TypeScript overload issue.
app.use(express.json());

// Endpoint to get appointments
app.get('/api/appointments', async (req, res) => {
  try {
    // FIX: Corrected table name to 'clienteagendamento' based on database error.
    const result = await query('SELECT * FROM clienteagendamento ORDER BY datacriacao DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get messages
app.get('/api/messages', async (req, res) => {
  try {
    // FIX: Corrected table name to 'clientemensagem' based on database error.
    const result = await query('SELECT * FROM clientemensagem ORDER BY datahoramensagem DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
