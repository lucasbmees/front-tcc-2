import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../../services/api';
import {
  ChevronLeft, DollarSign, PieChart, Clock,
  CheckCircle, XCircle, RefreshCcw, MessageSquare, Rocket
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const getToken = () => localStorage.getItem('token');

function MinhasPropostas() {
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(null);

  useEffect(() => {
    const fetchPropostas = async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await apiRequest('/api/propostas/minhas', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const raw = await res.json();
          const normalizado = raw.map(p => {
            const infos = (p.Infos ?? p.infos ?? []).map(i => ({
              mensagem:  i.Mensagem  ?? i.mensagem,
              valor:     i.Valor     ?? i.valor,
              fatiaPret: i.FatiaPret ?? i.fatiaPret,
              aceiteId:  i.AceiteId  ?? i.aceiteId,
              aceiteNome:(i.AceiteNome ?? i.aceiteNome ?? '').toLowerCase(),
              retorno:   i.Retorno   ?? i.retorno,
              createDate:i.CreateDate ?? i.createDate,
            }));
            return {
              prpId:      p.PrpId      ?? p.prpId,
              prpIdeiaId: p.PrpIdeiaId ?? p.prpIdeiaId,
              prpStatus:  p.PrpStatus  ?? p.prpStatus,
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
    fetchPropostas();
  }, []);

  const responderContraproposta = async (proposta, aceitar) => {
    const token = getToken();
    setSending(proposta.prpId);
    const toastId = toast.loading(aceitar ? 'Aceitando...' : 'Recusando...');
    try {
      const res = await apiRequest(`/api/propostas/${proposta.prpId}/encerrar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceitar }),
      });
      if (res.ok) {
        toast.success(aceitar ? 'Contraproposta aceita!' : 'Contraproposta recusada.', { id: toastId });
        // retorno: null faz temContraproposta virar false → botões somem
        setPropostas(prev => prev.map(p =>
          p.prpId === proposta.prpId
            ? {
                ...p,
                infos: p.infos.map((info, i) =>
                  i === p.infos.length - 1
                    ? { ...info, aceiteNome: aceitar ? 'aceita' : 'recusada', retorno: null }
                    : info
                )
              }
            : p
        ));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao processar.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId });
    } finally {
      setSending(null);
    }
  };

  const getStatusInfo = (aceiteNome) => {
    if (aceiteNome.includes('aceit'))  return { label: 'Aceita',         cor: '#22c55e', icon: <CheckCircle size={13}/> };
    if (aceiteNome.includes('recus'))  return { label: 'Recusada',       cor: '#ef4444', icon: <XCircle    size={13}/> };
    if (aceiteNome === 'pendente')     return { label: 'Pendente',       cor: '#f59e0b', icon: <Clock      size={13}/> };
    return                                    { label: 'Em negociação',  cor: '#6366f1', icon: <RefreshCcw size={13}/> };
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.center}>
        <Rocket size={48} color="#0d47a1" opacity={0.3} />
        <p style={{ marginTop: 16, color: '#64748b' }}>Carregando propostas...</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Toaster position="top-right" />
      <div style={s.container}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div style={s.header}>
          <MessageSquare size={26} color="#0d47a1" />
          <h1 style={{ margin: 0, fontSize: 22, color: '#1e293b' }}>Minhas Propostas</h1>
        </div>

        {propostas.length === 0 ? (
          <div style={s.center}>
            <MessageSquare size={48} color="#94a3b8" />
            <p style={{ color: '#64748b', marginTop: 16 }}>Você ainda não enviou nenhuma proposta.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {propostas.map(p => {
              const ultimo           = p.infos?.[p.infos.length - 1] ?? {};
              const statusInfo       = getStatusInfo(ultimo.aceiteNome ?? '');
              const temContraproposta = (ultimo.aceiteNome === 'pendente') && !!ultimo.retorno;
              const isFechada        = ultimo.aceiteNome.includes('aceit') || ultimo.aceiteNome.includes('recus');

              return (
                <motion.div
                  key={p.prpId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0  }}
                  style={s.card}
                >
                  {/* Cabeçalho */}
                  <div style={s.cardTop}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
                      Ideia #{p.prpIdeiaId}
                    </span>
                    <span style={{ ...s.badge, background: statusInfo.cor + '20', color: statusInfo.cor, border: `1px solid ${statusInfo.cor}40` }}>
                      {statusInfo.icon}&nbsp;{statusInfo.label}
                    </span>
                  </div>

                  {/* Valores */}
                  <div style={s.infoRow}>
                    <div style={s.infoItem}>
                      <DollarSign size={15} color="#64748b" />
                      <div>
                        <span style={s.infoLabel}>Valor</span>
                        <strong style={s.infoValue}>
                          {ultimo.valor != null
                            ? `R$ ${Number(ultimo.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </strong>
                      </div>
                    </div>
                    <div style={s.infoItem}>
                      <PieChart size={15} color="#64748b" />
                      <div>
                        <span style={s.infoLabel}>Fatia</span>
                        <strong style={s.infoValue}>
                          {ultimo.fatiaPret != null ? `${ultimo.fatiaPret}%` : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Mensagem original */}
                  {ultimo.mensagem && (
                    <div style={s.mensagemBox}>
                      <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>{ultimo.mensagem}</p>
                    </div>
                  )}

                  {/* Contraproposta do empreendedor */}
                  {temContraproposta && (
                    <div style={{ ...s.mensagemBox, background: '#f0f4ff', borderLeft: '3px solid #6366f1', marginTop: 10 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Resposta do empreendedor
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>{ultimo.retorno}</p>
                    </div>
                  )}

                  {/* Botões aceitar/recusar contraproposta */}
                  {temContraproposta && !isFechada && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button
                        style={{ ...s.btnAccept, flex: 1, opacity: sending === p.prpId ? 0.6 : 1 }}
                        disabled={sending === p.prpId}
                        onClick={() => responderContraproposta(p, true)}
                      >
                        <CheckCircle size={15} /> Aceitar
                      </button>
                      <button
                        style={{ ...s.btnReject, flex: 1, opacity: sending === p.prpId ? 0.6 : 1 }}
                        disabled={sending === p.prpId}
                        onClick={() => responderContraproposta(p, false)}
                      >
                        <XCircle size={15} /> Recusar
                      </button>
                    </div>
                  )}

                  {/* Aguardando resposta */}
                  {!temContraproposta && !isFechada && (
                    <p style={{ marginTop: 12, fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} /> Aguardando resposta do empreendedor...
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' },
  container:  { maxWidth: 640, margin: '0 auto' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 },
  header:     { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 24px' },
  backBtn:    { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, padding: 0 },
  card:       { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' },
  cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  badge:      { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  infoRow:    { display: 'flex', gap: 24, marginBottom: 12 },
  infoItem:   { display: 'flex', alignItems: 'center', gap: 8 },
  infoLabel:  { display: 'block', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:  { display: 'block', fontSize: 15, color: '#1e293b' },
  mensagemBox:{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' },
  btnAccept:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s' },
  btnReject:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s' },
};

export default MinhasPropostas;