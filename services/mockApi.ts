
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

export const fetchAllMessages = (): Promise<ClienteMensagem[]> => {
  return fetch(`${API_BASE_URL}/messages`).then(handleResponse<ClienteMensagem[]>);
};

export const fetchMessagesByWhatsapp = (whatsapp: string): Promise<ClienteMensagem[]> => {
  return fetch(`${API_BASE_URL}/messages?whatsapp=${encodeURIComponent(whatsapp)}`).then(handleResponse<ClienteMensagem[]>);
};

export interface Contact {
  whatsapp: string;
  last_message_date: string;
}

export const fetchContacts = (): Promise<Contact[]> => {
    return fetch(`${API_BASE_URL}/contacts`).then(handleResponse<Contact[]>);
};

export const fetchReport = (reportName: string): Promise<any> => {
    return fetch(`${API_BASE_URL}/reports?name=${reportName}`).then(handleResponse);
}
