import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, PlayCircle, MessageSquare, Info,
  User, PieChart, X, CheckCircle, Send, Rocket, FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Ideia.module.css';
import { apiRequest } from '../../services/api';

function Ideia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ideia, setIdeia]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [erro, setErro]                       = useState(null);
  const [showProposal, setShowProposal]       = useState(false);
  const [proposalSent, setProposalSent]       = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalData, setProposalData]       = useState({ valor: '', fatia: '', mensagem: '' });

  useEffect(() => {
    const fetchIdeia = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await apiRequest(`/api/ideias/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
        setIdeia(await response.json());
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeia();
  }, [id]);

  // Decodifica o usuarioId do JWT sem biblioteca externa
  const getUsuarioId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (
        payload.sub ??
        payload.nameid ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
        null
      );
    } catch {
      return null;
    }
  };

  // ── PEÇA-CHAVE: dispara notificação para o dono via POST /api/notificacoes ──
  const dispararNotificacaoDono = async (token, donoId, ideiaId, nomeIdeia) => {
  try {
    await apiRequest('/api/notificacoes/disparar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(donoId),
        tipoId:    1,
        // ← ideiaId explícito no formato "ideia #3" para o Navbar extrair corretamente
        mensagem:  `Você recebeu uma nova proposta na ideia #${ideiaId} - "${nomeIdeia}"!`,
      }),
    });
  } catch {
    console.warn('Não foi possível disparar notificação para o dono da ideia.');
  }
};

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Você precisa estar logado.'); return; }

    setSendingProposal(true);
    const toastId = toast.loading('Enviando proposta...');

    try {
      const response = await apiRequest(`/api/ideias/${id}/propostas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor:     parseFloat(proposalData.valor),
          fatiaPret: parseFloat(proposalData.fatia),
          mensagem:  proposalData.mensagem,
        }),
      });

      if (response.ok) {
        toast.success('Proposta enviada com sucesso!', { id: toastId });

        // ── Notifica o dono da ideia ──────────────────────────────────
        const donoId    = ideia?.idaUsuarioId ?? ideia?.usuarioId;
        const nomeIdeia = ideia?.idaNome ?? `Ideia #${id}`;
        if (donoId) await dispararNotificacaoDono(token, donoId, nomeIdeia);
        // ─────────────────────────────────────────────────────────────

        setProposalSent(true);
        setTimeout(() => {
          setShowProposal(false);
          setProposalSent(false);
          setProposalData({ valor: '', fatia: '', mensagem: '' });
        }, 3000);
      } else {
        let msg = 'Erro ao enviar proposta.';
        try { const err = await response.json(); msg = err.message || err.title || msg; } catch {}
        toast.error(`${response.status}: ${msg}`, { id: toastId });
      }
    } catch (error) {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
      console.error(error);
    } finally {
      setSendingProposal(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProposalData((prev) => ({ ...prev, [name]: value }));
  };

  const usuarioLogadoId = String(getUsuarioId() ?? '');
  const donoIdeia       = String(ideia?.idaUsuarioId ?? ideia?.usuarioId ?? '');
  const isOwner         = usuarioLogadoId && donoIdeia && usuarioLogadoId === donoIdeia;

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.container} style={{ textAlign: 'center', padding: '80px 40px' }}>
        <Rocket size={48} color="#0d47a1" opacity={0.3} />
        <p style={{ marginTop: 16, color: '#64748b' }}>Carregando ideia...</p>
      </div>
    </div>
  );

  if (erro || !ideia) return (
    <div className={styles.page}>
      <div className={styles.container} style={{ textAlign: 'center', padding: '80px 40px' }}>
        <Rocket size={48} color="#e53e3e" opacity={0.4} />
        <p style={{ marginTop: 16, color: '#e53e3e', fontWeight: 700 }}>Não foi possível carregar esta ideia.</p>
        <p style={{ color: '#64748b', fontSize: 14 }}>{erro}</p>
        <button className={styles.backBtn} style={{ margin: '20px auto 0' }} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>
    </div>
  );

  const nome       = ideia.idaNome;
  const categoria  = ideia.categoriaNome;
  const statusNome = ideia.statusNome;
  const statusId   = ideia.idaStatusId;
  const info       = ideia.info ?? {};
  const descricao  = info.idaInfoDescricao;
  const imagem     = info.idaInfoImagem;
  const fatia      = info.idaInfoFatia;
  const linkVideo  = info.idaInfoLinkVideo;
  const cnpj       = info.idaInfoCnpj;
  const documentos = ideia.documentos ?? [];
  const isAtivo    = statusId === 1 || String(statusNome ?? '').toLowerCase().includes('ativ');

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.blob} />

      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className={styles.header}>
          <div className={styles.imageWrapper}>
            {imagem ? (
              <img src={imagem} alt={nome} className={styles.image} />
            ) : (
              <div className={styles.image} style={{ background: 'linear-gradient(135deg,#e8f0fe,#c7d9f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 24 }}>
                <Rocket size={72} color="#0d47a1" opacity={0.2} />
              </div>
            )}
            {fatia != null && fatia > 0 && (
              <span className={styles.equityBadge}><PieChart size={14} /> {fatia}% de equity</span>
            )}
          </div>

          <div className={styles.mainInfo}>
            {categoria && <span className={styles.categoryBadge}>{categoria}</span>}
            <h1 className={styles.title}>{nome}</h1>

            <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:50, fontSize:13, fontWeight:700, background: isAtivo ? '#dcfce7' : '#fef3c7', color: isAtivo ? '#15803d' : '#b45309', width:'fit-content' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background: isAtivo ? '#22c55e' : '#f59e0b', display:'inline-block' }} />
              {statusNome ?? (isAtivo ? 'Ativo' : 'Pendente')}
            </span>

            {cnpj && (
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:14 }}>
                <Info size={14} /> CNPJ: <strong style={{ color:'#1e293b' }}>{cnpj}</strong>
              </div>
            )}

            <div className={styles.authorSection}>
              <div className={styles.authorAvatar}><User size={22} /></div>
              <div className={styles.authorText}>
                <span>Empreendedor</span>
                <strong>ID #{ideia.idaUsuarioId}</strong>
              </div>
            </div>
          </div>
        </div>

        {descricao && (
          <div className={styles.descriptionSection}>
            <div className={styles.sectionTitle}><Info size={20} /><h2>Sobre a Ideia</h2></div>
            <p className={styles.description}>{descricao}</p>
          </div>
        )}

        {linkVideo && (
          <div className={styles.descriptionSection} style={{ marginBottom: 40 }}>
            <div className={styles.sectionTitle}><PlayCircle size={20} /><h2>Vídeo Pitch</h2></div>
            <a href={linkVideo} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#0d47a1', fontWeight:700, textDecoration:'none' }}>
              <PlayCircle size={18} /> Assistir vídeo
            </a>
          </div>
        )}

        {documentos.length > 0 && (
          <div className={styles.descriptionSection} style={{ marginBottom: 40 }}>
            <div className={styles.sectionTitle}><FileText size={20} /><h2>Documentos</h2></div>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
              {documentos.map((doc) => (
                <li key={doc.idaDocumentoId}>
                  <a href={doc.arquivo} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#0d47a1', fontWeight:600, textDecoration:'none', fontSize:14 }}>
                    <FileText size={15} /> Documento #{doc.idaDocumentoId}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actionsArea}>
          {/* Investidor vê botão de enviar proposta */}
          {!isOwner && (
            <div className={styles.actionCard}>
              <div className={styles.cardHeader}><MessageSquare size={22} color="#0d47a1" /><h3>Fazer Proposta</h3></div>
              <p>Demonstre seu interesse e envie uma proposta de investimento ao empreendedor.</p>
              <button className={styles.buttonPrimary} onClick={() => setShowProposal(true)}>Enviar Proposta</button>
            </div>
          )}

          {/* Dono vê botão de ver propostas recebidas */}
          {isOwner && (
            <div className={styles.actionCard}>
              <div className={styles.cardHeader}><MessageSquare size={22} color="#0d47a1" /><h3>Propostas Recebidas</h3></div>
              <p>Veja e responda as propostas de investidores para esta ideia.</p>
              <button className={styles.buttonPrimary} onClick={() => navigate(`/propostas/${id}`)}>
                Ver Propostas
              </button>
            </div>
          )}

          <div className={styles.actionCard}>
            <div className={styles.cardHeader}><PieChart size={22} color="#0d47a1" /><h3>Participação Ofertada</h3></div>
            <p>O empreendedor está oferecendo uma fatia da empresa em troca de investimento.</p>
            <div style={{ fontSize:36, fontWeight:900, color:'#0d47a1', textAlign:'center', padding:'10px 0' }}>
              {fatia != null ? `${fatia}%` : '—'}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProposal && !isOwner && (
          <motion.div className={styles.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={(e) => e.target === e.currentTarget && setShowProposal(false)}>
            <motion.div className={styles.modalContent} initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}>
              <button className={styles.closeModal} onClick={() => setShowProposal(false)}><X size={18} /></button>

              {proposalSent ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <CheckCircle size={56} color="#22c55e" />
                  <h3 style={{ marginTop:16, color:'#15803d' }}>Proposta enviada!</h3>
                  <p style={{ color:'#64748b', marginTop:8 }}>O empreendedor foi notificado e irá analisar sua proposta em breve.</p>
                </div>
              ) : (
                <>
                  <h2 style={{ marginBottom:20, color:'#0d47a1', display:'flex', alignItems:'center', gap:10 }}>
                    <Send size={22} /> Enviar Proposta
                  </h2>
                  <form onSubmit={handleProposalSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div>
                      <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#1e293b', fontSize:14 }}>Valor do Investimento (R$)</label>
                      <input type="number" name="valor" value={proposalData.valor} onChange={handleInputChange} required min="0" step="0.01" placeholder="Ex: 50000"
                        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#1e293b', fontSize:14 }}>Fatia Pretendida (%)</label>
                      <input type="number" name="fatia" value={proposalData.fatia} onChange={handleInputChange} required min="0" max="100" step="0.1" placeholder="Ex: 15"
                        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#1e293b', fontSize:14 }}>Mensagem</label>
                      <textarea name="mensagem" value={proposalData.mensagem} onChange={handleInputChange} rows={4} placeholder="Descreva sua proposta e motivação..."
                        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, resize:'vertical', outline:'none', fontFamily:'inherit' }} />
                    </div>
                    <button type="submit" disabled={sendingProposal} className={styles.buttonPrimary} style={{ marginTop:8 }}>
                      {sendingProposal ? 'Enviando...' : <><Send size={16} /> Enviar Proposta</>}
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

export default Ideia;