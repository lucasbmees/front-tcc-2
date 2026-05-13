import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Rocket } from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './MinhasIdeias.module.css';
import { apiRequest } from '../../services/api';

function MinhasIdeias() {
  const [minhasIdeias, setMinhasIdeias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIdeias = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Extrai o id do usuário do token JWT (padrão ASP.NET)
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId =
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          payload['sub'] ||
          payload['nameid'];
      } catch {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest('/api/ideias', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Filtra pelo campo correto da API: idaUsuarioId
        const minhas = data.filter(
          (ideia) => String(ideia.idaUsuarioId) === String(userId)
        );

        setMinhasIdeias(minhas);
      } catch (error) {
        console.error('Erro ao buscar ideias:', error);
        setErro(error.message);
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
          <div>
            <div className={styles.titleWithIcon}>
              <Briefcase size={32} className={styles.headerIcon} />
              <div className={styles.headerText}>
                <h1>Minhas Ideias</h1>
              </div>
            </div>
            <p className={styles.subtitle}>Gerencie e acompanhe seus pitches publicados</p>
          </div>

          {/* ✅ Botão com navigate para a rota de criar ideia */}
          <button className={styles.btnNew} onClick={() => navigate('/criar-ideia')}>
            <Plus size={20} />
            Nova Ideia
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.emptyState}>
            <p>Carregando suas ideias...</p>
          </div>
        )}

        {/* Erro */}
        {!loading && erro && (
          <div className={styles.emptyState}>
            <Rocket size={48} className={styles.emptyIcon} />
            <p style={{ color: '#e53e3e', marginBottom: 8 }}>
              Não foi possível carregar as ideias.
            </p>
            <p style={{ fontSize: 14, color: '#64748b' }}>{erro}</p>
          </div>
        )}

        {/* Vazio */}
        {!loading && !erro && minhasIdeias.length === 0 && (
          <div className={styles.emptyState}>
            <Rocket size={48} className={styles.emptyIcon} />
            <p>Sua próxima grande ideia começa aqui. Publique seu primeiro pitch!</p>
            <button
              className={styles.btnNew}
              style={{ margin: '20px auto 0' }}
              onClick={() => navigate('/criar-ideia')}
            >
              <Plus size={18} />
              Criar ideia
            </button>
          </div>
        )}

        {/* Grid — usa o IdeiaCard com variant="owner" */}
        {!loading && !erro && minhasIdeias.length > 0 && (
          <div className={styles.grid}>
            {minhasIdeias.map((ideia) => (
              <IdeiaCard
                key={ideia.idaId}
                ideia={ideia}
                variant="owner"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MinhasIdeias;
