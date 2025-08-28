import React, { useState, useEffect, useMemo } from 'react';
import { fetchContacts, fetchMessagesByWhatsapp } from '../services/mockApi';
import type { Contact } from '../services/mockApi';
import type { ClienteMensagem } from '../types';
import { ChatAlt2Icon } from '../constants';

export const MessagesView: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ClienteMensagem[]>([]);
  
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filterPhone, setFilterPhone] = useState('');

  useEffect(() => {
    const loadContacts = async () => {
      setContactsLoading(true);
      try {
        const data = await fetchContacts();
        setContacts(data);
      } catch (error) {
        console.error("Failed to load contacts:", error);
      } finally {
        setContactsLoading(false);
      }
    };
    loadContacts();
  }, []);

  useEffect(() => {
    if (!selectedContact) {
        setConversation([]);
        return;
    }

    const loadConversation = async () => {
      setMessagesLoading(true);
      try {
        const data = await fetchMessagesByWhatsapp(selectedContact);
        setConversation(data);
      } catch (error) {
        console.error(`Failed to load messages for ${selectedContact}:`, error);
        setConversation([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    loadConversation();
  }, [selectedContact]);

  const filteredContacts = useMemo(() => {
    if (!filterPhone) return contacts;
    return contacts.filter(contact => contact.whatsapp.includes(filterPhone));
  }, [contacts, filterPhone]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex-shrink-0">Mensagens</h2>
      
      <div className="flex-grow flex border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg bg-content-light dark:bg-content-dark overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Buscar por telefone..."
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-light focus:border-primary-light block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div className="flex-grow overflow-y-auto">
            {contactsLoading ? (
              <p className="p-4 text-center text-gray-500">Carregando contatos...</p>
            ) : (
              <ul>
                {filteredContacts.map(contact => (
                  <li key={contact.whatsapp}>
                    <button
                      onClick={() => setSelectedContact(contact.whatsapp)}
                      className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${selectedContact === contact.whatsapp ? 'bg-primary-dark/20' : ''}`}
                    >
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{contact.whatsapp}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Última msg: {new Date(contact.last_message_date).toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {filteredContacts.length === 0 && !contactsLoading && (
                <p className="p-4 text-center text-gray-500">Nenhum contato encontrado.</p>
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="hidden md:flex w-2/3 flex-col">
          {!selectedContact ? (
            <div className="flex-grow flex flex-col justify-center items-center text-gray-500">
              <ChatAlt2Icon className="w-16 h-16 mb-4"/>
              <p className="text-lg">Selecione uma conversa</p>
              <p className="text-sm">Escolha um contato na barra lateral para ver as mensagens.</p>
            </div>
          ) : messagesLoading ? (
            <div className="flex-grow flex justify-center items-center">
              <p>Carregando mensagens...</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-lg text-primary-light">{selectedContact}</h3>
              </div>
              <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {conversation.map(msg => (
                  <div key={msg.id} className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold">C</span>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[80%]">
                            <p className="text-gray-800 dark:text-gray-200">{msg.mensagemrecebida}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">{formatDate(msg.datahoramensagem)}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 justify-end">
                        <div className="bg-primary-dark/80 text-white rounded-lg p-3 max-w-[80%]">
                            <p>{msg.mensagemenviada}</p>
                            <p className="text-xs text-primary-light/70 text-right mt-1">{formatDate(msg.datahoramensagem)}</p>
                        </div>
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">IA</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
           {conversation.length === 0 && selectedContact && !messagesLoading &&(
              <div className="flex-grow flex justify-center items-center">
                  <p className="text-gray-500">Nenhuma mensagem nesta conversa.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};