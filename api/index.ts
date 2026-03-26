import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/disparos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM disparoagendamento ORDER BY datahoradisparo DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching disparos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/agendamentos', async (req, res) => {
  try {
    const result = await query("SELECT * FROM clienteagendamento WHERE status = 'Agendado' ORDER BY datacriacao DESC");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching agendamentos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM clientestatus ORDER BY ultimainteracao DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pacientes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
