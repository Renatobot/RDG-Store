import { useState, useMemo } from 'react';
import axios from 'axios';
import { PackagePlus, Trash2, Search, ChevronDown, ChevronUp, Package, CheckCircle, XCircle, Copy, Eye, EyeOff } from 'lucide-react';

export default function StockManager({ products, credentials, onSuccess }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [multiplier, setMultiplier] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Filtros da listagem
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'free' | 'used'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
  const hasVariations = selectedProduct?.hasVariations;

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return alert('Selecione um produto.');
    if (hasVariations && !selectedVariationId) return alert('Selecione uma variação.');
    if (!login.trim() && !password.trim() && !notes.trim()) return alert('Preencha pelo menos um campo de credencial.');
    if (multiplier < 1 || multiplier > 99) return alert('O multiplicador deve ser entre 1 e 99.');

    setIsSubmitting(true);
    try {
      const credObj = { login: login.trim(), password: password.trim(), notes: notes.trim() };
      const contentString = JSON.stringify(credObj);
      const contents = Array.from({ length: multiplier }).fill(contentString);

      await axios.post('https://streaming-store-api.onrender.com/api/credentials', {
        productId: selectedProductId,
        variationId: hasVariations ? selectedVariationId : null,
        contents
      });

      alert(`✅ ${contents.length} credencial(is) adicionada(s) com sucesso!`);
      setLogin(''); setPassword(''); setNotes(''); setMultiplier(1);
      onSuccess();
    } catch (err) {
      alert('Erro ao adicionar estoque. Verifique os dados e tente novamente.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta credencial?')) return;
    try {
      await axios.delete(`https://streaming-store-api.onrender.com/api/credentials/${id}`);
      onSuccess();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  // Agrupa credenciais por produto
  const grouped = useMemo(() => {
    let filtered = credentials;
    if (filterProduct) filtered = filtered.filter(c => c.productId === parseInt(filterProduct));
    if (filterStatus === 'free') filtered = filtered.filter(c => !c.isUsed);
    if (filterStatus === 'used') filtered = filtered.filter(c => c.isUsed);
    if (searchQuery) filtered = filtered.filter(c => {
      try { const p = JSON.parse(c.content); return (p.login + p.password + p.notes).toLowerCase().includes(searchQuery.toLowerCase()); } catch { return c.content.toLowerCase().includes(searchQuery.toLowerCase()); }
    });

    const groups = {};
    filtered.forEach(cred => {
      const key = cred.product?.id || 'unknown';
      if (!groups[key]) groups[key] = { product: cred.product, items: [] };
      groups[key].items.push(cred);
    });
    return Object.values(groups);
  }, [credentials, filterProduct, filterStatus, searchQuery]);

  const totalFree = credentials.filter(c => !c.isUsed).length;
  const totalUsed = credentials.filter(c => c.isUsed).length;

  const toggleGroup = (id) => setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const parseContent = (content) => {
    try { return JSON.parse(content); } catch { return { login: content, password: '', notes: '' }; }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">

      {/* ====== FORMULÁRIO ====== */}
      <div className="w-full xl:w-80 shrink-0">
        <div className="bg-gradient-to-br from-black/60 to-card/30 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <PackagePlus size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Adicionar Estoque</h3>
              <p className="text-gray-500 text-xs">Preencha os dados do acesso</p>
            </div>
          </div>

          <form onSubmit={handleSaveStock} className="p-5 space-y-4">
            {/* Produto */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Produto</label>
              <select
                value={selectedProductId}
                onChange={e => { setSelectedProductId(e.target.value); setSelectedVariationId(''); }}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">-- Selecione --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Variação */}
            {hasVariations && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plano / Variação</label>
                <select
                  value={selectedVariationId}
                  onChange={e => setSelectedVariationId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- Selecione --</option>
                  {selectedProduct?.variations?.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — R$ {(v.price / 100).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-white/5 my-1" />

            {/* Login */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                📧 Login / Email / Link
              </label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Ex: usuario@email.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                🔐 Senha / PIN / Código
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ex: Senha@123"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                📝 Observações (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Não altere a senha. Perfil 2."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors h-20 resize-none"
              />
            </div>

            {/* Multiplicador */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                ✖️ Multiplicar por (1 a 99)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={multiplier}
                onChange={e => setMultiplier(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1.5">Útil para contas que podem ser vendidas várias vezes (ex: links de convite).</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PackagePlus size={16} />
              {isSubmitting ? 'Salvando...' : 'Alimentar Estoque'}
            </button>
          </form>
        </div>
      </div>

      {/* ====== LISTAGEM ====== */}
      <div className="flex-1 min-w-0">
        {/* Header + Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{credentials.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{totalFree}</div>
            <div className="text-xs text-gray-500 mt-0.5">Disponíveis</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{totalUsed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Vendidos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-44">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar login, senha..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Todos os produtos</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-1 bg-black/50 border border-white/10 rounded-xl p-1">
            {[['all', 'Todos'], ['free', 'Livres'], ['used', 'Vendidos']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterStatus === val ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Grupos de produtos */}
        <div className="space-y-3">
          {grouped.length === 0 && (
            <div className="text-center py-12 text-gray-600 bg-black/20 rounded-2xl border border-white/5">
              <Package size={36} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma credencial encontrada.</p>
            </div>
          )}
          {grouped.map(group => {
            const productId = group.product?.id || 'unknown';
            const isExpanded = expandedGroups[productId] !== false; // expanded by default
            const freeCount = group.items.filter(c => !c.isUsed).length;
            const usedCount = group.items.filter(c => c.isUsed).length;

            return (
              <div key={productId} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(productId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-sm">{group.product?.name || 'Produto Removido'}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-green-400 text-xs font-medium">{freeCount} livre{freeCount !== 1 ? 's' : ''}</span>
                        <span className="text-gray-600 text-xs">•</span>
                        <span className="text-red-400 text-xs">{usedCount} vendido{usedCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{group.items.length} total</span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </button>

                {/* Credential Items */}
                {isExpanded && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {group.items.map(cred => {
                      const parsed = parseContent(cred.content);
                      return (
                        <div key={cred.id} className={`px-5 py-3 flex items-start gap-4 ${cred.isUsed ? 'opacity-60' : 'hover:bg-white/[0.02]'} transition-colors`}>
                          {/* Status icon */}
                          <div className="mt-0.5 shrink-0">
                            {cred.isUsed
                              ? <XCircle size={16} className="text-red-500" />
                              : <CheckCircle size={16} className="text-green-500" />
                            }
                          </div>

                          {/* Credential info */}
                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {cred.variation && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-600">Plano: </span>
                                <span className="text-gray-400 font-medium">{cred.variation?.name}</span>
                              </div>
                            )}
                            {parsed.login && (
                              <div className="flex items-center gap-1 group/copy">
                                <span className="text-gray-600 shrink-0">📧</span>
                                <span className="text-gray-300 font-mono truncate">{parsed.login}</span>
                                <button onClick={() => copyToClipboard(parsed.login)} className="opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0">
                                  <Copy size={10} className="text-gray-500 hover:text-primary" />
                                </button>
                              </div>
                            )}
                            {parsed.password && (
                              <div className="flex items-center gap-1 group/copy">
                                <span className="text-gray-600 shrink-0">🔐</span>
                                <span className="text-gray-300 font-mono truncate">{parsed.password}</span>
                                <button onClick={() => copyToClipboard(parsed.password)} className="opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0">
                                  <Copy size={10} className="text-gray-500 hover:text-primary" />
                                </button>
                              </div>
                            )}
                            {parsed.notes && (
                              <div className="sm:col-span-2 flex items-start gap-1 text-gray-500 mt-0.5">
                                <span className="shrink-0">📝</span>
                                <span className="truncate">{parsed.notes}</span>
                              </div>
                            )}
                            {cred.orderId && (
                              <div className="sm:col-span-2 text-gray-600 mt-0.5">Pedido: #{cred.orderId + 31794}</div>
                            )}
                          </div>

                          {/* Delete button */}
                          <div className="shrink-0">
                            {!cred.isUsed ? (
                              <button
                                onClick={() => handleDelete(cred.id)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold uppercase">Vendido</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
