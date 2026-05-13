import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MessageSquare, DollarSign, PieChart,
  User, Check, X, Clock, Send, RefreshCcw, Rocket
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Propostas.module.css';
import { apiRequest } from '../../services/api';

function Propostas() {
  const { ideiaId } = useParams();
  const navigate    = useNavigate();

  const [ideia, setIdeia]         = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading]     = useState(true);

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState(null);
  const [counterSent, setCounterSent]           = useState(false);
  const [sendingAction, setSendingAction]       = useState(false);
  const [counterData, setCounterData]           = useState({ valor: '', fatia: '', mensagem: '' });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchTudo = async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      try {
        // Busca dados da ideia
        const resIdeia = await apiRequest(`/api/ideias/${ideiaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resIdeia.ok) setIdeia(await resIdeia.json());

        // Busca propostas da ideia (endpoint do empreendedor)
        const resProp = await apiRequest(`/api/ideias/${ideiaId}/propostas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resProp.ok) {
          const raw = await resProp.json();
          // Normaliza PascalCase → camelCase
          const normalizado = raw.map(p => {
            const infos  = (p.Infos ?? p.infos ?? []).map(i => ({
              mensagem:   i.Mensagem   ?? i.mensagem,
              valor:      i.Valor      ?? i.valor,
              fatiaPret:  i.FatiaPret  ?? i.fatiaPret,
              aceiteId:   i.AceiteId   ?? i.aceiteId,
              aceiteNome: i.AceiteNome ?? i.aceiteNome ?? '',
              retorno:    i.Retorno    ?? i.retorno,
              createDate: i.CreateDate ?? i.createDate,
            }));
            return {
              prpId:      p.PrpId       ?? p.prpId,
              prpIdeiaId: p.PrpIdeiaId  ?? p.prpIdeiaId,
              usuarioId:  p.PrpUsuarioId ?? p.prpUsuarioId,
              prpStatus:  p.PrpStatus   ?? p.prpStatus,
              infos,
            };
          });
          setPropostas(normalizado);
        } else {
          toast.error('Não foi possível carregar as propostas.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar propostas.');
      } finally {
        setLoading(false);
      }
    };
    fetchTudo();
  }, [ideiaId]);

  const notificarInvestidor = async (token, usuarioId, status) => {
    try {
      await apiRequest('/api/notificacoes/disparar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          tipoId:    1,
          mensagem:  `Sua proposta para a ideia #${ideiaId} foi ${status}!`,
        }),
      });
    } catch {
      console.warn('Não foi possível notificar o investidor.');
    }
  };

  const handleAction = async (proposta, action) => {
    if (action === 'counter') {
      setSelectedProposta(proposta);
      const ultimo = proposta.infos?.[proposta.infos.length - 1] ?? {};
      setCounterData({
        valor:    String(ultimo.valor    ?? ''),
        fatia:    String(ultimo.fatiaPret ?? ''),
        mensagem: '',
      });
      setShowCounterModal(true);
      return;
    }

    const token    = getToken();
    const aceiteId = action === 'accept' ? 1 : 2;

    setSendingAction(true);
    const toastId = toast.loading(aceiteId === 1 ? 'Aceitando...' : 'Recusando...');

    try {
      const res = await apiRequest(`/api/propostas/${proposta.prpId}/responder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceiteId, retorno: null }),
      });

      if (res.ok) {
        const statusTexto = aceiteId === 1 ? 'aceita' : 'recusada';
        toast.success(aceiteId === 1 ? 'Proposta aceita!' : 'Proposta recusada.', { id: toastId });
        await notificarInvestidor(token, proposta.usuarioId, statusTexto);

        // Atualiza localmente
        setPropostas(prev => prev.map(p =>
          p.prpId === proposta.prpId
            ? { ...p, infos: p.infos.map((info, i) =>
                i === p.infos.length - 1
                  ? { ...info, aceiteNome: statusTexto, aceiteId }
                  : info
              )}
            : p
        ));
      } else {
        let msg = 'Erro ao processar.';
        try { const err = await res.json(); msg = err.message ?? err.title ?? msg; } catch {}
        toast.error(msg, { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId });
    } finally {
      setSendingAction(false);
    }
  };

  const handleCounterSubmit = async (e) => {
  e.preventDefault();
  const token = getToken();
  setSendingAction(true);
  const toastId = toast.loading('Enviando contraproposta...');

  try {
    const res = await apiRequest(`/api/propostas/${selectedProposta.prpId}/responder`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aceiteId: 3,
        retorno: counterData.mensagem,
      }),
    });

    if (res.ok) {
      toast.success('Contraproposta enviada!', { id: toastId });
      await notificarInvestidor(
        token,
        selectedProposta.usuarioId,
        `contraproposta: "${counterData.mensagem}"`
      );
      setCounterSent(true);
      setTimeout(() => {
        setShowCounterModal(false);
        setCounterSent(false);
        setCounterData({ valor: '', fatia: '', mensagem: '' });
      }, 2500);
    } else {
      let msg = 'Erro ao enviar contraproposta.';
      try { const err = await res.json(); msg = err.message ?? err.title ?? msg; } catch {}
      toast.error(msg, { id: toastId });
    }
  } catch {
    toast.error('Erro de conexão.', { id: toastId });
  } finally {
    setSendingAction(false);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCounterData(prev => ({ ...prev, [name]: value }));
  };

  // Usa aceiteNome para determinar status (mais confiável que aceiteId)
  const getStatusInfo = (proposta) => {
    const ultimo     = proposta.infos?.[proposta.infos.length - 1] ?? {};
    const aceiteNome = (ultimo.aceiteNome ?? '').toLowerCase();
    if (aceiteNome.includes('aceit'))  return { label: 'Aceita',    cls: styles.statusAceita,   icon: <Check size={12} />, isPendente: false };
    if (aceiteNome.includes('recus'))  return { label: 'Recusada',  cls: styles.statusRecusada, icon: <X size={12} />,     isPendente: false };
    if (aceiteNome.includes('encerr')) return { label: 'Encerrada', cls: styles.statusRecusada, icon: <X size={12} />,     isPendente: false };
    // "pendente" ou qualquer outro valor = pendente
    return { label: 'Pendente', cls: styles.statusPendente, icon: <Clock size={12} />, isPendente: true };
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.container} style={{ textAlign: 'center', padding: '80px 40px' }}>
        <Rocket size={48} color="#0d47a1" opacity={0.3} />
        <p style={{ marginTop: 16, color: '#64748b' }}>Carregando propostas...</p>
      </div>
    </div>
  );

  const nomeIdeia = ideia?.IdaNome ?? ideia?.idaNome ?? `Ideia #${ideiaId}`;

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.blob} />

      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className={styles.header}>
          <div className={styles.titleArea}>
            <MessageSquare size={32} className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Propostas Recebidas</h1>
              <p className={styles.subtitle}>{nomeIdeia}</p>
            </div>
          </div>
          <span className={styles.countBadge}>
            {propostas.length} proposta{propostas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {propostas.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <p>Nenhuma proposta recebida para esta ideia ainda.</p>
          </div>
        ) : (
          <div className={styles.propostasGrid}>
            {propostas.map((p) => {
              const ultimo  = p.infos?.[p.infos.length - 1] ?? {};
              const status  = getStatusInfo(p);

              return (
                <motion.div
                  key={p.prpId}
                  className={styles.propostaCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0  }}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.investidorInfo}>
                      <div className={styles.avatar}><User size={20} /></div>
                      <div>
                        <span className={styles.investidorLabel}>Investidor</span>
                        <strong className={styles.investidorId}>ID #{p.usuarioId}</strong>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${status.cls}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoItem}>
                        <DollarSign size={16} className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Valor</span>
                          <strong className={styles.infoValue}>
                            {ultimo.valor != null
                              ? `R$ ${Number(ultimo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </strong>
                        </div>
                      </div>
                      <div className={styles.infoItem}>
                        <PieChart size={16} className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Fatia Pretendida</span>
                          <strong className={styles.infoValue}>
                            {ultimo.fatiaPret != null ? `${ultimo.fatiaPret}%` : '—'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {ultimo.mensagem && (
                      <div className={styles.mensagemBox}>
                        <p className={styles.mensagemText}>{ultimo.mensagem}</p>
                      </div>
                    )}
                  </div>

                  {status.isPendente && (
                    <div className={styles.cardActions}>
                      <button className={styles.btnAccept}  onClick={() => handleAction(p, 'accept')}  disabled={sendingAction}><Check size={15} /> Aceitar</button>
                      <button className={styles.btnCounter} onClick={() => handleAction(p, 'counter')} disabled={sendingAction}><RefreshCcw size={15} /> Contraproposta</button>
                      <button className={styles.btnReject}  onClick={() => handleAction(p, 'reject')}  disabled={sendingAction}><X size={15} /> Recusar</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Contraproposta */}
      <AnimatePresence>
        {showCounterModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowCounterModal(false)}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <button className={styles.closeModal} onClick={() => setShowCounterModal(false)}><X size={18} /></button>

              {counterSent ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Send size={48} color="#0d47a1" />
                  <h3 style={{ marginTop: 16, color: '#0d47a1' }}>Contraproposta enviada!</h3>
                  <p style={{ color: '#64748b', marginTop: 8 }}>O investidor receberá sua contraproposta em breve.</p>
                </div>
              ) : (
                <>
                  <h2 style={{ marginBottom: 20, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RefreshCcw size={22} /> Enviar Contraproposta
                  </h2>
                  <form onSubmit={handleCounterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>Novo Valor (R$)</label>
                      <input type="number" name="valor" value={counterData.valor} onChange={handleInputChange} required min="0" step="0.01"
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>Nova Fatia (%)</label>
                      <input type="number" name="fatia" value={counterData.fatia} onChange={handleInputChange} required min="0" max="100" step="0.1"
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>Mensagem</label>
                      <textarea name="mensagem" value={counterData.mensagem} onChange={handleInputChange} rows={4} required
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <button type="submit" disabled={sendingAction}
                      style={{ background: '#0d47a1', color: 'white', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {sendingAction ? 'Enviando...' : <><Send size={16} /> Enviar Contraproposta</>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Propostas;