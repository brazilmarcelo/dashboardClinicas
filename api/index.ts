import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to get appointments
app.get('/api/appointments', async (req, res) => {
  try {
    // FIX: Corrected table name from 'cliente_agendamento' to 'clienteagendamento'
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
    // FIX: Corrected table name from 'cliente_mensagem' to 'clientemensagem'
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
