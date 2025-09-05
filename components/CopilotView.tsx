

import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchReport } from '../services/mockApi';
import { Card } from './ui/Card';

// Type definitions for report data
type ExecutiveSummary = { metrica: string; valor: string };
type DailyMessages = { data_da_mensagem: string; quantidade_mensagens: number };
type HourlyActivity = { hora_do_dia: number; numero_de_mensagens: number };
type ServiceHours = { periodo_atendimento: string; quantidade_mensagens: number };
type FrequentQuestionTypes = { tipo_duvida: string; quantidade: number };
type LongConversations = { whatsapp: string; total_mensagens_conversa: number };
type AiResponseRate = { mensagens_cliente_com_resposta_ia: number, total_mensagens_cliente: number };
type ReturningClients = { total_clientes: number, clientes_que_retornaram: number };
type AiResponseSpeed = { tempo_medio_resposta_segundos: number | null };

const SERVICE_HOURS_COLORS = {
  'Horário Comercial': '#82ca9d',
  'Fora do Horário Comercial': '#ffc658',
};

const ReportCard: React.FC<{ children: React.ReactNode; title: string, className?: string }> = ({ children, title, className }) => (
  <div className={`bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg ${className}`}>
    <h3 className="font-bold mb-4 text-lg">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Special case for PieChart tooltip, which doesn't have a `label`
    if (payload[0].name && typeof payload[0].value !== 'undefined' && !label) {
        const data = payload[0];
        return (
            <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
                <p style={{ color: data.fill }}>{`${data.name}: ${data.value}`}</p>
            </div>
        );
    }
    
    // Default for other charts like Bar, Line
    return (
      <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
        <p className="label">{`${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.fill }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};


export const CopilotView: React.FC = () => {
    const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary[]>([]);
    const [dailyMessages, setDailyMessages] = useState<DailyMessages[]>([]);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
    const [serviceHours, setServiceHours] = useState<ServiceHours[]>([]);
    const [frequentQuestionTypes, setFrequentQuestionTypes] = useState<FrequentQuestionTypes[]>([]);
    const [longConversations, setLongConversations] = useState<LongConversations[]>([]);
    const [aiResponseRate, setAiResponseRate] = useState<AiResponseRate | null>(null);
    const [returningClients, setReturningClients] = useState<ReturningClients | null>(null);
    const [aiResponseSpeed, setAiResponseSpeed] = useState<AiResponseSpeed | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAllReports = async () => {
            setLoading(true);
            try {
                const [
                    execSummaryData,
                    dailyMessagesData,
                    hourlyActivityData,
                    serviceHoursData,
                    frequentQuestionTypesData,
                    longConversationsData,
                    aiResponseRateData,
                    returningClientsData,
                    aiResponseSpeedData,
                ] = await Promise.all([
                    fetchReport('executiveSummary'),
                    fetchReport('dailyMessages'),
                    fetchReport('hourlyActivity'),
                    fetchReport('serviceHours'),
                    fetchReport('frequentQuestionTypes'),
                    fetchReport('longConversations'),
                    fetchReport('aiResponseRate').then(d => d[0]),
                    fetchReport('returningClients').then(d => d[0]),
                    fetchReport('aiResponseSpeed').then(d => d[0]),
                ]);
                setExecutiveSummary(execSummaryData);
                setDailyMessages(dailyMessagesData);
                setHourlyActivity(hourlyActivityData.sort((a,b) => a.hora_do_dia - b.hora_do_dia));
                setServiceHours(serviceHoursData);
                setFrequentQuestionTypes(frequentQuestionTypesData);
                setLongConversations(longConversationsData);
                setAiResponseRate(aiResponseRateData);
                setReturningClients(returningClientsData);
                setAiResponseSpeed(aiResponseSpeedData);
            } catch (error) {
                console.error("Failed to load reports:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAllReports();
    }, []);

    const formattedDailyMessages = useMemo(() => 
        dailyMessages.map(d => ({...d, data_da_mensagem: new Date(d.data_da_mensagem).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}))
    , [dailyMessages]);
    
    const responseRatePercent = useMemo(() => {
        if (!aiResponseRate || !aiResponseRate.total_mensagens_cliente) return 0;
        return ((aiResponseRate.mensagens_cliente_com_resposta_ia / aiResponseRate.total_mensagens_cliente) * 100).toFixed(1);
    }, [aiResponseRate]);
    
    const returningClientsPercent = useMemo(() => {
        if (!returningClients || !returningClients.total_clientes) return 0;
        return ((returningClients.clientes_que_retornaram / returningClients.total_clientes) * 100).toFixed(1);
    }, [returningClients]);

    if (loading) {
        return <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">Carregando relatórios do Copilot...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Copilot Analytics</h2>
            
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {executiveSummary.map(item => (
                    <Card key={item.metrica} title={item.metrica} value={item.valor} color="violet" />
                ))}
            </div>

            {/* AI Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Taxa de Resposta da IA" value={`${responseRatePercent}%`} color="emerald" />
                <Card title="Taxa de Retorno de Clientes" value={`${returningClientsPercent}%`} color="blue" />
                <Card title="Velocidade Média de Resposta" value={aiResponseSpeed?.tempo_medio_resposta_segundos ? `${aiResponseSpeed.tempo_medio_resposta_segundos}s` : 'N/A'} color="violet" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportCard title="Mensagens por Dia">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formattedDailyMessages}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="data_da_mensagem" fontSize={12} tick={{ fill: 'currentColor' }} angle={-25} textAnchor="end" height={60} interval="preserveStartEnd" />
                            <YAxis fontSize={12} tick={{ fill: 'currentColor' }}/>
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                            <Legend />
                            <Bar dataKey="quantidade_mensagens" name="Mensagens" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </ReportCard>

                <ReportCard title="Atividade por Hora do Dia">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyActivity}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="hora_do_dia" unit="h" fontSize={12} tick={{ fill: 'currentColor' }} />
                            <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                            <Legend />
                            <Bar dataKey="numero_de_mensagens" name="Mensagens" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </ReportCard>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <ReportCard title="Tipos de Dúvidas Frequentes" className="lg:col-span-3">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={frequentQuestionTypes} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="tipo_duvida" type="category" width={120} fontSize={12} tick={{ fill: 'currentColor' }} />
                           <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                           <Legend />
                           <Bar dataKey="quantidade" name="Quantidade" fill="#ffc658" />
                        </BarChart>
                    </ResponsiveContainer>
                </ReportCard>
                <ReportCard title="Horário de Atendimento" className="lg:col-span-2">
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={serviceHours} 
                                dataKey="quantidade_mensagens" 
                                nameKey="periodo_atendimento" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80} 
                                labelLine={false}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                                {serviceHours.map((entry) => (
                                    <Cell key={`cell-${entry.periodo_atendimento}`} fill={SERVICE_HOURS_COLORS[entry.periodo_atendimento as keyof typeof SERVICE_HOURS_COLORS]} />
                                ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                           <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ReportCard>
            </div>

            <ReportCard title="Clientes Mais Engajados (Top 20)">
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">WhatsApp</th>
                                <th scope="col" className="px-6 py-3">Total de Mensagens</th>
                            </tr>
                        </thead>
                        <tbody>
                            {longConversations.map(c => (
                                <tr key={c.whatsapp} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.whatsapp}</td>
                                    <td className="px-6 py-4">{c.total_mensagens_conversa}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ReportCard>
        </div>
    );
};