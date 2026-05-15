import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Search, Compass, Rocket, Filter, X } from 'lucide-react';
import IdeiaCard from '../../Components/IdeiaCard/IdeiaCard';
import styles from './IdeiasList.module.css';
import { apiRequest } from '../../services/api';

const CATEGORIAS = [
  { id: 1,  nome: 'Tecnologia'      },
  { id: 2,  nome: 'Agro'            },
  { id: 3,  nome: 'Inovação'        },
  { id: 4,  nome: 'Infraestrutura'  },
  { id: 5,  nome: 'Moda'            },
  { id: 6,  nome: 'Automobilismo'   },
  { id: 7,  nome: 'Sustentabilidade'},
  { id: 8,  nome: 'Comodidade'      },
  { id: 9,  nome: 'Lazer'           },
  { id: 10, nome: 'Uso Diário'      },
  { id: 11, nome: 'Moradia'         },
  { id: 12, nome: 'Energia'         },
  { id: 13, nome: 'Marítimo'        },
  { id: 14, nome: 'Aeronáutico'     },
  { id: 15, nome: 'Outros'          },
];

function IdeiasList() {
  const [ideias, setIdeias]         = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIdeias = async () => {
      const token = localStorage.getItem('token');
      setLoading(true);
      setErro(null);

      try {
        const query = categoriaId ? `?categoriaId=${categoriaId}` : '';
        const response = await apiRequest(`/api/ideias${query}`, {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        setIdeias(await response.json());
      } catch (error) {
        console.error('Erro ao buscar ideias:', error);
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeias();
  }, [categoriaId]); // re-fetch sempre que a categoria mudar

  // Filtra localmente por nome após o fetch por categoria
  const ideiasFiltradas = ideias.filter((ideia) =>
    (ideia.idaNome ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const limparFiltros = () => {
    setSearchTerm('');
    setCategoriaId('');
  };

  const temFiltroAtivo = searchTerm || categoriaId;

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

        {/* Barra de busca + filtro de categoria */}
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

          <div className={styles.filterWrapper}>
            <Filter size={16} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {temFiltroAtivo && (
            <button className={styles.clearBtn} onClick={limparFiltros}>
              <X size={14} /> Limpar
            </button>
          )}
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
              {temFiltroAtivo
                ? 'Nenhuma ideia encontrada com os filtros aplicados.'
                : 'Nenhuma ideia cadastrada ainda.'}
            </p>
            {temFiltroAtivo && (
              <button className={styles.clearBtn} onClick={limparFiltros} style={{ marginTop: 12 }}>
                <X size={14} /> Limpar filtros
              </button>
            )}
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
