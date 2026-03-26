import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { fetchPacientes } from '../services/mockApi';
import type { ClienteStatus } from '../types';
import { MetricCard } from './ui/Card';
import { UsersIcon, CheckCircleIcon, TrendUpIcon } from '../constants';

const CHART_COLORS = {
  ativos:    '#10b981',
  inativos:  '#475569',
  interacao: '#38bdf8',
};

const ETAPA_COLORS = [
  '#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#06b6d4',
];

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

export const PacientesView: React.FC = () => {
  const [pacientes, setPacientes] = useState<ClienteStatus[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    fetchPacientes()
      .then(setPacientes)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const d7  = new Date(now); d7.setDate(d7.getDate() - 7);

    const ativos30 = pacientes.filter(p => new Date(p.ultimainteracao) >= d30).length;
    const ativos7  = pacientes.filter(p => new Date(p.ultimainteracao) >= d7).length;

    return { total: pacientes.length, ativos30, ativos7 };
  }, [pacientes]);

  const dailyInteracoes = useMemo(() => {
    const map = new Map<string, number>();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);

    pacientes.forEach(p => {
      if (!p.ultimainteracao) return;
      const dt = new Date(p.ultimainteracao);
      if (dt < cutoff) return;
      const key = dt.toISOString().split('T')[0];
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, pacientes]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        pacientes,
      }));
  }, [pacientes]);

  const byEtapa = useMemo(() => {
    const map = new Map<string, number>();
    pacientes.forEach(p => {
      const key = p.etapa !== null && p.etapa !== undefined ? `Etapa ${p.etapa}` : 'Sem Etapa';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([etapa, total], i) => ({ etapa, total, fill: ETAPA_COLORS[i % ETAPA_COLORS.length] }));
  }, [pacientes]);

  const byFollowup = useMemo(() => {
    const map = new Map<string, number>();
    pacientes.forEach(p => {
      const key = p.etapafollowup !== null && p.etapafollowup !== undefined ? `Follow-up ${p.etapafollowup}` : 'Sem Follow-up';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([etapa, total]) => ({ etapa, total }));
  }, [pacientes]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-content-dark rounded-2xl h-28 border border-slate-200 dark:border-white/5" />
      ))}
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-rose-400">Erro ao carregar pacientes: {error}</p>
    </div>
  );

  const taxaAtivos = metrics.total > 0 ? ((metrics.ativos30 / metrics.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total de Pacientes Atendidos"
          value={metrics.total.toLocaleString('pt-BR')}
          icon={<UsersIcon className="w-5 h-5" />}
          color="sky"
        />
        <MetricCard
          title="Ativos (últimos 30 dias)"
          value={metrics.ativos30.toLocaleString('pt-BR')}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          color="emerald"
          badge={`${taxaAtivos}%`}
        />
        <MetricCard
          title="Interagidos esta semana"
          value={metrics.ativos7.toLocaleString('pt-BR')}
          icon={<TrendUpIcon className="w-5 h-5" />}
          color="violet"
        />
      </div>

      {/* Interações por dia */}
      <ChartCard title="Interações Diárias de Pacientes — Últimos 60 dias">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyInteracoes}>
            <defs>
              <linearGradient id="gInter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.interacao} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.interacao} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} />
            <YAxis fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pacientes"
              name="Pacientes"
              stroke={CHART_COLORS.interacao}
              fill="url(#gInter)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Por etapa + Por follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribuição por Etapa">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={byEtapa}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
                dataKey="total"
                nameKey="etapa"
                label={({ etapa, percent }) => `${etapa} ${((percent as number) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {byEtapa.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por Etapa de Follow-up">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byFollowup} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis dataKey="etapa" type="category" width={100} fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Pacientes" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabela de pacientes recentes */}
      <div className="bg-white dark:bg-content-dark border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pacientes Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Interação</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Etapa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.slice(0, 25).map((p, i) => {
                const diasSemInteracao = Math.floor(
                  (Date.now() - new Date(p.ultimainteracao).getTime()) / (1000 * 60 * 60 * 24)
                );
                const isAtivo = diasSemInteracao <= 30;
                return (
                  <tr key={i} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-slate-800 dark:text-gray-200 font-medium">{p.nome || p.pushname || '—'}</td>
                    <td className="px-6 py-3 text-slate-400 dark:text-gray-500 text-xs">{p.whatsapp || '—'}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-gray-400 text-xs">
                      {new Date(p.ultimainteracao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-slate-400 dark:text-gray-500 text-xs">{p.etapa ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isAtivo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {isAtivo ? 'Ativo' : `${diasSemInteracao}d atrás`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pacientes.length > 25 && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-xs text-gray-600">Mostrando 25 de {pacientes.length} pacientes</p>
          </div>
        )}
      </div>
    </div>
  );
};
