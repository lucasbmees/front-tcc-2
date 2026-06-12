import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Rocket, 
  AlertTriangle, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { getToken } from '../../utils/auth';
import { toast } from 'react-hot-toast';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    try {
      const [resStats, resDenuncias] = await Promise.all([
        apiRequest('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        apiRequest('/api/admin/denuncias', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resDenuncias.ok) setDenuncias(await resDenuncias.json());
    } catch {
      toast.error('Erro ao carregar dados administrativos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalisarDenuncia = async (id, status) => {
    const token = getToken();
    try {
      const response = await apiRequest(`/api/admin/denuncias/${id}/analisar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, observacaoAdm: "Analisado pelo administrador." })
      });

      if (response.ok) {
        toast.success(`Denúncia ${status.toLowerCase()} com sucesso!`);
        fetchData();
      }
    } catch {
      toast.error('Erro ao processar denúncia.');
    }
  };

  if (loading) return <div className={styles.loading}>Carregando dashboard...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard Administrativo</h1>
        <p>Visão geral da plataforma e moderação de conteúdo.</p>
      </header>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <span>Investimentos Aceitos</span>
            <h3>{stats?.totalInvestimentoProposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Rocket size={24} />
          </div>
          <div className={styles.statContent}>
            <span>Total de Startups</span>
            <h3>{stats?.totalStartups}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statContent}>
            <span>Taxa de Conversão</span>
            <h3>{stats?.taxaConversao}%</h3>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Gráfico Simulado (Volume Mensal) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <BarChart3 size={20} />
            <h2>Volume de Startups (Últimos Meses)</h2>
          </div>
          <div className={styles.chartArea}>
            {stats?.volumeStartupsMensal.map((item, idx) => (
              <div key={idx} className={styles.chartBarWrapper}>
                <div 
                  className={styles.chartBar} 
                  style={{ height: `${(item.quantidade / Math.max(...stats.volumeStartupsMensal.map(v => v.quantidade), 1)) * 100}%` }}
                >
                  <span className={styles.barValue}>{item.quantidade}</span>
                </div>
                <span className={styles.barLabel}>{item.mes}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Fila de Denúncias */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <AlertTriangle size={20} color="#ef4444" />
            <h2>Fila de Moderação</h2>
          </div>
          <div className={styles.denunciasList}>
            {denuncias.length === 0 && <p className={styles.empty}>Nenhuma denúncia pendente.</p>}
            {denuncias.map(d => (
              <div key={d.id} className={styles.denunciaItem}>
                <div className={styles.denunciaHeader}>
                  {String(d.tipoAlvo ?? '').toLowerCase().includes('ideia') ? (
                    <button
                      type="button"
                      className={styles.denunciaBadge}
                      onClick={() => navigate(`/ideia/${d.alvoId}`)}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Ver ideia"
                    >
                      {d.tipoAlvo} #{d.alvoId}
                    </button>
                  ) : (
                    <span className={styles.denunciaBadge}>{d.tipoAlvo} #{d.alvoId}</span>
                  )}
                  <span className={`${styles.statusBadge} ${styles[d.status.toLowerCase()]}`}>{d.status}</span>
                </div>
                <p><strong>Motivo:</strong> {d.motivo}</p>
                <div className={styles.denunciaFooter}>
                  <span>Por: {d.denuncianteNome}</span>
                  {d.status === 'Pendente' && (
                    <div className={styles.denunciaActions}>
                      <button onClick={() => handleAnalisarDenuncia(d.id, 'Analisada')} title="Marcar como Analisada">
                        <CheckCircle size={18} color="#22c55e" />
                      </button>
                      <button onClick={() => handleAnalisarDenuncia(d.id, 'Arquivada')} title="Arquivar">
                        <XCircle size={18} color="#94a3b8" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
