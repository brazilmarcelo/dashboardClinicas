import { ClienteAgendamento, ClienteMensagem } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // Assuming the backend runs on port 3001

// Helper function to handle fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed with status ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const fetchAppointments = (): Promise<ClienteAgendamento[]> => {
  return fetch(`${API_BASE_URL}/appointments`).then(handleResponse<ClienteAgendamento[]>);
};

export const fetchMessages = (): Promise<ClienteMensagem[]> => {
  return fetch(`${API_BASE_URL}/messages`).then(handleResponse<ClienteMensagem[]>);
};
