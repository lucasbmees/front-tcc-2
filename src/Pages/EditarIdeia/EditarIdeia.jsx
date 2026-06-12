import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Rocket, Tag, PieChart, Video, FileText, Image, ChevronLeft, Save, MessageCircle } from 'lucide-react';
import styles from './EditarIdeia.module.css';
import { apiRequest } from '../../services/api';
import { formatCnpj } from '../../utils/masks';

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

const ESTAGIOS = [
  { id: 1, nome: 'Ideação' },
  { id: 2, nome: 'MVP' },
  { id: 3, nome: 'Tração' },
  { id: 4, nome: 'Scale-up' },
];

function EditarIdeia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const MotionButton = motion.button;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [docFile, setDocFile]   = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    nome:          '',
    categoriaId:   '',
    estagioId:     '',
    regiao:        '',
    cnpj:          '',
    descricao:     '',
    fatia:         '',
    valorCaptacao: '',
    linkVideo:     '',
    imagem:        '',
    faturamento:   '',
    custosMensais: '',
    tempoMercadoMeses: '',
    quantidadeClientes: '',
    feedbackClientes: '',
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
          nome:          data.idaNome              ?? '',
          categoriaId:   String(data.idaCategoriaId ?? ''),
          estagioId:     String(data.idaEstagioId   ?? ''),
          regiao:        data.regiao                ?? '',
          cnpj:          info.idaInfoCnpj          ?? '',
          descricao:     info.idaInfoDescricao     ?? '',
          fatia:         String(info.idaInfoFatia  ?? ''),
          valorCaptacao: String(info.idaInfoValorCaptacao ?? ''),
          linkVideo:     info.idaInfoLinkVideo     ?? '',
          imagem:        info.idaInfoImagem        ?? '',
          faturamento:   String(info.idaInfoFaturamento ?? ''),
          custosMensais: String(info.idaInfoCustosMensais ?? ''),
          tempoMercadoMeses: String(info.idaInfoTempoMercadoMeses ?? ''),
          quantidadeClientes: String(info.idaInfoQuantidadeClientes ?? ''),
          feedbackClientes: info.idaInfoFeedbackClientes ?? '',
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
    if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatCnpj(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadDocumento = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Você precisa estar logado.');
      return;
    }
    if (!docFile) return;

    setUploadingDoc(true);
    const toastId = toast.loading('Enviando documento...');
    try {
      const fd = new FormData();
      fd.append('arquivo', docFile);

      const res = await fetch(`/api/ideias/${id}/documentos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        toast.success('Documento enviado!', { id: toastId });
        setDocFile(null);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao enviar documento.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
    } finally {
      setUploadingDoc(false);
    }
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome:          formData.nome,
          categoriaId:   parseInt(formData.categoriaId),
          estagioId:     parseInt(formData.estagioId),
          regiao:        formData.regiao,
          cnpj:          formData.cnpj,
          descricao:     formData.descricao,
          fatia:         parseFloat(formData.fatia),
          valorCaptacao: parseFloat(formData.valorCaptacao),
          linkVideo:     formData.linkVideo,
          imagem:        formData.imagem,
          faturamento: formData.faturamento ? parseFloat(formData.faturamento) : null,
          custosMensais: formData.custosMensais ? parseFloat(formData.custosMensais) : null,
          tempoMercadoMeses: formData.tempoMercadoMeses ? parseInt(formData.tempoMercadoMeses) : null,
          quantidadeClientes: formData.quantidadeClientes ? parseInt(formData.quantidadeClientes) : null,
          feedbackClientes: formData.feedbackClientes?.trim() ? formData.feedbackClientes : null,
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

      <MotionDiv
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

          {/* Região */}
          <div className={styles.formGroup}>
            <label className={styles.label}>📍 Região (Cidade/Estado)</label>
            <input
              type="text"
              name="regiao"
              className={styles.input}
              value={formData.regiao}
              onChange={handleChange}
              placeholder="Ex: São Paulo, SP"
            />
          </div>

          {/* Categoria + Estágio */}
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
              <label className={styles.label}>🚀 Estágio Atual</label>
              <select
                name="estagioId"
                className={styles.input}
                value={formData.estagioId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um estágio</option>
                {ESTAGIOS.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equity + Valor Captação */}
          <div className={styles.gridFields}>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>💰 Valor de Captação (R$)</label>
              <input
                type="number"
                name="valorCaptacao"
                className={styles.input}
                value={formData.valorCaptacao}
                onChange={handleChange}
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
              inputMode="numeric"
              pattern="[0-9]{2}[.][0-9]{3}[.][0-9]{3}[/][0-9]{4}[-][0-9]{2}"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}><FileText size={14} /> Documento (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              className={styles.input}
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
            <MotionButton
              type="button"
              className={styles.btnUpload}
              onClick={handleUploadDocumento}
              disabled={!docFile || uploadingDoc}
              whileHover={{ scale: uploadingDoc ? 1 : 1.02 }}
              whileTap={{ scale: uploadingDoc ? 1 : 0.98 }}
            >
              {uploadingDoc ? 'Enviando...' : 'Enviar Documento'}
            </MotionButton>
          </div>

          <div className={styles.gridFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>📈 Faturamento (R$) (opcional)</label>
              <input
                type="number"
                name="faturamento"
                className={styles.input}
                value={formData.faturamento}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>🧾 Custos mensais (R$) (opcional)</label>
              <input
                type="number"
                name="custosMensais"
                className={styles.input}
                value={formData.custosMensais}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className={styles.gridFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>⏳ Tempo de mercado (meses) (opcional)</label>
              <input
                type="number"
                name="tempoMercadoMeses"
                className={styles.input}
                value={formData.tempoMercadoMeses}
                onChange={handleChange}
                min="0"
                step="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>👥 Quantidade de clientes (opcional)</label>
              <input
                type="number"
                name="quantidadeClientes"
                className={styles.input}
                value={formData.quantidadeClientes}
                onChange={handleChange}
                min="0"
                step="1"
              />
            </div>
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

          <div className={styles.formGroup}>
            <label className={styles.label}><MessageCircle size={14} /> Feedback de clientes (opcional)</label>
            <textarea
              name="feedbackClientes"
              className={styles.textarea}
              value={formData.feedbackClientes}
              onChange={handleChange}
              rows={4}
              placeholder="Ex: Principais elogios, críticas e aprendizados com clientes..."
            />
          </div>

          <div className={styles.buttonGroup}>
            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={styles.btnSave}
              disabled={saving}
            >
              <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </MotionButton>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate('/minhas-ideias')}
            >
              Cancelar
            </button>
          </div>

        </form>
      </MotionDiv>
    </div>
  );
}

export default EditarIdeia;
