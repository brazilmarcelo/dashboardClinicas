
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAppointments } from '../services/mockApi';
import type { ClienteAgendamento } from '../types';

const statusColors: Record<ClienteAgendamento['status'], string> = {
  Confirmado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  Desmarcado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Marcado: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<ClienteAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      const data = await fetchAppointments();
      setAppointments(data);
      setLoading(false);
    };
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!filterDate) return appointments;
    return appointments.filter(appt => {
      const apptDate = new Date(appt.dataagendamento).toISOString().split('T')[0];
      return apptDate === filterDate;
    });
  }, [appointments, filterDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Agendamentos</h2>
      
      <div className="bg-content-light dark:bg-content-dark p-4 rounded-xl shadow-md">
        <div className="flex items-center space-x-4">
            <label htmlFor="filterDate" className="font-medium">Filtrar por data do agendamento:</label>
            <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-light focus:border-primary-light block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
        </div>
      </div>
      
      <div className="overflow-x-auto bg-content-light dark:bg-content-dark rounded-xl shadow-lg">
        {loading ? (
          <div className="p-8 text-center">Carregando agendamentos...</div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">WhatsApp</th>
                <th scope="col" className="px-6 py-3">Data Agendamento</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Data Criação</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{appt.nomecliente}</td>
                  <td className="px-6 py-4">{appt.whatsapp}</td>
                  <td className="px-6 py-4">{formatDate(appt.dataagendamento)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[appt.status]}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatDate(appt.datacriacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
         {filteredAppointments.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">Nenhum agendamento encontrado para a data selecionada.</div>
        )}
      </div>
    </div>
  );
};