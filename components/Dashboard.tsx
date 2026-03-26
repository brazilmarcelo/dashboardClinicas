import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { fetchDisparos, fetchAgendamentos, fetchPacientes } from '../services/mockApi';
import type { DisparoAgendamento, ClienteAgendamento, ClienteStatus } from '../types';
import { MetricCard } from './ui/Card';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon, UsersIcon } from '../constants';

const CHART_COLORS = {
  confirmados: '#10b981',
  cancelados:  '#f43f5e',
  semResposta: '#475569',
  agendamentos:'#8b5cf6',
  total:       '#38bdf8',
};

const contarLembretes = (d: DisparoAgendamento): number => {
  let n = 0;
  if (d.datalembrete1) n++;
  if (d.datalembrete2) n++;
  if (d.datalembrete3) n++;
  if (d.datalembrete4) n++;
  if (n === 0 && d.datahoradisparo) return 1;
  return n;
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

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-content-dark rounded-2xl h-28 border border-white/5" />
      ))}
    </div>
    <div className="bg-white dark:bg-content-dark rounded-2xl h-72 border border-slate-200 dark:border-white/5" />
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="bg-white dark:bg-content-dark rounded-2xl h-64 border border-slate-200 dark:border-white/5 lg:col-span-2" />
      <div className="bg-white dark:bg-content-dark rounded-2xl h-64 border border-slate-200 dark:border-white/5 lg:col-span-3" />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [disparos, setDisparos]       = useState<DisparoAgendamento[]>([]);
  const [agendamentos, setAgendamentos] = useState<ClienteAgendamento[]>([]);
  const [pacientes, setPacientes]     = useState<ClienteStatus[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDisparos(), fetchAgendamentos(), fetchPacientes()])
      .then(([d, a, p]) => { setDisparos(d); setAgendamentos(a); setPacientes(p); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const agendamentos   = disparos.length;
    const totalMensagens = disparos.reduce((acc, d) => acc + contarLembretes(d), 0);
    const conf = disparos.filter(d => d.confirmoucancelou === 'confirmado').length;
    const canc = disparos.filter(d => d.confirmoucancelou === 'cancelado').length;
    const sem  = agendamentos - conf - canc;
    return {
      agendamentos,
      totalMensagens,
      conf,
      canc,
      sem,
      taxaConf: agendamentos > 0 ? ((conf / agendamentos) * 100).toFixed(1) : '0',
      taxaCanc: agendamentos > 0 ? ((canc / agendamentos) * 100).toFixed(1) : '0',
      taxaSem:  agendamentos > 0 ? ((sem  / agendamentos) * 100).toFixed(1) : '0',
    };
  }, [disparos]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { date: string; total: number; confirmados: number; cancelados: number }>();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    disparos.forEach(d => {
      if (!d.datahoradisparo) return;
      const dt = new Date(d.datahoradisparo);
      if (dt < cutoff) return;
      const key = dt.toISOString().split('T')[0];
      const e = map.get(key) || { date: key, total: 0, confirmados: 0, cancelados: 0 };
      e.total++;
      if (d.confirmoucancelou === 'confirmado') e.confirmados++;
      else if (d.confirmoucancelou === 'cancelado') e.cancelados++;
      map.set(key, e);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }));
  }, [disparos]);

  const distributionData = useMemo(() => [
    { name: 'Confirmados', value: metrics.conf, fill: CHART_COLORS.confirmados },
    { name: 'Cancelados',  value: metrics.canc, fill: CHART_COLORS.cancelados },
    { name: 'Sem Resposta',value: metrics.sem,  fill: CHART_COLORS.semResposta },
  ].filter(d => d.value > 0), [metrics]);

  const topMedicos = useMemo(() => {
    const map = new Map<string, number>();
    agendamentos.forEach(a => {
      if (a.nomemedico) map.set(a.nomemedico, (map.get(a.nomemedico) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([medico, total]) => ({ medico: medico.split(' ').slice(0, 2).join(' '), total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [agendamentos]);

  const lembreteStats = useMemo(() => {
    const map = new Map<number, { tipo: number; confirmados: number; cancelados: number; semResposta: number }>();
    disparos.forEach(d => {
      const tipo = d.tipolembrete;
      if (!tipo) return;
      const e = map.get(tipo) || { tipo, confirmados: 0, cancelados: 0, semResposta: 0 };
      if (d.confirmoucancelou === 'confirmado') e.confirmados++;
      else if (d.confirmoucancelou === 'cancelado') e.cancelados++;
      else e.semResposta++;
      map.set(tipo, e);
    });
    return Array.from(map.values())
      .sort((a, b) => a.tipo - b.tipo)
      .map(e => ({ ...e, name: `Lembrete ${e.tipo}` }));
  }, [disparos]);

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <XCircleIcon className="w-10 h-10 text-rose-400" />
      <p className="text-gray-400">Erro ao carregar dados</p>
      <p className="text-xs text-gray-600">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Mensagens Enviadas"
          value={metrics.totalMensagens.toLocaleString('pt-BR')}
          icon={<BellIcon className="w-5 h-5" />}
          color="sky"
          badge={`${metrics.agendamentos} agend.`}
        />
        <MetricCard
          title="Confirmados"
          value={metrics.conf.toLocaleString('pt-BR')}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          color="emerald"
          badge={`${metrics.taxaConf}%`}
        />
        <MetricCard
          title="Cancelados"
          value={metrics.canc.toLocaleString('pt-BR')}
          icon={<XCircleIcon className="w-5 h-5" />}
          color="rose"
          badge={`${metrics.taxaCanc}%`}
        />
        <MetricCard
          title="Sem Resposta"
          value={metrics.sem.toLocaleString('pt-BR')}
          icon={<ClockIcon className="w-5 h-5" />}
          color="amber"
          badge={`${metrics.taxaSem}%`}
        />
        <MetricCard
          title="Agendamentos via IA"
          value={agendamentos.length.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="w-5 h-5" />}
          color="violet"
        />
        <MetricCard
          title="Pacientes Atendidos"
          value={pacientes.length.toLocaleString('pt-BR')}
          icon={<UsersIcon className="w-5 h-5" />}
          color="violet"
        />
      </div>

      {/* Trend diária */}
      <ChartCard title="Disparos Diários — Últimos 30 dias">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyTrend}>
            <defs>
              <linearGradient id="gConf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.confirmados} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.confirmados} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCanc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.cancelados} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.cancelados} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.total} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} />
            <YAxis fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Area type="monotone" dataKey="total"       name="Total"       stroke={CHART_COLORS.total}       fill="url(#gTotal)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="confirmados" name="Confirmados" stroke={CHART_COLORS.confirmados} fill="url(#gConf)"  strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="cancelados"  name="Cancelados"  stroke={CHART_COLORS.cancelados}  fill="url(#gCanc)"  strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Distribuição + Top Médicos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCard title="Distribuição de Respostas" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${((percent as number) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {distributionData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Médicos — Agendamentos" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topMedicos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis dataKey="medico" type="category" width={110} fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Agendamentos" fill={CHART_COLORS.agendamentos} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Efetividade por lembrete */}
      {lembreteStats.length > 0 && (
        <ChartCard title="Efetividade por Tipo de Lembrete">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lembreteStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="confirmados"  name="Confirmados"  fill={CHART_COLORS.confirmados} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelados"   name="Cancelados"   fill={CHART_COLORS.cancelados}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="semResposta"  name="Sem Resposta" fill={CHART_COLORS.semResposta}  radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};
