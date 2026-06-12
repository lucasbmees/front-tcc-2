import { useState, useEffect, useRef } from 'react';
import { Send, User, Rocket, MessageCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { toast } from 'react-hot-toast';
import styles from './Chat.module.css';
import { getToken, getUsuarioId } from '../../utils/auth';

function Chat() {
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const userId = Number(getUsuarioId());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversas();
  }, []);

  useEffect(() => {
    if (conversaAtiva) {
      fetchMensagens(conversaAtiva.id);
      const interval = setInterval(() => fetchMensagens(conversaAtiva.id), 5000);
      return () => clearInterval(interval);
    }
  }, [conversaAtiva]);

  useEffect(scrollToBottom, [mensagens]);

  const fetchConversas = async () => {
    try {
      const token = getToken();
      const response = await apiRequest('/api/chat/conversas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setConversas(await response.json());
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao carregar conversas.');
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      toast.error('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMensagens = async (conversaId) => {
    try {
      const token = getToken();
      const response = await apiRequest(`/api/chat/conversas/${conversaId}/mensagens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setMensagens(await response.json());
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao carregar mensagens.');
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast.error('Erro de conexão.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !conversaAtiva) return;

    setSending(true);
    try {
      const token = getToken();
      const response = await apiRequest(`/api/chat/conversas/${conversaAtiva.id}/mensagens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texto: novaMensagem })
      });

      if (response.ok) {
        setNovaMensagem('');
        fetchMensagens(conversaAtiva.id);
        fetchConversas(); // Atualiza a lista lateral com a última mensagem
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao enviar mensagem.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando mensagens...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Mensagens</h2>
        </div>
        <div className={styles.conversasLista}>
          {conversas.length === 0 && <p className={styles.empty}>Nenhuma conversa iniciada.</p>}
          {conversas.map(c => (
            <div 
              key={c.id} 
              className={`${styles.conversaItem} ${conversaAtiva?.id === c.id ? styles.ativa : ''}`}
              onClick={() => setConversaAtiva(c)}
            >
              <div className={styles.avatar}>
                {c.outroUsuarioNome[0]}
              </div>
              <div className={styles.conversaInfo}>
                <div className={styles.conversaHeader}>
                  <strong>{c.outroUsuarioNome}</strong>
                  <span>{new Date(c.updateDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {c.ideiaNome && (
                  <div className={styles.conversaContexto}>
                    <Rocket size={12} /> {c.ideiaNome}
                  </div>
                )}
                <p className={styles.ultimaMsg}>
                  {c.ultimaMensagem?.texto || 'Inicie a conversa...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chatArea}>
        {conversaAtiva ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.avatarGrande}>{conversaAtiva.outroUsuarioNome[0]}</div>
              <div>
                <h3>{conversaAtiva.outroUsuarioNome}</h3>
                {conversaAtiva.ideiaNome && <span className={styles.badge}>Sobre: {conversaAtiva.ideiaNome}</span>}
              </div>
            </div>

            <div className={styles.mensagensArea}>
              {mensagens.map(m => (
                <div 
                  key={m.id} 
                  className={`${styles.mensagemWrapper} ${m.remetenteId === userId ? styles.minha : styles.outra}`}
                >
                  <div className={styles.mensagem}>
                    <p>{m.texto}</p>
                    <span className={styles.hora}>
                      {new Date(m.createDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Digite sua mensagem..." 
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                disabled={sending}
              />
              <button type="submit" disabled={sending || !novaMensagem.trim()}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.noChat}>
            <MessageCircle size={64} color="#e2e8f0" />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
