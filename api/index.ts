import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: The express.json() middleware must be invoked as a function.
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


// New generic endpoint for reports
app.get('/api/reports', async (req, res) => {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Report name is required' });
    }

    let sql = '';
    const params: any[] = [];

    switch (name) {
        case 'dailyMessages':
            sql = `SELECT DATE(datahoramensagem) AS data_da_mensagem, COUNT(*) AS quantidade_mensagens FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL GROUP BY DATE(datahoramensagem) ORDER BY data_da_mensagem;`;
            break;
        case 'totalUniqueContacts':
            sql = `SELECT COUNT(DISTINCT whatsapp) AS total_contatos_unicos FROM public.clientemensagem WHERE whatsapp IS NOT NULL AND whatsapp <> '';`;
            break;
        case 'messagesPerContact':
            sql = `SELECT whatsapp AS contato_whatsapp, COUNT(*) AS quantidade_mensagens FROM public.clientemensagem WHERE whatsapp IS NOT NULL AND whatsapp <> '' GROUP BY whatsapp ORDER BY quantidade_mensagens DESC, contato_whatsapp;`;
            break;
        case 'contactsPerDay':
            sql = `SELECT DATE(datahoramensagem) AS data_do_dia, COUNT(DISTINCT whatsapp) AS quantidade_contatos_unicos FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL AND whatsapp IS NOT NULL AND whatsapp <> '' GROUP BY DATE(datahoramensagem) ORDER BY data_do_dia;`;
            break;
        case 'serviceHours':
            sql = `
                SELECT
                    CASE 
                        WHEN EXTRACT(HOUR FROM datahoramensagem) BETWEEN 8 AND 18 
                             AND EXTRACT(DOW FROM datahoramensagem) BETWEEN 1 AND 5 
                        THEN 'Horário Comercial'
                        ELSE 'Fora do Horário Comercial'
                    END AS periodo_atendimento,
                    COUNT(*) AS quantidade_mensagens,
                    COUNT(DISTINCT whatsapp) AS contatos_unicos,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentual
                FROM public.clientemensagem
                WHERE datahoramensagem IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN EXTRACT(HOUR FROM datahoramensagem) BETWEEN 8 AND 18 
                             AND EXTRACT(DOW FROM datahoramensagem) BETWEEN 1 AND 5 
                        THEN 'Horário Comercial'
                        ELSE 'Fora do Horário Comercial'
                    END;
            `;
            break;
        case 'hourlyActivity':
            sql = `SELECT EXTRACT(HOUR FROM datahoramensagem) AS hora_do_dia, COUNT(*) AS numero_de_mensagens, COUNT(DISTINCT whatsapp) AS contatos_unicos_por_hora FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL GROUP BY EXTRACT(HOUR FROM datahoramensagem) ORDER BY hora_do_dia;`;
            break;
        case 'avgMessagesPerClient':
            sql = `SELECT ROUND(CAST(COUNT(*) AS DECIMAL) / COUNT(DISTINCT whatsapp), 2) AS media_mensagens_por_cliente, COUNT(DISTINCT whatsapp) AS total_clientes, COUNT(*) AS total_mensagens FROM public.clientemensagem WHERE whatsapp IS NOT NULL AND whatsapp <> '';`;
            break;
        case 'appointmentMessages':
            sql = `SELECT COUNT(*) AS total_mensagens_agendamento, COUNT(DISTINCT whatsapp) AS clientes_interessados_agendamento FROM public.clientemensagem WHERE (mensagemrecebida ILIKE '%agendar%' OR mensagemrecebida ILIKE '%consulta%' OR mensagemrecebida ILIKE '%horario%' OR mensagemrecebida ILIKE '%marcar%' OR mensagemenviada ILIKE '%agendado%' OR mensagemenviada ILIKE '%confirmado%' OR mensagemenviada ILIKE '%disponivel%');`;
            break;
        case 'frequentQuestionTypes':
            sql = `SELECT CASE WHEN mensagemrecebida ILIKE '%preço%' OR mensagemrecebida ILIKE '%valor%' OR mensagemrecebida ILIKE '%custo%' THEN 'Preços/Valores' WHEN mensagemrecebida ILIKE '%agendar%' OR mensagemrecebida ILIKE '%consulta%' OR mensagemrecebida ILIKE '%horario%' THEN 'Agendamentos' WHEN mensagemrecebida ILIKE '%endereço%' OR mensagemrecebida ILIKE '%localização%' OR mensagemrecebida ILIKE '%onde%' THEN 'Localização' WHEN mensagemrecebida ILIKE '%exame%' OR mensagemrecebida ILIKE '%procedimento%' THEN 'Procedimentos/Exames' WHEN mensagemrecebida ILIKE '%convênio%' OR mensagemrecebida ILIKE '%plano%' THEN 'Convênios' ELSE 'Outras Dúvidas' END AS tipo_duvida, COUNT(*) AS quantidade, COUNT(DISTINCT whatsapp) AS clientes_unicos FROM public.clientemensagem WHERE mensagemrecebida IS NOT NULL AND mensagemrecebida <> '' GROUP BY 1 ORDER BY quantidade DESC;`;
            break;
        case 'longConversations':
            sql = `SELECT whatsapp, COUNT(*) AS total_mensagens_conversa, MIN(datahoramensagem) AS inicio_conversa, MAX(datahoramensagem) AS fim_conversa FROM public.clientemensagem WHERE whatsapp IS NOT NULL AND whatsapp <> '' GROUP BY whatsapp HAVING COUNT(*) >= 5 ORDER BY total_mensagens_conversa DESC LIMIT 20;`;
            break;
        case 'aiResponseRate':
            sql = `WITH mensagens_sequenciais AS (SELECT whatsapp, datahoramensagem, mensagemrecebida, LEAD(mensagemenviada) OVER (PARTITION BY whatsapp ORDER BY datahoramensagem) as proxima_resposta_ia FROM public.clientemensagem WHERE whatsapp IS NOT NULL) SELECT COUNT(CASE WHEN mensagemrecebida IS NOT NULL AND proxima_resposta_ia IS NOT NULL THEN 1 END) AS mensagens_cliente_com_resposta_ia, COUNT(CASE WHEN mensagemrecebida IS NOT NULL THEN 1 END) AS total_mensagens_cliente FROM mensagens_sequenciais;`;
            break;
        case 'returningClients':
            sql = `WITH primeiras_conversas AS (SELECT whatsapp, COUNT(DISTINCT DATE(datahoramensagem)) as dias_diferentes_conversa FROM public.clientemensagem WHERE whatsapp IS NOT NULL AND whatsapp <> '' GROUP BY whatsapp) SELECT COUNT(*) as total_clientes, COUNT(CASE WHEN dias_diferentes_conversa > 1 THEN 1 END) as clientes_que_retornaram FROM primeiras_conversas;`;
            break;
        case 'aiResponseSpeed':
            sql = `
                WITH pares_mensagem AS (
                    SELECT 
                        whatsapp,
                        datahoramensagem as hora_cliente,
                        mensagemrecebida,
                        LEAD(datahoramensagem) OVER (PARTITION BY whatsapp ORDER BY datahoramensagem) as hora_resposta_ia,
                        LEAD(mensagemenviada) OVER (PARTITION BY whatsapp ORDER BY datahoramensagem) as resposta_ia
                    FROM public.clientemensagem
                    WHERE whatsapp IS NOT NULL
                )
                SELECT 
                    COALESCE(
                        ROUND(AVG(EXTRACT(EPOCH FROM (hora_resposta_ia - hora_cliente))), 2),
                        0
                    ) as tempo_medio_resposta_segundos
                FROM pares_mensagem
                WHERE mensagemrecebida IS NOT NULL 
                  AND resposta_ia IS NOT NULL
                  AND hora_resposta_ia > hora_cliente
                  AND EXTRACT(EPOCH FROM (hora_resposta_ia - hora_cliente)) < 300;
            `;
            break;
        case 'peakDemand':
            sql = `SELECT DATE(datahoramensagem) as data_atendimento, EXTRACT(HOUR FROM datahoramensagem) as hora, COUNT(*) as mensagens_por_hora, COUNT(DISTINCT whatsapp) as clientes_unicos_por_hora FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL GROUP BY 1, 2 ORDER BY mensagens_por_hora DESC LIMIT 20;`;
            break;
        case 'executiveSummary':
            sql = `
                SELECT 'Total de Mensagens Processadas' as metrica, COUNT(*)::text as valor FROM public.clientemensagem
                UNION ALL
                SELECT 'Dias de Operação', COUNT(DISTINCT DATE(datahoramensagem))::text FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL
                UNION ALL
                SELECT 'Média Mensagens/Dia', ROUND(COUNT(*)::decimal / NULLIF(COUNT(DISTINCT DATE(datahoramensagem)), 0))::text FROM public.clientemensagem WHERE datahoramensagem IS NOT NULL;
            `;
            break;
        default:
            return res.status(404).json({ error: 'Report not found' });
    }

    try {
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(`Error fetching report '${name}':`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});