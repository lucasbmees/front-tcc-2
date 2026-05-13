import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle, XCircle, Clock,
  DollarSign, PieChart, User, MessageSquare,
  Rocket, Send, RefreshCcw, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './ResponderProposta.module.css';
import { apiRequest } from '../../services/api';

function ResponderProposta() {
  const { ideiaId } = useParams();
  const navigate    = useNavigate();

  const [proposta, setProposta]                 = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [sending, setSending]                   = useState(false);
  const [resultado, setResultado]               = useState(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterRetorno, setCounterRetorno]     = useState('');

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchProposta = async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      try {
        const res = await apiRequest(`/api/ideias/${ideiaId}/propostas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const lista = await res.json();
          const pendente = lista
            .filter(p => {
              const infos  = p.Infos ?? p.infos ?? [];
              const ultimo = infos[infos.length - 1] ?? {};
              const aceite = (ultimo.AceiteNome ?? ultimo.aceiteNome ?? '').toLowerCase();
              return aceite === 'pendente' || aceite.includes('pendente');
            })
            .sort((a, b) => {
              const ia = a.Infos ?? a.infos ?? [];
              const ib = b.Infos ?? b.infos ?? [];
              return new Date(ib[ib.length - 1]?.CreateDate ?? 0) - new Date(ia[ia.length - 1]?.CreateDate ?? 0);
            })[0] ?? null;

          if (pendente) {
            const infos  = pendente.Infos ?? pendente.infos ?? [];
            const ultimo = infos[infos.length - 1] ?? {};
            setProposta({
              prpId:      pendente.PrpId       ?? pendente.prpId,
              prpIdeiaId: pendente.PrpIdeiaId  ?? pendente.prpIdeiaId,
              usuarioId:  pendente.PrpUsuarioId ?? pendente.prpUsuarioId,
              valor:      ultimo.Valor    ?? ultimo.valor,
              fatiaPret:  ultimo.FatiaPret ?? ultimo.fatiaPret,
              mensagem:   ultimo.Mensagem ?? ultimo.mensagem,
              aceiteNome: (ultimo.AceiteNome ?? ultimo.aceiteNome ?? 'pendente').toLowerCase(),
              createDate: ultimo.CreateDate ?? ultimo.createDate,
            });
          }
        } else {
          toast.error('Não foi possível carregar a proposta.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar proposta.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposta();
  }, [ideiaId]);

  const notificarInvestidor = async (token, mensagem) => {
    try {
      await apiRequest('/api/notificacoes/disparar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: Number(proposta.usuarioId), tipoId: 1, mensagem }),
      });
    } catch {
      console.warn('Não foi possível notificar o investidor.');
    }
  };

  // Aceitar (aceiteId=1) ou Recusar (aceiteId=2)
  const responder = async (aceiteId) => {
    const token = getToken();
    if (!proposta?.prpId) return;
    setSending(true);
    const toastId = toast.loading(aceiteId === 1 ? 'Aceitando...' : 'Recusando...');
    try {
      const res = await apiRequest(`/api/propostas/${proposta.prpId}/responder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceiteId, retorno: null }),
      });
      if (res.ok) {
        const status = aceiteId === 1 ? 'aceita' : 'recusada';
        toast.success(aceiteId === 1 ? 'Proposta aceita!' : 'Proposta recusada.', { id: toastId });
        await notificarInvestidor(token, `Sua proposta para a ideia #${ideiaId} foi ${status}!`);
        setResultado(status);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao processar.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  // Contraproposta — usa o mesmo endpoint /responder com aceiteId=3 e retorno preenchido
  const enviarContraproposta = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!proposta?.prpId || !counterRetorno.trim()) return;
    setSending(true);
    const toastId = toast.loading('Enviando contraproposta...');
    try {
      const res = await apiRequest(`/api/propostas/${proposta.prpId}/responder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceiteId: 3, retorno: counterRetorno.trim() }),
      });
      if (res.ok) {
        toast.success('Contraproposta enviada!', { id: toastId });
        await notificarInvestidor(
          token,
          `O empreendedor fez uma contraproposta na ideia #${ideiaId}: "${counterRetorno.trim()}"`
        );
        setShowCounterModal(false);
        setCounterRetorno('');
        setResultado('contraproposta');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao enviar contraproposta.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.center}>
        <Rocket size={48} color="#0d47a1" opacity={0.3} />
        <p>Carregando proposta...</p>
      </div>
    </div>
  );

  if (!proposta) return (
    <div className={styles.page}>
      <div className={styles.center}>
        <MessageSquare size={48} color="#94a3b8" />
        <p style={{ color: '#64748b', marginTop: 16 }}>Nenhuma proposta pendente encontrada.</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ marginTop: 24 }}>
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>
    </div>
  );

  if (resultado) return (
    <div className={styles.page}>
      <div className={styles.center}>
        {resultado === 'aceita'         && <CheckCircle size={64} color="#22c55e" />}
        {resultado === 'recusada'       && <XCircle     size={64} color="#ef4444" />}
        {resultado === 'contraproposta' && <RefreshCcw  size={64} color="#0d47a1" />}
        <h2 style={{ marginTop: 20, color: '#1e293b' }}>
          {resultado === 'aceita'         && 'Proposta aceita!'}
          {resultado === 'recusada'       && 'Proposta recusada.'}
          {resultado === 'contraproposta' && 'Contraproposta enviada!'}
        </h2>
        <p style={{ color: '#64748b', marginTop: 8, textAlign: 'center', maxWidth: 360 }}>
          {resultado === 'contraproposta'
            ? 'O investidor foi notificado e pode responder sua contraproposta.'
            : 'O investidor foi notificado sobre sua decisão.'}
        </p>
        <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ marginTop: 28 }}>
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.container}>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className={styles.header}>
          <MessageSquare size={28} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Proposta Recebida</h1>
            <p className={styles.subtitle}>Ideia #{ideiaId}</p>
          </div>
        </div>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
        >
          <div className={styles.cardTop}>
            <div className={styles.investidorInfo}>
              <div className={styles.avatar}><User size={20} /></div>
              <div>
                <span className={styles.investidorLabel}>Investidor</span>
                <strong className={styles.investidorId}>ID #{proposta.usuarioId}</strong>
              </div>
            </div>
            <span className={`${styles.statusBadge} ${styles.statusPendente}`}>
              <Clock size={12} /> Pendente
            </span>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <DollarSign size={16} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Valor proposto</span>
                  <strong className={styles.infoValue}>
                    {proposta.valor != null
                      ? `R$ ${Number(proposta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </strong>
                </div>
              </div>
              <div className={styles.infoItem}>
                <PieChart size={16} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Fatia pretendida</span>
                  <strong className={styles.infoValue}>
                    {proposta.fatiaPret != null ? `${proposta.fatiaPret}%` : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {proposta.mensagem && (
              <div className={styles.mensagemBox}>
                <p className={styles.mensagemText}>{proposta.mensagem}</p>
              </div>
            )}

            {proposta.createDate && (
              <p className={styles.dataRecebida}>
                Recebida em {new Date(proposta.createDate).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>

          <div className={styles.cardActions}>
            <button className={styles.btnAccept}  onClick={() => responder(1)} disabled={sending}>
              <CheckCircle size={16} /> Aceitar
            </button>
            <button className={styles.btnCounter} onClick={() => setShowCounterModal(true)} disabled={sending}>
              <RefreshCcw size={16} /> Contraproposta
            </button>
            <button className={styles.btnReject}  onClick={() => responder(2)} disabled={sending}>
              <XCircle size={16} /> Recusar
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCounterModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowCounterModal(false)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.9, opacity: 0 }}
            >
              <button className={styles.closeModal} onClick={() => setShowCounterModal(false)}>
                <X size={18} />
              </button>
              <h2 style={{ marginBottom: 8, color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCcw size={22} /> Enviar Contraproposta
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                Escreva sua contraproposta. O investidor será notificado e poderá responder.
              </p>
              <form onSubmit={enviarContraproposta} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                    Sua resposta / condições
                  </label>
                  <textarea
                    value={counterRetorno}
                    onChange={(e) => setCounterRetorno(e.target.value)}
                    rows={5}
                    required
                    placeholder="Ex: Aceito investir, mas prefiro 8% ao invés de 12%. Podemos negociar?"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid #e2e8f0', borderRadius: 10,
                      fontSize: 14, resize: 'vertical', outline: 'none',
                      fontFamily: 'inherit', lineHeight: 1.6,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !counterRetorno.trim()}
                  style={{
                    background: '#0d47a1', color: 'white', border: 'none',
                    padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 15,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: sending || !counterRetorno.trim() ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {sending ? 'Enviando...' : <><Send size={16} /> Enviar Contraproposta</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResponderProposta;