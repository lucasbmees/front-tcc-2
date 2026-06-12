import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, PlayCircle, MessageSquare, Info,
  User, PieChart, X, CheckCircle, Send, Rocket, FileText,
  AlertCircle, BarChart3
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Ideia.module.css';
import { apiRequest } from '../../services/api';
import { getToken, getRoleFromToken, getUsuarioId, getPlanFromToken } from '../../utils/auth';

function Ideia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = getToken();
  const role = (getRoleFromToken(token) || '').toLowerCase();
  const plan = (getPlanFromToken(token) || '').toLowerCase();
  const MotionDiv = motion.div;

  const [ideia, setIdeia]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [erro, setErro]                       = useState(null);
  const [showProposal, setShowProposal]       = useState(false);
  const [proposalSent, setProposalSent]       = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalData, setProposalData]       = useState({ valor: '', fatia: '', mensagem: '' });
  const [canChat, setCanChat]                 = useState(false);

  // Comentários
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // id do comentário pai

    const usuarioLogadoId = String(getUsuarioId() ?? '');
  const donoIdeia       = String(ideia?.idaUsuarioId ?? ideia?.IdaUsuarioId ?? ideia?.usuarioId ?? ideia?.UsuarioId ?? '');
  const isOwner         = usuarioLogadoId && donoIdeia && usuarioLogadoId === donoIdeia;

  useEffect(() => {
    const fetchIdeia = async () => {
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

  useEffect(() => {
    if (role !== 'investidor') setShowProposal(false);
  }, [role]);

  useEffect(() => {
    const verificarChat = async () => {
      if (!token || role !== 'investidor') { setCanChat(false); return; }
      if (isOwner) { setCanChat(false); return; }

      try {
        const res = await apiRequest('/api/propostas/minhas', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) { setCanChat(false); return; }

        const raw = await res.json();
        const ideiaIdNum = Number(id);
        const propostas = Array.isArray(raw) ? raw : [];
        const minha = propostas.find(p => Number(p.PrpIdeiaId ?? p.prpIdeiaId) === ideiaIdNum);
        if (!minha) { setCanChat(false); return; }

        const infos = minha.Infos ?? minha.infos ?? [];
        const ultima = infos[infos.length - 1] ?? {};
        const aceiteId = ultima.AceiteId ?? ultima.aceiteId;
        const aceiteNome = String(ultima.AceiteNome ?? ultima.aceiteNome ?? '').toLowerCase();
        setCanChat(aceiteId === 1 || aceiteNome.includes('aceit'));
      } catch {
        setCanChat(false);
      }
    };

    verificarChat();
  }, [token, role, id, isOwner]);

  // ── PEÇA-CHAVE: dispara notificação para o dono via POST /api/notificacoes ──
  const dispararNotificacaoDono = async (token, donoId, ideiaId) => {
  try {
    await apiRequest('/api/notificacoes/disparar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(donoId),
        tipoId:    1,
        // ← ideiaId explícito no formato "ideia #3" para o Navbar extrair corretamente
        mensagem:  `Você recebeu uma nova proposta na ideia ${ideiaId}!`,
      }),
    });
  } catch {
    console.warn('Não foi possível disparar notificação para o dono da ideia.');
  }
};

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!token) { toast.error('Você precisa estar logado.'); return; }
    if (role !== 'investidor') { toast.error('Apenas investidores podem enviar proposta.'); return; }

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
        const donoId =
          ideia?.idaUsuarioId ??
          ideia?.IdaUsuarioId ??
          ideia?.usuarioId ??
          ideia?.UsuarioId;
        if (donoId) await dispararNotificacaoDono(token, donoId, Number(id));
        // ─────────────────────────────────────────────────────────────

        setProposalSent(true);
        setTimeout(() => {
          setShowProposal(false);
          setProposalSent(false);
          setProposalData({ valor: '', fatia: '', mensagem: '' });
        }, 3000);
      } else {
        let msg = 'Erro ao enviar proposta.';
        if (response.status === 403) {
          msg = 'Acesso negado. Apenas investidores podem enviar proposta.';
        } else {
          const err = await response.json().catch(() => ({}));
          msg = err.message || err.title || msg;
        }
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

  const abrirDocumento = async (url) => {
    const token = getToken();
    if (!token) { toast.error('Faça login para visualizar documentos.'); return; }
    try {
      const res = await apiRequest(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Não foi possível abrir o documento.');
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) { toast.error('Faça login para comentar.'); return; }

    setIsCommenting(true);
    try {
      const response = await apiRequest(`/api/ideias/${id}/comentarios`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: commentText,
          parentId: replyingTo
        }),
      });

      if (response.ok) {
        toast.success('Comentário enviado!');
        setCommentText('');
        setReplyingTo(null);
        // Recarrega a ideia para mostrar o novo comentário
        const res = await apiRequest(`/api/ideias/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setIdeia(await res.json());
      } else {
        toast.error('Erro ao enviar comentário.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleStartChat = async () => {
    const token = getToken();
    if (!token) {
      toast.error('Faça login para conversar com o empreendedor.');
      return;
    }
    if (!canChat) {
      toast.error('Conversa disponível apenas após uma proposta ser aceita.');
      return;
    }

    const paraUsuarioId =
      ideia?.idaUsuarioId ??
      ideia?.IdaUsuarioId ??
      ideia?.usuarioId ??
      ideia?.UsuarioId;

    const ideiaId = ideia?.idaId ?? ideia?.IdaId ?? Number(id);

    if (!paraUsuarioId) {
      toast.error('Não foi possível identificar o empreendedor desta ideia.');
      return;
    }

    try {
      const response = await apiRequest('/api/chat/mensagens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paraUsuarioId: Number(paraUsuarioId),
          ideiaId: ideiaId ? Number(ideiaId) : null,
          texto: "Olá! Gostaria de saber mais sobre sua ideia."
        })
      });

      if (response.ok) {
        navigate('/chat');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao iniciar conversa.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const handleDownloadRelatorio = async () => {
    if (!token) {
      toast.error('Faça login para baixar o relatório.');
      return;
    }
    if (role !== 'investidor' || plan !== 'elite') {
      toast.error('Recurso disponível apenas para investidores Elite.');
      return;
    }

    try {
      const response = await fetch(`/api/ideias/${id}/relatorio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio-Ideia-${id}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Relatório baixado com sucesso!');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao baixar relatório.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const handleDenunciar = async () => {
    const motivo = window.prompt("Por que você está denunciando esta ideia?");
    if (!motivo) return;

    const token = localStorage.getItem('token');
    try {
      const response = await apiRequest('/api/governança/denunciar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipoAlvo: "Ideia",
          alvoId: ideia.idaId,
          motivo
        })
      });

      if (response.ok) {
        toast.success("Denúncia enviada para moderação.");
      }
    } catch {
      toast.error("Erro ao enviar denúncia.");
    }
  };



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
  const valorCaptacao = info.idaInfoValorCaptacao;
  const faturamento = info.idaInfoFaturamento;
  const custosMensais = info.idaInfoCustosMensais;
  const tempoMercadoMeses = info.idaInfoTempoMercadoMeses;
  const quantidadeClientes = info.idaInfoQuantidadeClientes;
  const feedbackClientes = info.idaInfoFeedbackClientes;
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
              {usuarioLogadoId !== donoIdeia && (
                <button 
                  onClick={handleDenunciar} 
                  title="Denunciar Ideia"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <AlertCircle size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {descricao && (
          <div className={styles.descriptionSection}>
            <div className={styles.sectionTitle}><Info size={20} /><h2>Sobre a Ideia</h2></div>
            <p className={styles.description}>{descricao}</p>
          </div>
        )}

        {(valorCaptacao != null ||
          faturamento != null ||
          custosMensais != null ||
          tempoMercadoMeses != null ||
          quantidadeClientes != null ||
          (feedbackClientes && String(feedbackClientes).trim())) && (
          <div className={styles.descriptionSection} style={{ marginBottom: 40 }}>
            <div className={styles.sectionTitle}><BarChart3 size={20} /><h2>Métricas</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {valorCaptacao != null && (
                <div style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Captação</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {Number(valorCaptacao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              )}
              {faturamento != null && (
                <div style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Faturamento</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {Number(faturamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              )}
              {custosMensais != null && (
                <div style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Custos mensais</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {Number(custosMensais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              )}
              {tempoMercadoMeses != null && (
                <div style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Tempo de mercado</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {Number(tempoMercadoMeses)} meses
                  </div>
                </div>
              )}
              {quantidadeClientes != null && (
                <div style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Quantidade de clientes</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {Number(quantidadeClientes).toLocaleString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
            {feedbackClientes && String(feedbackClientes).trim() && (
              <div style={{ marginTop: 14, padding: 14, border: '1px solid #e2e8f0', borderRadius: 14, background: 'white' }}>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Feedback de clientes</div>
                <div style={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{feedbackClientes}</div>
              </div>
            )}
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
                  <button
                    type="button"
                    onClick={() => abrirDocumento(doc.arquivo)}
                    style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#0d47a1', fontWeight:600, textDecoration:'none', fontSize:14, background:'transparent', border:'none', padding:0, cursor:'pointer' }}
                  >
                    <FileText size={15} /> Documento #{doc.idaDocumentoId}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actionsArea}>
          {/* Investidor vê botão de enviar proposta */}
          {!isOwner && role === 'investidor' && (
            <div className={styles.actionCard}>
              <div className={styles.cardHeader}><MessageSquare size={22} color="#0d47a1" /><h3>Fazer Proposta</h3></div>
              <p>Demonstre seu interesse e envie uma proposta de investimento ao empreendedor.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className={styles.buttonPrimary} onClick={() => setShowProposal(true)}>Enviar Proposta</button>
                {plan === 'elite' && (
                  <button className={styles.buttonSecondary} onClick={handleDownloadRelatorio} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '1.5px solid #0d47a1', background: 'transparent', color: '#0d47a1', fontWeight: 700, cursor: 'pointer' }}>
                    <Rocket size={18} /> Baixar Relatório (Elite)
                  </button>
                )}
                {canChat ? (
                  <button className={styles.buttonSecondary} onClick={handleStartChat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '1.5px solid #0d47a1', background: 'transparent', color: '#0d47a1', fontWeight: 700, cursor: 'pointer' }}>
                    <MessageSquare size={18} /> Conversar com Empreendedor
                  </button>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                    Mensagens liberadas após uma proposta ser aceita.
                  </p>
                )}
              </div>
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

        {/* Comentários */}
        <div className={styles.descriptionSection} style={{ marginTop: 40 }}>
          <div className={styles.sectionTitle}><MessageSquare size={20} /><h2>Comentários e Dúvidas</h2></div>

          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <textarea
              placeholder={replyingTo ? "Escreva sua resposta..." : "Tem alguma dúvida ou sugestão? Comente aqui..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles.commentInput}
              required
            />
            <div style={{ display:'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              {replyingTo && (
                <button type="button" className={styles.cancelBtn} onClick={() => setReplyingTo(null)}>Cancelar</button>
              )}
              <button type="submit" className={styles.buttonPrimary} disabled={isCommenting}>
                {isCommenting ? 'Enviando...' : (replyingTo ? 'Responder' : 'Comentar')}
              </button>
            </div>
          </form>

          <div className={styles.commentsList}>
            {(ideia.comentarios ?? []).length === 0 && (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nenhum comentário ainda. Seja o primeiro!</p>
            )}
            {(ideia.comentarios ?? []).map(comment => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentUser}>
                    <div className={styles.commentAvatar}>{comment.usuarioNome?.[0]}</div>
                    <div>
                      <strong>{comment.usuarioNome}</strong>
                      <span>{new Date(comment.createDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <button className={styles.replyBtn} onClick={() => {
                    setReplyingTo(comment.id);
                    window.scrollTo({ top: document.querySelector(`.${styles.commentForm}`).offsetTop - 100, behavior: 'smooth' });
                  }}>Responder</button>
                </div>
                <p className={styles.commentText}>{comment.texto}</p>

                {/* Respostas */}
                {(comment.replies ?? []).map(reply => (
                  <div key={reply.id} className={styles.replyItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentUser}>
                        <div className={styles.commentAvatar} style={{ width: 24, height: 24, fontSize: 10 }}>{reply.usuarioNome?.[0]}</div>
                        <div>
                          <strong style={{ fontSize: 13 }}>{reply.usuarioNome}</strong>
                          <span style={{ fontSize: 11 }}>{new Date(reply.createDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.commentText} style={{ fontSize: 13 }}>{reply.texto}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProposal && !isOwner && role === 'investidor' && (
          <MotionDiv className={styles.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={(e) => e.target === e.currentTarget && setShowProposal(false)}>
            <MotionDiv className={styles.modalContent} initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}>
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
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Ideia;
