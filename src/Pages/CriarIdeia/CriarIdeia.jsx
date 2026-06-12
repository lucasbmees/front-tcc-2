import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowLeft, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './CriarIdeia.module.css';
import { apiRequest } from '../../services/api';
import { digitsOnly, formatCnpj } from '../../utils/masks';

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

function CriarIdeia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const MotionForm = motion.form;
  const MotionButton = motion.button;

  const [formData, setFormData] = useState({
    categoriaId: '',
    estagioId: '',
    nome: '',
    regiao: '',
    cnpj: '',
    descricao: '',
    linkVideo: '',
    imagem: '',
    fatia: '',
    valorCaptacao: '',
    faturamento: '',
    custosMensais: '',
    tempoMercadoMeses: '',
    quantidadeClientes: '',
    feedbackClientes: '',
  });

  const [erros, setErros] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatCnpj(value) }));
      if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.nome.trim())      novosErros.nome      = 'O nome é obrigatório.';
    if (!digitsOnly(formData.cnpj)) novosErros.cnpj      = 'O CNPJ é obrigatório.';
    if (!formData.descricao.trim())  novosErros.descricao = 'A descrição é obrigatória.';
    if (!formData.fatia)            novosErros.fatia     = 'Informe a fatia (%) oferecida.';
    if (!formData.valorCaptacao)    novosErros.valorCaptacao = 'Informe o valor de captação.';
    if (!formData.categoriaId)      novosErros.categoriaId = 'Selecione uma categoria.';
    if (!formData.estagioId)        novosErros.estagioId   = 'Selecione um estágio.';
    return novosErros;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Você precisa estar logado.');
      return;
    }

    const toastId = toast.loading('Publicando sua ideia...');
    setLoading(true);

    try {
      const response = await apiRequest('/api/ideias', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoriaId:   parseInt(formData.categoriaId),
          estagioId:     parseInt(formData.estagioId),
          nome:          formData.nome,
          regiao:        formData.regiao,
          cnpj:          formData.cnpj,
          descricao:     formData.descricao,
          linkVideo:     formData.linkVideo,
          imagem:        formData.imagem,
          fatia:         parseFloat(formData.fatia),
          valorCaptacao: parseFloat(formData.valorCaptacao),
          faturamento: formData.faturamento ? parseFloat(formData.faturamento) : null,
          custosMensais: formData.custosMensais ? parseFloat(formData.custosMensais) : null,
          tempoMercadoMeses: formData.tempoMercadoMeses ? parseInt(formData.tempoMercadoMeses) : null,
          quantidadeClientes: formData.quantidadeClientes ? parseInt(formData.quantidadeClientes) : null,
          feedbackClientes: formData.feedbackClientes?.trim() ? formData.feedbackClientes : null,
        }),
      });

      if (response.ok) {
        toast.success('Ideia publicada com sucesso!', { id: toastId });
        setTimeout(() => navigate('/minhas-ideias'), 1200);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao publicar ideia.', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-center" />
      <div className={styles.blob} />

      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.btnVoltar} onClick={() => navigate('/minhas-ideias')}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className={styles.titleArea}>
            <div className={styles.titleWithIcon}>
              <Lightbulb size={32} className={styles.headerIcon} />
              <h1>Nova Ideia</h1>
            </div>
            <p className={styles.subtitle}>Preencha os dados do seu pitch e publique para os investidores</p>
          </div>
        </div>

        {/* Formulário */}
        <MotionForm
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >

          <div className={styles.grid}>
            {/* Nome */}
            <div className={styles.inputGroup}>
              <label>Título da Ideia</label>
              <input
                type="text"
                name="nome"
                placeholder="Ex: App de Logística Inteligente"
                value={formData.nome}
                onChange={handleChange}
                className={erros.nome ? styles.inputError : ''}
              />
              {erros.nome && <span className={styles.errorText}>{erros.nome}</span>}
            </div>

            {/* Regiao */}
            <div className={styles.inputGroup}>
              <label>Região (Cidade/Estado)</label>
              <input
                type="text"
                name="regiao"
                placeholder="Ex: São Paulo, SP"
                value={formData.regiao}
                onChange={handleChange}
              />
            </div>

            {/* Categoria */}
            <div className={styles.inputGroup}>
              <label>Categoria</label>
              <select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleChange}
                className={erros.categoriaId ? styles.inputError : ''}
              >
                <option value="">Selecione...</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              {erros.categoriaId && <span className={styles.errorText}>{erros.categoriaId}</span>}
            </div>

            {/* Estagio */}
            <div className={styles.inputGroup}>
              <label>Estágio Atual</label>
              <select
                name="estagioId"
                value={formData.estagioId}
                onChange={handleChange}
                className={erros.estagioId ? styles.inputError : ''}
              >
                <option value="">Selecione...</option>
                {ESTAGIOS.map(est => (
                  <option key={est.id} value={est.id}>{est.nome}</option>
                ))}
              </select>
              {erros.estagioId && <span className={styles.errorText}>{erros.estagioId}</span>}
            </div>

            {/* CNPJ */}
            <div className={styles.inputGroup}>
              <label>CNPJ da Startup</label>
              <input
                type="text"
                name="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={handleChange}
                className={erros.cnpj ? styles.inputError : ''}
                inputMode="numeric"
                pattern="[0-9]{2}[.][0-9]{3}[.][0-9]{3}[/][0-9]{4}[-][0-9]{2}"
              />
              {erros.cnpj && <span className={styles.errorText}>{erros.cnpj}</span>}
            </div>

            {/* Fatia */}
            <div className={styles.inputGroup}>
              <label>Fatia Oferecida (%)</label>
              <input
                type="number"
                name="fatia"
                placeholder="Ex: 10"
                value={formData.fatia}
                onChange={handleChange}
                className={erros.fatia ? styles.inputError : ''}
              />
              {erros.fatia && <span className={styles.errorText}>{erros.fatia}</span>}
            </div>

            {/* Valor Captacao */}
            <div className={styles.inputGroup}>
              <label>Valor de Captação (R$)</label>
              <input
                type="number"
                name="valorCaptacao"
                placeholder="Ex: 500000"
                value={formData.valorCaptacao}
                onChange={handleChange}
                className={erros.valorCaptacao ? styles.inputError : ''}
              />
              {erros.valorCaptacao && <span className={styles.errorText}>{erros.valorCaptacao}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label>Faturamento (R$) (opcional)</label>
              <input
                type="number"
                name="faturamento"
                placeholder="Ex: 120000"
                value={formData.faturamento}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Custos mensais (R$) (opcional)</label>
              <input
                type="number"
                name="custosMensais"
                placeholder="Ex: 35000"
                value={formData.custosMensais}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Tempo de mercado (meses) (opcional)</label>
              <input
                type="number"
                name="tempoMercadoMeses"
                placeholder="Ex: 18"
                value={formData.tempoMercadoMeses}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Quantidade de clientes (opcional)</label>
              <input
                type="number"
                name="quantidadeClientes"
                placeholder="Ex: 250"
                value={formData.quantidadeClientes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Descrição *</label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={`${styles.textarea} ${erros.descricao ? styles.inputError : ''}`}
              placeholder="Descreva sua ideia, o problema que resolve e seus diferenciais..."
              rows={5}
            />
            {erros.descricao && <span className={styles.error}>{erros.descricao}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Feedback de clientes (opcional)</label>
            <textarea
              name="feedbackClientes"
              value={formData.feedbackClientes}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Ex: Principais elogios, críticas e aprendizados com clientes..."
              rows={4}
            />
          </div>



          {/* Link do Vídeo e Imagem lado a lado */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Link do Vídeo (opcional)</label>
              <input
                type="text"
                name="linkVideo"
                value={formData.linkVideo}
                onChange={handleChange}
                className={styles.input}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>URL da Imagem (opcional)</label>
              <input
                type="text"
                name="imagem"
                value={formData.imagem}
                onChange={handleChange}
                className={styles.input}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancelar}
              onClick={() => navigate('/minhas-ideias')}
            >
              Cancelar
            </button>
            <MotionButton
              type="submit"
              className={styles.btnPublicar}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Send size={18} />
              {loading ? 'Publicando...' : 'Publicar Ideia'}
            </MotionButton>
          </div>

        </MotionForm>
      </div>
    </div>
  );
}

export default CriarIdeia;
