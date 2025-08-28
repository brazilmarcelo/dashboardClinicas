import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchAppointments, fetchAllMessages } from '../services/mockApi';
import type { ClienteAgendamento, ClienteMensagem } from '../types';
import { Card } from './ui/Card';

const COLORS = {
  Confirmado: '#10b981', // emerald-500
  Desmarcado: '#ef4444',  // red-500
  Marcado: '#f59e0b',   // amber-500
  Agendamentos: '#8b5cf6', // violet-500
  Atendimentos: '#3b82f6', // blue-500
};

const processDailyData = (appointments: ClienteAgendamento[], messages: ClienteMensagem[]) => {
    const dailyMap = new Map<string, { Agendamentos: number; Confirmado: number; Desmarcado: number; Atendimentos: number }>();
    const processDate = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

    // Process appointments based on new logic
    appointments.forEach(appt => {
        const day = processDate(appt.datacriacao);
        const entry = dailyMap.get(day) || { Agendamentos: 0, Confirmado: 0, Desmarcado: 0, Atendimentos: 0 };
        
        if (appt.agendei === 'agendamento cora') {
            entry.Agendamentos += 1;
        } else if (!appt.agendei) { // agendei IS NULL
            const status = appt.status?.toLowerCase();
            if (status === 'confirmado') entry.Confirmado += 1;
            // FIX: Handle plural 'desmarcados' from data
            if (status === 'desmarcado' || status === 'desmarcados') entry.Desmarcado += 1;
        }
        dailyMap.set(day, entry);
    });

    // Process messages for unique daily attendances
    const dailyAttendance = new Map<string, Set<string>>();
    messages.forEach(msg => {
        const day = processDate(msg.datahoramensagem);
        if (!dailyAttendance.has(day)) {
            dailyAttendance.set(day, new Set<string>());
        }
        // Add whatsapp to the Set for the given day to count unique clients
        dailyAttendance.get(day)!.add(msg.whatsapp);
    });

    // Merge unique attendance counts into the main map
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
    // FIX: Handle PieChart tooltip case where `label` is undefined.
    if (!label) {
      const data = payload[0];
      return (
        <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
          <p style={{ color: data.payload.fill }}>{`${data.name}: ${data.value}`}</p>
        </div>
      );
    }
    
    // Original logic for BarCharts
    return (
      <div className="p-2 bg-gray-800 bg-opacity-80 border border-gray-600 rounded-lg text-white text-sm">
        <p className="label">{`Data: ${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.fill }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<ClienteAgendamento[]>([]);
  const [messages, setMessages] = useState<ClienteMensagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [apptData, msgData] = await Promise.all([fetchAppointments(), fetchAllMessages()]);
        setAppointments(apptData);
        setMessages(msgData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
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

    // FIX: Calculate confirmations based only on client interactions to ensure consistency with the pie chart.
    const confirmations = clientInteractions.filter(a => a.status?.toLowerCase() === 'confirmado').length;
    
    const uniqueClients = new Set(messages.map(m => m.whatsapp)).size;

    const statusCounts = clientInteractions.reduce((acc, curr) => {
        if (curr.status) {
            let statusKey = curr.status.charAt(0).toUpperCase() + curr.status.slice(1).toLowerCase();
            // FIX: Normalize 'Desmarcados' to 'Desmarcado' for color consistency
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


  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">Carregando...</div>;
  }
  
  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Total de Agendamentos (IA)" value={totalAppointments.toString()} color="violet" />
            <Card title="Total de Clientes Atendidos" value={totalUniqueClients.toString()} color="blue" />
            <Card title="Agendamentos Confirmados" value={totalConfirmations.toString()} color="emerald" />
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
    </div>
  );
};