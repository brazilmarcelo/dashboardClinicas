
export interface DisparoAgendamento {
  idagenda: number;
  nomemedico: string;
  crmmedico: string | null;
  statusagenda: string;
  dataagenda: string;
  datahoraagenda: string;
  diasemana: string;
  nomepaciente: string | null;
  nomeenvio: string | null;
  cpfpaciente: string | null;
  codigopaciente: number | null;
  celularpaciente: string | null;
  telefonepaciente: string | null;
  datahoradisparo: string | null;
  confirmoucancelou: string | null;
  dataconfirmoucancelou: string | null;
  tipolembrete: number | null;
  datalembrete1: string | null;
  datalembrete2: string | null;
  datalembrete3: string | null;
  datalembrete4: string | null;
  procedimento: string | null;
}

export interface ClienteAgendamento {
  id: number;
  identifier: string | null;
  chatwootid: number | null;
  whatsapp: string | null;
  pushname: string | null;
  idclienteerp: string | null;
  status: string | null;
  dataagendamento: string | null;
  datacriacao: string | null;
  idagendaerp: string | null;
  nomemedico: string | null;
  nomecliente: string | null;
  cpf: string | null;
  agendei: string | null;
  idhorarioerp: string | null;
}

export interface ClienteStatus {
  id: number;
  identifier: string;
  chatwootid: number | null;
  whatsapp: string | null;
  pushname: string | null;
  nome: string | null;
  ultimainteracao: string;
  chatwootconversationid: number | null;
  etapa: number | null;
  etapafollowup: number | null;
}
