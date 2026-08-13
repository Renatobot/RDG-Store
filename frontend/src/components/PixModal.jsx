import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrCode, Copy, Check, Clock, CheckCircle2, ShieldCheck, ExternalLink, X } from 'lucide-react';

export default function PixModal({
  isOpen,
  onClose,
  orderId,
  amount,
  qrCode,
  qrCodeBase64,
  paymentUrl,
  onPaidSuccess,
  isRecharge = false
}) {
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos

  // Timer de expiração
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaid]);

  // Polling em tempo real para verificar se o pagamento foi aprovado
  useEffect(() => {
    if (!isOpen || !orderId || isPaid) return;

    const checkInterval = setInterval(async () => {
      try {
        const res = await axios.get(`https://backend-pink-one-92.vercel.app/api/orders/${orderId}/status`);
        if (res.data && res.data.isPaid) {
          setIsPaid(true);
          clearInterval(checkInterval);
          setTimeout(() => {
            if (onPaidSuccess) onPaidSuccess(res.data);
          }, 2000);
        }
      } catch (err) {
        // Silencioso no polling
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [isOpen, orderId, isPaid, onPaidSuccess]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const imageSrc = qrCodeBase64
    ? (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`)
    : (qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}` : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121318] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Botão Fechar */}
        {!isPaid && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {isPaid ? (
          /* TELA DE SUCESSO / APROVADO */
          <div className="text-center py-6 space-y-4 animate-scaleUp">
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={44} className="animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white">Pagamento Aprovado!</h3>
            <p className="text-sm text-gray-400">
              {isRecharge
                ? 'O seu saldo foi creditado na sua carteira com sucesso!'
                : 'Seu acesso foi liberado e o produto já está disponível no seu painel!'}
            </p>
            <div className="pt-2 text-xs text-primary font-bold animate-pulse">
              Redirecionando em instantes...
            </div>
          </div>
        ) : (
          /* TELA DE PAGAMENTO PIX */
          <div className="space-y-5 relative z-10">
            
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-2">
                <QrCode size={13} /> {isRecharge ? 'Recarga de Saldo' : 'Pagamento Pix'}
              </div>
              <h3 className="text-xl font-black text-white">Escaneie o QR Code</h3>
              <p className="text-xs text-gray-400 mt-1">Pague pelo app do seu banco e receba instantaneamente</p>
            </div>

            {/* Valor & Timer */}
            <div className="flex items-center justify-between bg-black/40 border border-white/5 p-3.5 rounded-2xl">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total a Pagar</div>
                <div className="text-xl font-black text-primary">
                  {amount ? `R$ ${(amount / 100).toFixed(2).replace('.', ',')}` : 'Carregando...'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20 font-mono font-bold">
                <Clock size={14} /> {formatTime(timeLeft)}
              </div>
            </div>

            {/* Imagem do QR Code */}
            {imageSrc && (
              <div className="flex justify-center p-3 bg-white rounded-2xl shadow-inner w-fit mx-auto border-4 border-white/20">
                <img src={imageSrc} alt="QR Code Pix" className="w-48 h-48 object-contain" />
              </div>
            )}

            {/* Código Copia e Cola */}
            {qrCode && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-gray-400">Pix Copia e Cola:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={qrCode}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-300 select-all truncate outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                      copied
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/30'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* Botão de Link Externo (caso tenha paymentUrl de gateway como InfinitePay ou Mercado Pago) */}
            {paymentUrl && (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <ExternalLink size={14} /> Abrir Página de Pagamento
              </a>
            )}

            {/* Indicador de Status Live */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span>Aguardando confirmação bancária em tempo real...</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
