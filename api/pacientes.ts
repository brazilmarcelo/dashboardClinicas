import { query } from './db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  try {
    const result = await query('SELECT * FROM clientestatus ORDER BY ultimainteracao DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pacientes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
