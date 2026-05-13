import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowLeft, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './CriarIdeia.module.css';
import { apiRequest } from '../../services/api';

function CriarIdeia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    categoriaId: '',
    nome: '',
    cnpj: '',
    descricao: '',
    linkVideo: '',
    imagem: '',
    fatia: '',
  });

  const [erros, setErros] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.nome.trim())     novosErros.nome     = 'O nome é obrigatório.';
    if (!formData.cnpj.trim())     novosErros.cnpj     = 'O CNPJ é obrigatório.';
    if (!formData.descricao.trim()) novosErros.descricao = 'A descrição é obrigatória.';
    if (!formData.fatia)           novosErros.fatia    = 'Informe a fatia (%) oferecida.';
    if (!formData.categoriaId)     novosErros.categoriaId = 'Selecione uma categoria.';
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
          categoriaId: parseInt(formData.categoriaId),
          nome:        formData.nome,
          cnpj:        formData.cnpj,
          descricao:   formData.descricao,
          linkVideo:   formData.linkVideo,
          imagem:      formData.imagem,
          fatia:       parseFloat(formData.fatia),
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
        <motion.form
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >

          {/* Nome */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome da Ideia / Empresa *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`${styles.input} ${erros.nome ? styles.inputError : ''}`}
              placeholder="Ex: EcoDelivery Ltda"
            />
            {erros.nome && <span className={styles.error}>{erros.nome}</span>}
          </div>

          {/* CNPJ e Categoria lado a lado */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>CNPJ *</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className={`${styles.input} ${erros.cnpj ? styles.inputError : ''}`}
                placeholder="00.000.000/0000-00"
              />
              {erros.cnpj && <span className={styles.error}>{erros.cnpj}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Categoria *</label>
              <select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleChange}
                className={`${styles.input} ${erros.categoriaId ? styles.inputError : ''}`}
              >
                <option value="">Selecione uma categoria</option>
                <option value="1">Tecnologia</option>
                <option value="2">Agro</option>
                <option value="3">Inovação</option>
                <option value="4">Infraestrutura</option>
                <option value="5">Moda</option>
                <option value="6">Automobilismo</option>
                <option value="7">Sustentabilidade</option>
                <option value="8">Comodidade</option>
                <option value="9">Lazer</option>
                <option value="10">Uso Diário</option>
                <option value="11">Moradia</option>
                <option value="12">Energia</option>
                <option value="13">Marítimo</option>
                <option value="14">Aeronáutico</option>
                <option value="15">Outros</option>
              </select>
              {erros.categoriaId && <span className={styles.error}>{erros.categoriaId}</span>}
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

          {/* Fatia */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Fatia oferecida ao investidor (%) *</label>
            <input
              type="number"
              name="fatia"
              value={formData.fatia}
              onChange={handleChange}
              className={`${styles.input} ${erros.fatia ? styles.inputError : ''}`}
              placeholder="Ex: 20"
              min="0"
              max="100"
              step="0.1"
            />
            {erros.fatia && <span className={styles.error}>{erros.fatia}</span>}
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
            <motion.button
              type="submit"
              className={styles.btnPublicar}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Send size={18} />
              {loading ? 'Publicando...' : 'Publicar Ideia'}
            </motion.button>
          </div>

        </motion.form>
      </div>
    </div>
  );
}

export default CriarIdeia;
