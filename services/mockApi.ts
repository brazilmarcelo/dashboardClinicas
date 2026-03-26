
import type { DisparoAgendamento, ClienteAgendamento, ClienteStatus } from '../types';

// Em desenvolvimento usa localhost. Em produção (Vercel) usa a variável VITE_API_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed with status ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const fetchDisparos = (): Promise<DisparoAgendamento[]> =>
  fetch(`${API_BASE_URL}/disparos`).then(handleResponse<DisparoAgendamento[]>);

export const fetchAgendamentos = (): Promise<ClienteAgendamento[]> =>
  fetch(`${API_BASE_URL}/agendamentos`).then(handleResponse<ClienteAgendamento[]>);

export const fetchPacientes = (): Promise<ClienteStatus[]> =>
  fetch(`${API_BASE_URL}/pacientes`).then(handleResponse<ClienteStatus[]>);
