// FIX: Imported React hooks from 'react' instead of 'recharts'.
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchAppointments, fetchAllMessages, fetchReport } from '../services/mockApi';
import type { ClienteAgendamento, ClienteMensagem } from '../types';
import { Card } from './ui/Card';
import { formatNumber } from '../utils/formatters';

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

const COLORS = {
  Confirmado: '#10b981', // emerald-500
  Desmarcado: '#ef4444',  // red-500
  Marcado: '#f59e0b',   // amber-500
  Agendamentos: '#8b5cf6', // violet-500
  Atendimentos: '#3b82f6', // blue-500
};

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

const processDailyData = (appointments: ClienteAgendamento[], messages: ClienteMensagem[]) => {
    const dailyMap = new Map<string, { Agendamentos: number; Confirmado: number; Desmarcado: number; Atendimentos: number }>();
    const processDate = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

    appointments.forEach(appt => {
        const day = processDate(appt.datacriacao);
        const entry = dailyMap.get(day) || { Agendamentos: 0, Confirmado: 0, Desmarcado: 0, Atendimentos: 0 };
        
        if (appt.agendei === 'agendamento cora') {
            entry.Agendamentos += 1;
        } else if (!appt.agendei) {
            const status = appt.status?.toLowerCase();
            if (status === 'confirmado') entry.Confirmado += 1;
            if (status === 'desmarcado' || status === 'desmarcados') entry.Desmarcado += 1;
        }
        dailyMap.set(day, entry);
    });

    const dailyAttendance = new Map<string, Set<string>>();
    messages.forEach(msg => {
        const day = processDate(msg.datahoramensagem);
        if (!dailyAttendance.has(day)) {
            dailyAttendance.set(day, new Set<string>());
        }
        dailyAttendance.get(day)!.add(msg.whatsapp);
    });

    dailyAttendance.forEach((whatsappSet, day) => {
        const entry = dailyMap.get(day) || { Agendamentos: 0, Confirmado: 0, Desmarcado: 0, Atendimentos: 0 };
        entry.Atendimentos = whatsappSet.size;
        dailyMap.set(day, entry);
    });
    
    return Array.from(dailyMap.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    if (!label) {
      const data = payload[0];
      // Pie chart tooltip
      return (
        <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
          <p style={{ color: data.payload.fill || data.fill }}>{`${data.name}: ${formatNumber(data.value)}`}</p>
        </div>
      );
    }
    
    // Bar/Line chart tooltip
    return (
      <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
        <p className="label">{`Data: ${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.fill }}>{`${pld.name}: ${formatNumber(pld.value)}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  // State from original Dashboard
  const [appointments, setAppointments] = useState<ClienteAgendamento[]>([]);
  const [messages, setMessages] = useState<ClienteMensagem[]>([]);
  
  // State from Copilot
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
    const loadData = async () => {
      try {
        setLoading(true);
        const [
            apptData, 
            msgData,
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
            fetchAppointments(), 
            fetchAllMessages(),
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
        
        // Set original dashboard state
        setAppointments(apptData);
        setMessages(msgData);
        
        // Set copilot state
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
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const dailyChartData = useMemo(() => processDailyData(appointments, messages).slice(-30), [appointments, messages]);

  const { totalAppointments, totalUniqueClients, totalConfirmations, statusPieData } = useMemo(() => {
    const coraAppointments = appointments.filter(a => a.agendei === 'agendamento cora');
    const clientInteractions = appointments.filter(a => !a.agendei);
    const confirmations = clientInteractions.filter(a => a.status?.toLowerCase() === 'confirmado').length;
    const uniqueClients = new Set(messages.map(m => m.whatsapp)).size;
    const statusCounts = clientInteractions.reduce((acc, curr) => {
        if (curr.status) {
            let statusKey = curr.status.charAt(0).toUpperCase() + curr.status.slice(1).toLowerCase();
            if (statusKey === 'Desmarcados') {
              statusKey = 'Desmarcado';
            }
            acc[statusKey] = (acc[statusKey] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    return {
      totalAppointments: coraAppointments.length,
      totalUniqueClients: uniqueClients,
      totalConfirmations: confirmations,
      statusPieData: pieData,
    };
  }, [appointments, messages]);

  const formattedDailyMessages = useMemo(() => 
      dailyMessages.map(d => ({...d, data_da_mensagem: new Date(d.data_da_mensagem).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}))
  , [dailyMessages]);

  const responseSpeedValue = aiResponseSpeed?.tempo_medio_resposta_segundos;

  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">Carregando...</div>;
  }
  
  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Total de Agendamentos (IA)" value={totalAppointments} color="violet" />
            <Card title="Total de Clientes Atendidos" value={totalUniqueClients} color="blue" />
            <Card title="Agendamentos Confirmados" value={totalConfirmations} color="emerald" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg">
                <h3 className="font-bold mb-4 text-lg">Atividade Diária (Últimos 30 dias)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" fontSize={12} tick={{ fill: 'currentColor' }} />
                        <YAxis fontSize={12} tick={{ fill: 'currentColor' }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                        <Legend />
                        <Bar dataKey="Agendamentos" fill={COLORS.Agendamentos} />
                        <Bar dataKey="Atendimentos" fill={COLORS.Atendimentos} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg">
                <h3 className="font-bold mb-4 text-lg">Status das Interações de Clientes</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {statusPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-content-light dark:bg-content-dark p-6 rounded-xl shadow-lg">
             <h3 className="font-bold mb-4 text-lg">Status de Confirmação Diária (Últimos 30 dias)</h3>
             <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={dailyChartData}>
                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                     <XAxis dataKey="date" fontSize={12} tick={{ fill: 'currentColor' }} />
                     <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                     <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} />
                     <Legend />
                     <Bar dataKey="Confirmado" stackId="status" fill={COLORS.Confirmado} />
                     <Bar dataKey="Desmarcado" stackId="status" fill={COLORS.Desmarcado} />
                 </BarChart>
             </ResponsiveContainer>
        </div>

        {/* --- Copilot Content Starts Here --- */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 pt-4">Copilot Analytics</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {executiveSummary.map(item => (
                <Card key={item.metrica} title={item.metrica} value={item.valor} color="violet" />
            ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Respostas Enviadas pela IA" value={aiResponseRate?.mensagens_cliente_com_resposta_ia ?? 0} color="emerald" />
            <Card title="Clientes que Retornaram" value={returningClients?.clientes_que_retornaram ?? 0} color="blue" />
            <Card 
                title="Velocidade Média de Resposta/s" 
                value={responseSpeedValue && responseSpeedValue > 0 ? `${formatNumber(responseSpeedValue)} s` : 'N/A'} 
                color="violet" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard title="Mensagens por Dia">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedDailyMessages}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="data_da_mensagem" fontSize={12} tick={{ fill: 'currentColor' }} angle={-25} textAnchor="end" height={60} interval="preserveStartEnd" />
                        <YAxis fontSize={12} tick={{ fill: 'currentColor' }} ticks={[0, 100, 200, 300, 400]} domain={[0, 400]} />
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
                                <td className="px-6 py-4">{formatNumber(c.total_mensagens_conversa)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportCard>
    </div>
  );
};