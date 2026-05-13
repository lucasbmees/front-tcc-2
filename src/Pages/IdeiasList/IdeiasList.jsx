import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Search, Compass, Rocket } from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './IdeiasList.module.css';
import { apiRequest } from '../../services/api';

function IdeiasList() {
  const [ideias, setIdeias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
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

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setIdeias(data);
      } catch (error) {
        console.error('Erro ao buscar ideias:', error);
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeias();
  }, []);

  // Filtra pelo nome correto da API: idaNome
  const ideiasFiltradas = ideias.filter((ideia) =>
    (ideia.idaNome ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.blob} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <Compass size={36} className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Explorar Ideias</h1>
              <p className={styles.subtitle}>
                Descubra pitches inovadores e conecte-se com empreendedores
              </p>
            </div>
          </div>
        </div>

        {/* Barra de busca */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar ideias por nome..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.noResults}>
            <Rocket size={48} className={styles.noResultsIcon} />
            <p>Carregando ideias...</p>
          </div>
        )}

        {/* Erro */}
        {!loading && erro && (
          <div className={styles.noResults}>
            <Rocket size={48} className={styles.noResultsIcon} />
            <p style={{ color: '#e53e3e', fontWeight: 700 }}>
              Não foi possível carregar as ideias.
            </p>
            <p style={{ fontSize: 14 }}>{erro}</p>
          </div>
        )}

        {/* Sem resultados na busca */}
        {!loading && !erro && ideiasFiltradas.length === 0 && (
          <div className={styles.noResults}>
            <Lightbulb size={48} className={styles.noResultsIcon} />
            <p>
              {searchTerm
                ? `Nenhuma ideia encontrada para "${searchTerm}".`
                : 'Nenhuma ideia cadastrada ainda.'}
            </p>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && !erro && ideiasFiltradas.length > 0 && (
          <div className={styles.grid}>
            {ideiasFiltradas.map((ideia) => (
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
  );
}

export default IdeiasList;
