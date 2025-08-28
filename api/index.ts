import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: The express.json() middleware must be invoked as a function call.
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

// Endpoint to get unique contacts (whatsapp numbers)
app.get('/api/contacts', async (req, res) => {
  try {
    const result = await query(
      `SELECT whatsapp, MAX(datahoramensagem) as last_message_date 
       FROM clientemensagem 
       GROUP BY whatsapp 
       ORDER BY last_message_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to get messages
app.get('/api/messages', async (req, res) => {
  const { whatsapp } = req.query;

  try {
    if (whatsapp && typeof whatsapp === 'string') {
      // Fetch messages for a specific contact, ordered chronologically for chat view
      const result = await query(
        'SELECT * FROM clientemensagem WHERE whatsapp = $1 ORDER BY datahoramensagem ASC',
        [whatsapp]
      );
      res.json(result.rows);
    } else {
      // Fetch all messages if no whatsapp number is provided (for dashboard)
      const result = await query('SELECT * FROM clientemensagem ORDER BY datahoramensagem DESC');
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
