import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Rocket, Tag, PieChart, Video, FileText, Image, ChevronLeft, Save } from 'lucide-react';
import styles from './EditarIdeia.module.css';
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

function EditarIdeia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState({
    nome:        '',
    categoriaId: '',
    cnpj:        '',
    descricao:   '',
    fatia:       '',
    linkVideo:   '',
    imagem:      '',
  });

  // Carrega os dados reais da ideia via GET /api/ideias/:id
  useEffect(() => {
    const fetchIdeia = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await apiRequest(`/api/ideias/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || 'Não foi possível carregar a ideia.');
          navigate('/minhas-ideias');
          return;
        }

        const data = await res.json();
        const info = data.info ?? {};

        setFormData({
          nome:        data.idaNome              ?? '',
          categoriaId: String(data.idaCategoriaId ?? ''),
          cnpj:        info.idaInfoCnpj          ?? '',
          descricao:   info.idaInfoDescricao     ?? '',
          fatia:       String(info.idaInfoFatia  ?? ''),
          linkVideo:   info.idaInfoLinkVideo     ?? '',
          imagem:      info.idaInfoImagem        ?? '',
        });
      } catch {
        toast.error('Erro de conexão com o servidor.');
        navigate('/minhas-ideias');
      } finally {
        setLoading(false);
      }
    };

    fetchIdeia();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Você precisa estar logado.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Salvando alterações...');

    try {
      const res = await apiRequest(`/api/ideias/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome:        formData.nome        || null,
          categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null,
          cnpj:        formData.cnpj        || null,
          descricao:   formData.descricao   || null,
          fatia:       formData.fatia       ? parseFloat(formData.fatia) : null,
          linkVideo:   formData.linkVideo   || null,
          imagem:      formData.imagem      || null,
        }),
      });

      if (res.ok) {
        toast.success('Ideia atualizada com sucesso!', { id: toastId });
        setTimeout(() => navigate('/minhas-ideias'), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Erro ao salvar alterações.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.blob} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 120, gap: 16 }}>
        <Rocket size={48} color="#0d47a1" opacity={0.3} />
        <p style={{ color: '#64748b' }}>Carregando ideia...</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.blob} />

      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Voltar
          </button>
          <h1 className={styles.title}>Editar seu Pitch</h1>
          <p className={styles.subtitle}>Refine as informações para atrair novos investidores.</p>
        </header>

        <form onSubmit={handleSave} className={styles.form}>

          {/* Nome */}
          <div className={styles.formGroup}>
            <label className={styles.label}><Rocket size={14} /> Nome da Ideia</label>
            <input
              type="text"
              name="nome"
              className={styles.input}
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          {/* Categoria + Fatia */}
          <div className={styles.gridFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}><Tag size={14} /> Categoria</label>
              <select
                name="categoriaId"
                className={styles.input}
                value={formData.categoriaId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}><PieChart size={14} /> Equity Disponível (%)</label>
              <input
                type="number"
                name="fatia"
                className={styles.input}
                value={formData.fatia}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* CNPJ */}
          <div className={styles.formGroup}>
            <label className={styles.label}><FileText size={14} /> CNPJ</label>
            <input
              type="text"
              name="cnpj"
              className={styles.input}
              value={formData.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
            />
          </div>

          {/* Link do Vídeo */}
          <div className={styles.formGroup}>
            <label className={styles.label}><Video size={14} /> Link do Vídeo (YouTube/Vimeo)</label>
            <input
              type="text"
              name="linkVideo"
              className={styles.input}
              value={formData.linkVideo}
              onChange={handleChange}
              placeholder="https://youtube.com/..."
            />
          </div>

          {/* URL da Imagem */}
          <div className={styles.formGroup}>
            <label className={styles.label}><Image size={14} /> URL da Imagem</label>
            <input
              type="text"
              name="imagem"
              className={styles.input}
              value={formData.imagem}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          {/* Descrição */}
          <div className={styles.formGroup}>
            <label className={styles.label}><FileText size={14} /> Descrição do Projeto</label>
            <textarea
              name="descricao"
              className={styles.textarea}
              value={formData.descricao}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className={styles.buttonGroup}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={styles.btnSave}
              disabled={saving}
            >
              <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </motion.button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate('/minhas-ideias')}
            >
              Cancelar
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}

export default EditarIdeia;
