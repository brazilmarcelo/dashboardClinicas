import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchAgendamentos } from '../services/mockApi';
import type { ClienteAgendamento } from '../types';
import { MetricCard } from './ui/Card';
import { CalendarIcon, UsersIcon, CheckCircleIcon } from '../constants';

const CHART_COLORS = {
  agendamentos: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-xl text-sm">
      {label && <p className="text-slate-500 dark:text-gray-400 mb-2 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value?.toLocaleString('pt-BR')}</span>
        </p>
      ))}
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-content-dark border border-slate-200 dark:border-white/5 rounded-2xl p-6 ${className}`}>
    <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const isSameMonth = (date: Date, now: Date) =>
  date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

const isSameWeek = (date: Date, now: Date) => {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start;
};

export const AppointmentsView: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<ClienteAgendamento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    fetchAgendamentos()
      .then(setAgendamentos)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = agendamentos.filter(a => a.datacriacao && isSameMonth(new Date(a.datacriacao), now)).length;
    const thisWeek  = agendamentos.filter(a => a.datacriacao && isSameWeek(new Date(a.datacriacao), now)).length;

    const medicoMap = new Map<string, number>();
    agendamentos.forEach(a => {
      if (a.nomemedico) medicoMap.set(a.nomemedico, (medicoMap.get(a.nomemedico) || 0) + 1);
    });
    const topMedico = Array.from(medicoMap.entries()).sort((a, b) => b[1] - a[1])[0];

    return { total: agendamentos.length, thisMonth, thisWeek, topMedico };
  }, [agendamentos]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);

    agendamentos.forEach(a => {
      if (!a.datacriacao) return;
      const dt = new Date(a.datacriacao);
      if (dt < cutoff) return;
      const key = dt.toISOString().split('T')[0];
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, agendamentos]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        agendamentos,
      }));
  }, [agendamentos]);

  const byMedico = useMemo(() => {
    const map = new Map<string, number>();
    agendamentos.forEach(a => {
      if (a.nomemedico) map.set(a.nomemedico, (map.get(a.nomemedico) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([medico, total]) => ({ medico: medico.split(' ').slice(0, 2).join(' '), total }));
  }, [agendamentos]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-content-dark rounded-2xl h-28 border border-slate-200 dark:border-white/5" />
      ))}
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-rose-400">Erro ao carregar agendamentos: {error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Agendados via IA"
          value={metrics.total.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="w-5 h-5" />}
          color="violet"
        />
        <MetricCard
          title="Este Mês"
          value={metrics.thisMonth.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="w-5 h-5" />}
          color="sky"
        />
        <MetricCard
          title="Esta Semana"
          value={metrics.thisWeek.toLocaleString('pt-BR')}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard
          title="Médico Top"
          value={metrics.topMedico ? metrics.topMedico[0].split(' ').slice(0, 2).join(' ') : '—'}
          icon={<UsersIcon className="w-5 h-5" />}
          color="amber"
          badge={metrics.topMedico ? `${metrics.topMedico[1]}` : undefined}
        />
      </div>

      {/* Trend diária */}
      <ChartCard title="Agendamentos por Dia — Últimos 60 dias">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="gAgend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.agendamentos} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.agendamentos} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} />
            <YAxis fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="agendamentos"
              name="Agendamentos"
              stroke={CHART_COLORS.agendamentos}
              fill="url(#gAgend)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Por médico */}
      <ChartCard title="Agendamentos por Médico — Top 10">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byMedico} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis dataKey="medico" type="category" width={120} fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Agendamentos" fill={CHART_COLORS.agendamentos} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Tabela recentes */}
      <div className="bg-white dark:bg-content-dark border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Agendamentos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Agendamento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.slice(0, 25).map((a, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-slate-800 dark:text-gray-200 font-medium">{a.nomecliente || a.pushname || '—'}</td>
                  <td className="px-6 py-3 text-gray-400">{a.nomemedico?.split(' ').slice(0, 2).join(' ') || '—'}</td>
                  <td className="px-6 py-3 text-slate-400 dark:text-gray-500 text-xs">{a.whatsapp || '—'}</td>
                  <td className="px-6 py-3 text-slate-500 dark:text-gray-400 text-xs">
                    {a.dataagendamento
                      ? new Date(a.dataagendamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-400 dark:text-gray-500 text-xs">
                    {a.datacriacao
                      ? new Date(a.datacriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agendamentos.length > 25 && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-xs text-gray-600">Mostrando 25 de {agendamentos.length} agendamentos</p>
          </div>
        )}
      </div>
    </div>
  );
};
