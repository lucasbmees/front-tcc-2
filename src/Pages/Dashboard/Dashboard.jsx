import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Star, ChevronRight, Rocket } from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './Dashboard.module.css';
import { apiRequest } from '../../services/api';

function Dashboard() {
  const [destaques, setDestaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIdeias = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await apiRequest('/api/ideias', {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Falha ao buscar ideias');

        const data = await response.json();

        // Embaralha e pega as 4 primeiras para exibir como destaques
        const embaralhadas = [...data].sort(() => 0.5 - Math.random());
        setDestaques(embaralhadas.slice(0, 4));
      } catch (error) {
        console.error('Erro ao buscar ideias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeias();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.blob} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.highlight}>Bem-vindo</p>
          <p className={styles.subtitle}>
            Conectando empreendedores e investidores que transformam ideias em realidade.
          </p>
        </div>

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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Rocket size={40} opacity={0.3} />
              <p style={{ marginTop: 12 }}>Carregando ideias...</p>
            </div>
          )}

          {/* Sem ideias */}
          {!loading && destaques.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Rocket size={40} opacity={0.3} />
              <p style={{ marginTop: 12 }}>Nenhuma ideia cadastrada ainda.</p>
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
