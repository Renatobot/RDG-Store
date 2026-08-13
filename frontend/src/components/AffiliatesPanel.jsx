import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, TrendingUp, ShoppingBag, Wallet, Copy, CheckCircle, ChevronDown, ChevronUp, Search, Link2, ExternalLink } from 'lucide-react';

const fmtR = c => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
const inp = "w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors";

export default function AffiliatesPanel() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalSalesGenerated'); // 'totalReferrals' | 'activeReferrals' | 'totalSalesGenerated' | 'walletBalance'
  const [expanded, setExpanded] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://streaming-store-api.onrender.com/api/admin/affiliates');
      setAffiliates(res.data);
    } catch (err) {
      setError('Erro ao carregar afiliados.');
    }
    setLoading(false);
  };

  const copyLink = (code, id) => {
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = affiliates
    .filter(a => {
      const s = search.toLowerCase();
      return !s || a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || a.affiliateCode.toLowerCase().includes(s);
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  // Totais globais
  const totalAffiliates = affiliates.length;
  const totalReferrals = affiliates.reduce((s, a) => s + a.totalReferrals, 0);
  const totalActive = affiliates.reduce((s, a) => s + a.activeReferrals, 0);
  const totalSales = affiliates.reduce((s, a) => s + a.totalSalesGenerated, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-500">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mr-3" />
      Carregando afiliados...
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-center">{error}</div>
  );

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20}/>, label: 'Afiliados Ativos', value: totalAffiliates, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: <Link2 size={20}/>, label: 'Clientes Indicados', value: totalReferrals, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { icon: <CheckCircle size={20}/>, label: 'Clientes Ativos', value: totalActive, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { icon: <TrendingUp size={20}/>, label: 'Vendas Geradas', value: fmtR(totalSales), color: 'text-primary', bg: 'bg-primary/10 border-primary/20', big: true },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border rounded-2xl p-5`}>
            <div className={`${card.color} mb-3`}>{card.icon}</div>
            <div className={`font-black ${card.big ? 'text-xl' : 'text-3xl'} text-white`}>{card.value}</div>
            <div className="text-gray-500 text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou código..." className={`${inp} pl-9`} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`${inp} w-auto`}>
          <option value="totalSalesGenerated">Ordenar: Mais vendas</option>
          <option value="totalReferrals">Ordenar: Mais indicados</option>
          <option value="activeReferrals">Ordenar: Mais ativos</option>
          <option value="walletBalance">Ordenar: Maior saldo</option>
        </select>
        <button onClick={fetchAffiliates} className="bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">↻ Atualizar</button>
      </div>

      {/* ── Lista de Afiliados ──────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600 bg-black/20 rounded-2xl border border-white/5">
          <Users size={36} className="mx-auto mb-3 opacity-20" />
          <p>Nenhum afiliado encontrado.</p>
          <p className="text-xs mt-2 text-gray-700">Os usuários se tornam afiliados ao gerar seu código de indicação no painel deles.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(aff => {
          const affLink = `${window.location.origin}/?ref=${aff.affiliateCode}`;
          const isExpanded = expanded[aff.id];
          const convRate = aff.totalReferrals > 0 ? Math.round((aff.activeReferrals / aff.totalReferrals) * 100) : 0;

          return (
            <div key={aff.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
              {/* Header do afiliado */}
              <div className="px-5 py-4 flex flex-wrap items-center gap-4">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 border border-primary/20">
                    {aff.avatarUrl ? <img src={aff.avatarUrl} alt={aff.name} className="w-full h-full object-cover" /> : aff.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      {aff.name}
                      {aff.isVip && <span className="text-yellow-400 text-[10px]">👑 VIP</span>}
                    </div>
                    <div className="text-gray-500 text-xs truncate">{aff.email}</div>
                  </div>
                </div>

                {/* Stats inline */}
                <div className="hidden sm:flex items-center gap-6 text-center">
                  <div>
                    <div className="text-white font-black text-lg">{aff.totalReferrals}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Indicados</div>
                  </div>
                  <div>
                    <div className="text-green-400 font-black text-lg">{aff.activeReferrals}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Ativos</div>
                  </div>
                  <div>
                    <div className="text-primary font-black text-lg">{fmtR(aff.totalSalesGenerated)}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Vendas</div>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-black text-lg">{fmtR(aff.walletBalance)}</div>
                    <div className="text-gray-600 text-[10px] uppercase tracking-wider">Saldo</div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyLink(aff.affiliateCode, aff.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${copiedId === aff.id ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'}`}
                    title="Copiar link de afiliado"
                  >
                    {copiedId === aff.id ? <><CheckCircle size={12}/> Copiado!</> : <><Copy size={12}/> Copiar Link</>}
                  </button>
                  <a href={affLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 text-gray-500 hover:text-white rounded-lg transition-colors border border-white/10" title="Abrir link">
                    <ExternalLink size={14}/>
                  </a>
                  <button onClick={() => toggleExpand(aff.id)} className="p-2 hover:bg-white/10 text-gray-500 hover:text-white rounded-lg transition-colors border border-white/10">
                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                </div>
              </div>

              {/* Link de afiliado */}
              <div className="px-5 pb-3 -mt-1">
                <div className="bg-black/50 border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Link2 size={12} className="text-primary shrink-0" />
                  <span className="text-xs text-gray-400 font-mono truncate flex-1">{affLink}</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-black shrink-0">{aff.affiliateCode}</span>
                </div>
                {/* Taxa de conversão */}
                {aff.totalReferrals > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all" style={{ width: `${convRate}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{convRate}% conversão</span>
                  </div>
                )}
              </div>

              {/* Stats mobile */}
              <div className="sm:hidden grid grid-cols-4 gap-3 px-5 pb-4 pt-1">
                {[['Indicados', aff.totalReferrals, 'text-white'], ['Ativos', aff.activeReferrals, 'text-green-400'], ['Vendas', fmtR(aff.totalSalesGenerated), 'text-primary'], ['Saldo', fmtR(aff.walletBalance), 'text-yellow-400']].map(([lbl, val, color]) => (
                  <div key={lbl} className="text-center bg-black/30 rounded-xl p-2">
                    <div className={`${color} font-black text-sm`}>{val}</div>
                    <div className="text-gray-600 text-[10px]">{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Detalhes dos indicados */}
              {isExpanded && (
                <div className="border-t border-white/5 px-5 py-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Clientes Indicados ({aff.referrals.length})</h4>
                  {aff.referrals.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">Este afiliado ainda não indicou nenhum cliente.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {aff.referrals.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-3">
                          <div>
                            <div className="text-white text-xs font-bold">{ref.name}</div>
                            <div className="text-gray-600 text-[11px]">{ref.email} · Cadastro: {new Date(ref.createdAt).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div className="text-right shrink-0">
                            {ref.orderCount > 0 ? (
                              <>
                                <div className="text-green-400 text-xs font-black">{fmtR(ref.totalSpent)}</div>
                                <div className="text-gray-600 text-[10px]">{ref.orderCount} pedido(s)</div>
                              </>
                            ) : (
                              <span className="text-gray-700 text-[11px] bg-white/5 px-2 py-0.5 rounded">Sem compras</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
