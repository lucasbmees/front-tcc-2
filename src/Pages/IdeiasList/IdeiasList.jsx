import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Rocket, Filter, X, Sparkles, Send } from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './IdeiasList.module.css';
import { apiRequest } from '../../services/api';
import { getToken, getRoleFromToken, getPlanFromToken } from '../../utils/auth';

const CATEGORIAS = [
  { id: 1, nome: 'Tecnologia' },
  { id: 2, nome: 'Agro' },
  { id: 3, nome: 'Inovação' },
  { id: 4, nome: 'Infraestrutura' },
  { id: 5, nome: 'Moda' },
  { id: 6, nome: 'Automobilismo' },
  { id: 7, nome: 'Sustentabilidade' },
  { id: 8, nome: 'Comodidade' },
  { id: 9, nome: 'Lazer' },
  { id: 10, nome: 'Uso Diário' },
  { id: 11, nome: 'Moradia' },
  { id: 12, nome: 'Energia' },
  { id: 13, nome: 'Marítimo' },
  { id: 14, nome: 'Aeronáutico' },
  { id: 15, nome: 'Outros' },
];

const ESTAGIOS = [
  { id: 1, nome: 'Ideação' },
  { id: 2, nome: 'MVP' },
  { id: 3, nome: 'Tração' },
  { id: 4, nome: 'Scale-up' },
];

function IdeiasList() {
  const [ideias, setIdeias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estagioId, setEstagioId] = useState('');
  const [regiao, setRegiao] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [apenasComDocumentos, setApenasComDocumentos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiTyping, setAiTyping] = useState(false);

  const chatContainerRef = useRef(null);

  const token = getToken();
  const role = (getRoleFromToken(token) || '').toLowerCase();
  const plan = (getPlanFromToken(token) || '').toLowerCase();
  const isEliteInvestidor = role === 'investidor' && plan === 'elite';

  const scrollChatToBottom = () => {
  const container = chatContainerRef.current;
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
};

  useEffect(() => {
  if (isAiOpen) {
    scrollChatToBottom();
  }
}, [chatHistory, aiTyping, isAiOpen]);

  const fetchIdeias = async () => {
    setLoading(true);
    setErro(null);

    try {
      const params = new URLSearchParams();

      if (searchTerm) params.append('termo', searchTerm);
      if (categoriaId) params.append('categoriaId', categoriaId);
      if (estagioId) params.append('estagioId', estagioId);
      if (regiao) params.append('regiao', regiao);
      if (valorMin) params.append('valorMin', valorMin);
      if (valorMax) params.append('valorMax', valorMax);
      if (apenasComDocumentos && isEliteInvestidor) {
        params.append('apenasComDocumentos', 'true');
      }

      const response = await apiRequest(`/api/ideias?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      setIdeias(data);
    } catch (error) {
      setErro(error.message || 'Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscaIA = async (e) => {
    if (e) e.preventDefault();

    const textToSend = chatInput.trim() || searchTerm.trim();
    if (!textToSend) return;

    setIsAiOpen(true);
    setAiTyping(true);
    setChatHistory((prev) => [
      ...prev,
      { role: 'user', content: textToSend },
    ]);
    setSearchTerm('');
    setChatInput('');

    try {
      const response = await apiRequest(
        `/api/ideias/busca-ia?termo=${encodeURIComponent(textToSend)}`,
        {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Encontrei ${data.length} projeto${data.length !== 1 ? 's' : ''} que correspondem à sua análise de "${textToSend}".`,
          results: data,
        },
      ]);

      setIdeias(data);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Falha na busca por inteligência artificial. Tente novamente.',
        },
      ]);
    } finally {
      setAiTyping(false);
    }
  };

  useEffect(() => {
    fetchIdeias();
  }, [categoriaId, estagioId, regiao, valorMin, valorMax, apenasComDocumentos]);

  return (
    <div className={styles.page}>
      <div className={styles.blob} />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Compass size={36} strokeWidth={1.8} />
          </div>
          <h1 className={styles.title}>Explorar Projetos</h1>
          <p className={styles.subtitle}>
            Busca inteligente para conexões de alto impacto
          </p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar projetos, startups, segmentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchIdeias()}
              />
            </div>

            <button
              type="button"
              className={`${styles.filterToggleBtn} ${showAdvanced ? styles.active : ''}`}
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <Filter size={16} />
              Filtros
            </button>

            <button
              type="button"
              className={styles.aiButton}
              onClick={handleBuscaIA}
            >
              <Sparkles size={18} />
              Busca IA
            </button>
          </div>

          <div className={styles.categoryContainer}>
            <p className={styles.categoryLabel}>Categorias</p>

            <div className={styles.categoryPills}>
              <button
                type="button"
                className={`${styles.pill} ${categoriaId === '' ? styles.pillActive : ''}`}
                onClick={() => setCategoriaId('')}
              >
                Todos
              </button>

              {CATEGORIAS.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`${styles.pill} ${categoriaId === String(cat.id) ? styles.pillActive : ''}`}
                  onClick={() =>
                    setCategoriaId(categoriaId === String(cat.id) ? '' : String(cat.id))
                  }
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          </div>

          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Estágio</label>
                <select
                  className={styles.filterSelect}
                  value={estagioId}
                  onChange={(e) => setEstagioId(e.target.value)}
                >
                  <option value="">Todos os estágios</option>
                  {ESTAGIOS.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Região</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Ex: São Paulo, Sul..."
                  value={regiao}
                  onChange={(e) => setRegiao(e.target.value)}
                />
              </div>

              <div className={`${styles.filterGroup} ${styles.valueRangeGroup}`}>
                <label className={styles.filterLabel}>Aporte (R$)</label>

                <div className={styles.valueRangeInputs}>
                  <input
                    type="number"
                    className={styles.filterInput}
                    placeholder="Mín"
                    value={valorMin}
                    onChange={(e) => setValorMin(e.target.value)}
                  />
                  <span className={styles.valueRangeSeparator}>–</span>
                  <input
                    type="number"
                    className={styles.filterInput}
                    placeholder="Máx"
                    value={valorMax}
                    onChange={(e) => setValorMax(e.target.value)}
                  />
                </div>
              </div>

              {isEliteInvestidor && (
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Documentos</label>

                  <label className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      checked={apenasComDocumentos}
                      onChange={(e) => setApenasComDocumentos(e.target.checked)}
                    />
                    <span className={styles.checkboxLabel}>
                      Apenas com documentos
                    </span>
                    <span className={styles.eliteBadge}>Elite</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.resultsArea}>
            {erro && (
              <div className={styles.errorArea}>
                <X size={16} />
                <span>Erro ao carregar projetos: {erro}</span>
              </div>
            )}

            {loading ? (
              <div className={styles.loadingArea}>
                <div className={styles.spinner} />
                <p>Carregando projetos...</p>
              </div>
            ) : ideias.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Rocket size={26} strokeWidth={1.6} />
                </div>
                <p className={styles.emptyStateTitle}>Nenhum projeto encontrado</p>
                <p className={styles.emptyStateText}>
                  Tente ajustar os filtros ou use a busca por IA para encontrar oportunidades.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.resultsHeader}>
                  <span className={styles.resultsCount}>
                    {ideias.length} projeto{ideias.length !== 1 ? 's' : ''} encontrado{ideias.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.grid}>
                  {ideias.map((ideia) => (
                    <IdeiaCard key={ideia.id} ideia={ideia} />
                  ))}
                </div>
              </>
            )}
          </div>

          {isAiOpen && (
            <aside className={styles.aiSidebar}>
              <div className={styles.aiSidebarHeader}>
                <div className={styles.aiSidebarTitle}>
                  <Sparkles size={18} />
                  <span>Busca por IA</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.aiSidebarBadge}>Beta</span>
                  <button
                    type="button"
                    className={styles.aiSidebarClose}
                    onClick={() => setIsAiOpen(false)}
                    aria-label="Fechar chat"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.chatContainer} ref={chatContainerRef}>
                {chatHistory.length === 0 && (
                  <div className={styles.chatEmptyState}>
                    <div className={styles.chatEmptyIcon}>
                      <Sparkles size={22} />
                    </div>
                    <p className={styles.chatEmptyTitle}>Assistente de Busca</p>
                    <p className={styles.chatEmptyText}>
                      Descreva o tipo de projeto que você procura e a IA encontra para você.
                    </p>
                  </div>
                )}

                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}
                  >
                    {msg.content}
                  </div>
                ))}

                {aiTyping && (
                  <div className={styles.typing}>
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>

              <form className={styles.aiFooter} onSubmit={handleBuscaIA}>
                <input
                  type="text"
                  className={styles.aiFooterInput}
                  placeholder="Descreva o que busca..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={aiTyping}
                />

                <button
                  type="submit"
                  className={styles.aiFooterSend}
                  disabled={aiTyping || !chatInput.trim()}
                  aria-label="Enviar mensagem"
                >
                  <Send size={16} />
                </button>
              </form>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdeiasList;
