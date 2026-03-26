import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchDisparos } from '../services/mockApi';
import type { DisparoAgendamento } from '../types';
import { MetricCard } from './ui/Card';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChartBarIcon } from '../constants';

const COLORS = {
  disparados:  '#38bdf8',
  confirmados: '#10b981',
  cancelados:  '#f43f5e',
  semResposta: '#94a3b8',
};

// Conta quantas mensagens foram efetivamente enviadas para o agendamento.
// Prioriza os campos datalembrete1/2/3/4. Se nenhum estiver preenchido mas
// datahoradisparo existir, conta 1 (o disparo inicial aconteceu).
const contarLembretes = (d: DisparoAgendamento): number => {
  let n = 0;
  if (d.datalembrete1) n++;
  if (d.datalembrete2) n++;
  if (d.datalembrete3) n++;
  if (d.datalembrete4) n++;
  if (n === 0 && d.datahoradisparo) return 1;
  return n;
};

// Retorna cada lembrete como ponto de data.
// Fallback: datahoradisparo quando nenhum datalembrete estiver preenchido.
const lembretesDaLinha = (d: DisparoAgendamento): { date: string; num: number }[] => {
  const items = [
    d.datalembrete1 ? { date: d.datalembrete1, num: 1 } : null,
    d.datalembrete2 ? { date: d.datalembrete2, num: 2 } : null,
    d.datalembrete3 ? { date: d.datalembrete3, num: 3 } : null,
    d.datalembrete4 ? { date: d.datalembrete4, num: 4 } : null,
  ].filter(Boolean) as { date: string; num: number }[];
  if (items.length === 0 && d.datahoradisparo) {
    items.push({ date: d.datahoradisparo, num: 1 });
  }
  return items;
};

// Calcula o dia da semana a partir da data real — não confia no campo diasemana do banco.
const getDowKey = (d: DisparoAgendamento): string | null => {
  const ref = d.datahoradisparo || d.datalembrete1 || d.dataagenda;
  if (!ref) return null;
  const keys = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return keys[new Date(ref).getDay()];
};

const toDateKey = (iso: string) => iso.split('T')[0];
const formatDay  = (key: string) =>
  new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-xl text-sm min-w-40">
      {label && <p className="text-slate-500 dark:text-gray-400 mb-2 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-bold">{p.value?.toLocaleString('pt-BR')}</span>
        </p>
      ))}
    </div>
  );
};

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-white dark:bg-content-dark border border-slate-200 dark:border-white/5 rounded-2xl p-6 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

type DateFilter = '7d' | '30d' | '90d' | 'all';
const FILTER_LABELS: Record<DateFilter, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias', 'all': 'Tudo' };
const DOW_ORDER = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const DisparosView: React.FC = () => {
  const [disparos, setDisparos] = useState<DisparoAgendamento[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<DateFilter>('30d');

  useEffect(() => {
    fetchDisparos()
      .then(setDisparos)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtra pelo primeiro disparo (datalembrete1 ou datahoradisparo)
  const filtered = useMemo(() => {
    if (filter === 'all') return disparos;
    const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return disparos.filter(d => {
      const ref = d.datalembrete1 || d.datahoradisparo;
      return ref && new Date(ref) >= cutoff;
    });
  }, [disparos, filter]);

  // KPIs com contagem correta de mensagens
  const metrics = useMemo(() => {
    const agendamentos   = filtered.length;
    const totalMensagens = filtered.reduce((acc, d) => acc + contarLembretes(d), 0);
    const conf = filtered.filter(d => d.confirmoucancelou === 'confirmado').length;
    const canc = filtered.filter(d => d.confirmoucancelou === 'cancelado').length;
    const sem  = agendamentos - conf - canc;
    const media = agendamentos > 0 ? (totalMensagens / agendamentos).toFixed(1) : '0';
    return {
      agendamentos, totalMensagens, conf, canc, sem, media,
      taxaConf: agendamentos > 0 ? ((conf / agendamentos) * 100).toFixed(1) : '0',
      taxaCanc: agendamentos > 0 ? ((canc / agendamentos) * 100).toFixed(1) : '0',
      taxaSem:  agendamentos > 0 ? ((sem  / agendamentos) * 100).toFixed(1) : '0',
    };
  }, [filtered]);

  // Gráfico dos últimos 30 dias — sempre 30 dias independente do filtro dos KPIs
  const daily30 = useMemo(() => {
    const map = new Map<string, { date: string; disparados: number; confirmados: number; cancelados: number; semResposta: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = toDateKey(d.toISOString());
      map.set(key, { date: key, disparados: 0, confirmados: 0, cancelados: 0, semResposta: 0 });
    }

    // Disparados: cada lembrete individual na data em que foi enviado
    disparos.forEach(row => {
      lembretesDaLinha(row).forEach(l => {
        const key = toDateKey(l.date);
        if (!map.has(key)) return;
        map.get(key)!.disparados++;
      });
    });

    // Confirmados/Cancelados: pela data da resposta do paciente
    disparos.forEach(row => {
      if (!row.dataconfirmoucancelou || !row.confirmoucancelou) return;
      const key = toDateKey(row.dataconfirmoucancelou);
      if (!map.has(key)) return;
      if (row.confirmoucancelou === 'confirmado') map.get(key)!.confirmados++;
      else if (row.confirmoucancelou === 'cancelado') map.get(key)!.cancelados++;
    });

    // Sem Resposta: disparados no dia sem resposta até hoje
    disparos.forEach(row => {
      if (row.confirmoucancelou) return;
      const ref = row.datalembrete1 || row.datahoradisparo;
      if (!ref) return;
      const key = toDateKey(ref);
      if (!map.has(key)) return;
      map.get(key)!.semResposta++;
    });

    return Array.from(map.values()).map(d => ({ ...d, date: formatDay(d.date) }));
  }, [disparos]);

  // Por dia da semana — calculado a partir da data real, não do campo diasemana
  const byDow = useMemo(() => {
    const map = new Map<string, { dow: string; disparados: number; confirmados: number; cancelados: number }>();
    DOW_ORDER.forEach(k => map.set(k, { dow: k.slice(0, 3), disparados: 0, confirmados: 0, cancelados: 0 }));

    filtered.forEach(row => {
      const key = getDowKey(row);
      if (!key || !map.has(key)) return;
      const e = map.get(key)!;
      e.disparados += contarLembretes(row);
      if (row.confirmoucancelou === 'confirmado') e.confirmados++;
      else if (row.confirmoucancelou === 'cancelado') e.cancelados++;
    });

    return Array.from(map.values());
  }, [filtered]);

  // Por tipo de lembrete
  const byLembrete = useMemo(() => {
    const map = new Map<number, { name: string; mensagens: number; confirmados: number; cancelados: number }>();

    filtered.forEach(row => {
      lembretesDaLinha(row).forEach(l => {
        const e = map.get(l.num) || { name: `Lembrete ${l.num}`, mensagens: 0, confirmados: 0, cancelados: 0 };
        e.mensagens++;
        map.set(l.num, e);
      });
      // Atribui resposta ao lembrete de número mais alto enviado (foi o que gerou a decisão)
      const max = contarLembretes(row);
      if (max > 0 && row.confirmoucancelou) {
        const e = map.get(max);
        if (e) {
          if (row.confirmoucancelou === 'confirmado') e.confirmados++;
          else if (row.confirmoucancelou === 'cancelado') e.cancelados++;
        }
      }
    });

    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  }, [filtered]);

  // Top 10 médicos
  const byMedico = useMemo(() => {
    const map = new Map<string, { medico: string; disparados: number; confirmados: number; cancelados: number }>();
    filtered.forEach(row => {
      if (!row.nomemedico) return;
      const e = map.get(row.nomemedico) || { medico: row.nomemedico, disparados: 0, confirmados: 0, cancelados: 0 };
      e.disparados += contarLembretes(row);
      if (row.confirmoucancelou === 'confirmado') e.confirmados++;
      else if (row.confirmoucancelou === 'cancelado') e.cancelados++;
      map.set(row.nomemedico, e);
    });
    return Array.from(map.values())
      .sort((a, b) => b.disparados - a.disparados)
      .slice(0, 10)
      .map(d => ({ ...d, medico: d.medico.split(' ').slice(0, 2).join(' ') }));
  }, [filtered]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-content-dark rounded-2xl h-28 border border-slate-200 dark:border-white/5" />
        ))}
      </div>
      <div className="bg-white dark:bg-content-dark rounded-2xl h-80 border border-slate-200 dark:border-white/5" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-rose-500">Erro ao carregar disparos: {error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-gray-500 font-medium mr-1">Período (KPIs e gráficos secundários):</span>
        {(Object.keys(FILTER_LABELS) as DateFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-content-dark border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          title="Média Lembretes / Agend."
          value={metrics.media}
          icon={<ChartBarIcon className="w-5 h-5" />}
          color="violet"
        />
      </div>

      {/* Gráfico dos últimos 30 dias — fixo, independente do filtro */}
      <ChartCard
        title="Últimos 30 dias — Disparos, Confirmações e Cancelamentos"
        subtitle="Barras = mensagens enviadas por data de cada lembrete  •  Linhas = resposta do paciente pela data de confirmação/cancelamento"
      >
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={daily30} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gDispBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.disparados} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLORS.disparados} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[stroke:#1e293b]" vertical={false} />
            <XAxis dataKey="date" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
            <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar      dataKey="disparados"  name="Disparados"   fill="url(#gDispBar)" stroke={COLORS.disparados} strokeWidth={1} radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="confirmados" name="Confirmados"  stroke={COLORS.confirmados} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="cancelados"  name="Cancelados"   stroke={COLORS.cancelados}  strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="semResposta" name="Sem Resposta" stroke={COLORS.semResposta} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Por dia da semana + Por lembrete */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Disparos por Dia da Semana" subtitle="Calculado pela data do disparo">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={byDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[stroke:#1e293b]" vertical={false} />
              <XAxis dataKey="dow" fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar  dataKey="disparados"  name="Disparados"  fill={COLORS.disparados}  opacity={0.7} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="confirmados" name="Confirmados" stroke={COLORS.confirmados} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cancelados"  name="Cancelados"  stroke={COLORS.cancelados}  strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Efetividade por Lembrete" subtitle="Mensagens enviadas e resposta no último lembrete do agendamento">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byLembrete}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[stroke:#1e293b]" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="mensagens"   name="Mensagens"   fill={COLORS.disparados}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="confirmados" name="Confirmados" fill={COLORS.confirmados} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelados"  name="Cancelados"  fill={COLORS.cancelados}  radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top médicos */}
      <ChartCard title="Top 10 Médicos — Mensagens Enviadas vs Respostas">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={byMedico} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[stroke:#1e293b]" horizontal={false} />
            <XAxis type="number" fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis dataKey="medico" type="category" width={120} fontSize={11} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="disparados"  name="Mensagens"   fill={COLORS.disparados}  opacity={0.5} />
            <Bar dataKey="confirmados" name="Confirmados" fill={COLORS.confirmados} radius={[0, 4, 4, 0]} />
            <Bar dataKey="cancelados"  name="Cancelados"  fill={COLORS.cancelados}  radius={[0, 4, 4, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Tabela recente */}
      <div className="bg-white dark:bg-content-dark border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Agendamentos Recentes</h3>
          <span className="text-xs text-slate-400 dark:text-gray-600">{filtered.length} registros no período</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                {['Paciente', 'Médico', 'Procedimento', 'Lembretes', 'Data Agenda', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map((d, i) => {
                const status = d.confirmoucancelou;
                const lembretes = contarLembretes(d);
                const statusStyle = status === 'confirmado'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : status === 'cancelado'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
                const statusLabel = status === 'confirmado' ? 'Confirmado' : status === 'cancelado' ? 'Cancelado' : 'Sem Resposta';
                return (
                  <tr key={i} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-800 dark:text-gray-200 font-medium">{d.nomepaciente || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-gray-400 text-xs">{d.nomemedico?.split(' ').slice(0, 2).join(' ') || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 dark:text-gray-500 text-xs max-w-[180px] truncate">{d.procedimento || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs font-bold text-sky-500">{lembretes}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 dark:text-gray-500 text-xs">
                      {d.dataagenda ? new Date(d.dataagenda).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle}`}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 25 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-400 dark:text-gray-600">Mostrando 25 de {filtered.length} agendamentos</p>
          </div>
        )}
      </div>
    </div>
  );
};
