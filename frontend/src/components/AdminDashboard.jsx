import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, ShoppingBag, Users, Clock, Award, DollarSign, BarChart2, Package } from 'lucide-react';

const fmt = (cents) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

function MiniChart({ data }) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data.map(d => d.revenue), 1);
  const last30 = data.slice(-30);
  
  return (
    <div className="w-full">
      <div className="flex items-end gap-[2px] h-32 w-full">
        {last30.map((day, i) => {
          const height = max > 0 ? Math.max((day.revenue / max) * 100, day.revenue > 0 ? 8 : 2) : 2;
          const isToday = i === last30.length - 1;
          const date = new Date(day.date + 'T12:00:00');
          const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute bottom-full mb-2 bg-gray-900 border border-white/10 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="font-bold">{label}</div>
                <div className="text-primary">{fmt(day.revenue)}</div>
              </div>
              <div
                className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-primary' : day.revenue > 0 ? 'bg-primary/50 group-hover:bg-primary/80' : 'bg-white/5'}`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-gray-600">
        <span>{new Date(last30[0]?.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
        <span>{new Date(last30[Math.floor(last30.length/2)]?.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://192.168.1.5:3001/api/stats')
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Carregando estatísticas...
      </div>
    </div>
  );

  if (!stats) return (
    <div className="text-center py-12 text-gray-500">Erro ao carregar estatísticas.</div>
  );

  const cards = [
    { label: 'Faturamento Hoje', value: fmt(stats.revenueToday), icon: <TrendingUp size={22} />, color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/30', iconColor: 'text-green-400' },
    { label: 'Faturamento do Mês', value: fmt(stats.revenueMonth), icon: <DollarSign size={22} />, color: 'from-primary/20 to-primary/5', border: 'border-primary/30', iconColor: 'text-primary' },
    { label: 'Faturamento Total', value: fmt(stats.totalRevenue), icon: <BarChart2 size={22} />, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30', iconColor: 'text-purple-400' },
    { label: 'Ticket Médio', value: fmt(stats.avgTicket), icon: <ShoppingBag size={22} />, color: 'from-yellow-500/20 to-yellow-500/5', border: 'border-yellow-500/30', iconColor: 'text-yellow-400' },
    { label: 'Pedidos Pagos', value: stats.totalOrders, icon: <Package size={22} />, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', iconColor: 'text-blue-400' },
    { label: 'Pedidos Pendentes', value: stats.pendingOrders, icon: <Clock size={22} />, color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', iconColor: 'text-orange-400' },
    { label: 'Total de Clientes', value: stats.totalCustomers, icon: <Users size={22} />, color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/30', iconColor: 'text-cyan-400' },
  ];

  const maxQty = Math.max(...(stats.topProducts?.map(p => p.quantity) || [1]), 1);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">📊 Visão Geral do Negócio</h3>
        <p className="text-gray-500 text-sm">Estatísticas em tempo real da sua loja</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:scale-[1.02]`}>
            <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center ${card.iconColor}`}>
              {card.icon}
            </div>
            <div>
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{card.label}</div>
              <div className="text-white text-xl font-black">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 className="text-white font-bold">Receita dos Últimos 30 Dias</h4>
              <p className="text-gray-500 text-xs">Vendas pagas e entregues</p>
            </div>
          </div>
          <MiniChart data={stats.dailyRevenue} />
        </div>

        <div className="lg:col-span-2 bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Award size={18} />
            </div>
            <div>
              <h4 className="text-white font-bold">Produtos Mais Vendidos</h4>
              <p className="text-gray-500 text-xs">Ranking por quantidade</p>
            </div>
          </div>
          
          {stats.topProducts?.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Nenhum produto vendido ainda.</p>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>#{i + 1}</span>
                      <span className="text-white text-sm font-medium truncate max-w-[140px]">{p.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs shrink-0">{p.quantity}x</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : 'bg-primary/60'}`} style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
