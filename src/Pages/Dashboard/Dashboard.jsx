import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, Star, ChevronRight, Rocket, 
  MessageSquare, FileText, PlusCircle, TrendingUp, User 
} from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './Dashboard.module.css';
import { apiRequest } from '../../services/api';
import { getToken, getRoleFromToken } from '../../utils/auth';

function Dashboard() {
  const [destaques, setDestaques] = useState([]);
  const [stats, setStats] = useState({ propostas: 0, mensagens: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = getToken();
  const role = (getRoleFromToken(token) || '').toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resIdeias, resPropostas, resConversas] = await Promise.all([
  token ? apiRequest('/api/ideias', {
    headers: { Authorization: `Bearer ${token}` }
  }) : Promise.resolve({ ok: false }),

  token ? apiRequest(role === 'empreendedor' ? '/api/propostas/recebidas' : '/api/propostas/minhas', {
    headers: { Authorization: `Bearer ${token}` }
  }) : Promise.resolve({ ok: false }),

  token ? apiRequest('/api/chat/conversas', {
    headers: { Authorization: `Bearer ${token}` }
  }) : Promise.resolve({ ok: false })
]);

        if (resIdeias.ok) {
          const data = await resIdeias.json();
          const embaralhadas = [...data].sort(() => 0.5 - Math.random());
          setDestaques(embaralhadas.slice(0, 4));
        }

        let pCount = 0;
        let mCount = 0;

        if (resPropostas.ok) {
          const pData = await resPropostas.json();
          pCount = Array.isArray(pData) ? pData.length : 0;
        }

        if (resConversas.ok) {
          const cData = await resConversas.json();
          mCount = Array.isArray(cData) ? cData.length : 0;
        }

        setStats({ propostas: pCount, mensagens: mCount });

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, role]);

  return (
    <div className={styles.page}>
      <div className={styles.blob} />

      <div className={styles.container}>
        {/* Header de Boas-vindas */}
        <div className={styles.header}>
          <div className={styles.welcomeText}>
            <p className={styles.highlight}>Painel de Controle</p>
            <h1>Olá, que bom ter você aqui!</h1>
            <p className={styles.subtitle}>
              Acompanhe suas conexões e descubra novas oportunidades no ecossistema Shark Tank.
            </p>
          </div>
          
          {role === 'empreendedor' && (
            <button className={styles.btnAction} onClick={() => navigate('/criar-ideia')}>
              <PlusCircle size={20} /> Publicar Nova Ideia
            </button>
          )}
          {role === 'investidor' && (
            <button className={styles.btnAction} onClick={() => navigate('/ideias')}>
              <Compass size={20} /> Explorar Oportunidades
            </button>
          )}
        </div>

        {/* Cards de Resumo Rápido */}
        {token && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard} onClick={() => navigate('/minhas-propostas')}>
              <div className={styles.statIcon} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <FileText size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3>{stats.propostas}</h3>
                <span>Propostas {role === 'empreendedor' ? 'Recebidas' : 'Enviadas'}</span>
              </div>
              <ChevronRight size={20} color="#94a3b8" />
            </div>

            <div className={styles.statCard} onClick={() => navigate('/chat')}>
              <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#15803d' }}>
                <MessageSquare size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3>{stats.mensagens}</h3>
                <span>Conversas Ativas</span>
              </div>
              <ChevronRight size={20} color="#94a3b8" />
            </div>

            <div className={styles.statCard} onClick={() => navigate('/ideias')}>
              <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#b45309' }}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3>Explorar</h3>
                <span>Tendências do Mercado</span>
              </div>
              <ChevronRight size={20} color="#94a3b8" />
            </div>

            <div className={styles.statCard} onClick={() => navigate('/perfil')}>
              <div className={styles.statIcon} style={{ background: '#f1f5f9', color: '#475569' }}>
                <User size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3>Meu Perfil</h3>
                <span>Gerenciar Dados</span>
              </div>
              <ChevronRight size={20} color="#94a3b8" />
            </div>
          </div>
        )}

        {/* Seção de destaques */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.starCircle}>
                <Star size={18} color="#f59e0b" fill="#f59e0b" />
              </span>
              Ideias em Destaque
            </h2>
            <button className={styles.viewAll} onClick={() => navigate('/ideias')}>
              Ver todas <ChevronRight size={16} />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.emptyState}>
              <Rocket size={40} className={styles.loadingIcon} />
              <p>Carregando as melhores oportunidades...</p>
            </div>
          )}

          {/* Sem ideias */}
          {!loading && destaques.length === 0 && (
            <div className={styles.emptyState}>
              <Compass size={40} opacity={0.3} />
              <p>Nenhuma ideia encontrada para destaque no momento.</p>
              <button onClick={() => navigate('/ideias')} className={styles.btnSecondary}>
                Explorar Catálogo Completo
              </button>
            </div>
          )}

          {/* Grid de cards */}
          {!loading && destaques.length > 0 && (
            <div className={styles.grid}>
              {destaques.map((ideia) => (
                <IdeiaCard
                  key={ideia.idaId}
                  ideia={ideia}
                  variant="default"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
