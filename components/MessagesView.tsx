
import React, { useState, useEffect, useMemo } from 'react';
import { fetchMessages } from '../services/mockApi';
import type { ClienteMensagem } from '../types';

export const MessagesView: React.FC = () => {
  const [messages, setMessages] = useState<ClienteMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: '', phone: '' });

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      const data = await fetchMessages();
      setMessages(data);
      setLoading(false);
    };
    loadMessages();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const msgDate = new Date(msg.datahoramensagem).toISOString().split('T')[0];
      const dateMatch = !filter.date || msgDate === filter.date;
      const phoneMatch = !filter.phone || msg.whatsapp.includes(filter.phone);
      return dateMatch && phoneMatch;
    });
  }, [messages, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mensagens</h2>
      
      <div className="bg-content-light dark:bg-content-dark p-4 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-auto">
                <label htmlFor="filterDate" className="font-medium text-sm sr-only">Filtrar por data:</label>
                <input
                    type="date"
                    id="filterDate"
                    name="date"
                    value={filter.date}
                    onChange={handleFilterChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-light focus:border-primary-light block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
             <div className="w-full md:w-auto">
                <label htmlFor="filterPhone" className="font-medium text-sm sr-only">Filtrar por telefone:</label>
                <input
                    type="text"
                    id="filterPhone"
                    name="phone"
                    placeholder="Filtrar por telefone"
                    value={filter.phone}
                    onChange={handleFilterChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-light focus:border-primary-light block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center">Carregando mensagens...</div>
        ) : (
          filteredMessages.map(msg => (
            <div key={msg.id} className="bg-content-light dark:bg-content-dark p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-primary-light">{msg.whatsapp}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(msg.datahoramensagem)}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-gray-600 dark:text-gray-300">Recebida:</span> {msg.mensagemrecebida}</p>
                <p><span className="font-semibold text-gray-600 dark:text-gray-300">Enviada:</span> {msg.mensagemenviada}</p>
              </div>
            </div>
          ))
        )}
        {filteredMessages.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">Nenhuma mensagem encontrada com os filtros aplicados.</div>
        )}
      </div>
    </div>
  );
};
