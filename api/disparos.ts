import { query } from './db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  try {
    const result = await query('SELECT * FROM disparoagendamento ORDER BY datahoradisparo DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching disparos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
