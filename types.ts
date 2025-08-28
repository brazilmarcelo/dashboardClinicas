
export interface ClienteAgendamento {
  id: number;
  whatsapp: string;
  nomecliente: string;
  dataagendamento: string; // ISO date string
  status: 'Marcado' | 'Confirmado' | 'Desmarcado';
  datacriacao: string; // ISO date string
  idagendahd: string;
  agendei: string;
}

export interface ClienteMensagem {
  id: number;
  whatsapp: string;
  mensagemrecebida: string;
  mensagemenviada: string;
  datahoramensagem: string; // ISO date string
}