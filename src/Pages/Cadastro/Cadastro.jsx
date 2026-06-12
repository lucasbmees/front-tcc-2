import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Cadastro.module.css';
import logo from '../../assets/logo.png';
import { apiRequest } from '../../services/api';
import { digitsOnly, formatCpf, formatTelefone } from '../../utils/masks';

function Cadastro() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const MotionButton = motion.button;
  
  // Estado ajustado para os campos do back-end
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar_senha: '',
    cargoNome: 'empreendedor'
  });

  const applyMask = (e, formatFn) => {
    const input = e.target;
    const raw = input.value ?? '';
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    const formatted = formatFn(raw);

    setFormData(prev => ({ ...prev, [input.name]: formatted }));

    requestAnimationFrame(() => {
      const el = input;
      if (!el || typeof el.setSelectionRange !== 'function') return;
      let pos = 0;
      let digits = 0;
      while (pos < formatted.length && digits < digitsBeforeCaret) {
        if (/\d/.test(formatted[pos])) digits += 1;
        pos += 1;
      }
      el.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCpfChange = (e) => applyMask(e, formatCpf);
  const handleTelefoneChange = (e) => applyMask(e, formatTelefone);

  const handleRegister = async (e) => {
  e.preventDefault();
  
  if (formData.senha !== formData.confirmar_senha) {
    toast.error('As senhas não coincidem!');
    return;
  }

  const toastId = toast.loading('Processando cadastro...');

  try {
    // Chamada usando a rota relativa (o Proxy do Vite completa para http://localhost:5153)
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf: digitsOnly(formData.cpf),           // Campo esperado no back
        email: formData.email,       // Campo esperado no back
        telefone: digitsOnly(formData.telefone), // Campo esperado no back
        senha: formData.senha,       // Campo esperado no back
        nome: formData.nome,         // Campo esperado no back
        sobrenome: formData.sobrenome, // Campo esperado no back
        cargoNome: formData.cargoNome  // Campo esperado no back
      }),
    });

    if (response.ok) {
      toast.success('Cadastro realizado com sucesso!', { id: toastId });
      setTimeout(() => navigate('/login'), 2000);
    } else {
      const errorData = await response.json();
      toast.error(errorData.message || 'Erro ao realizar cadastro', { id: toastId });
    }
  } catch (error) {
    toast.error('Erro de conexão ou bloqueio de CORS', { id: toastId });
    console.error('Erro:', error);
  }
};

  return (
    <div className={styles.page}>
      <Toaster position="top-center" />

      <MotionDiv 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>Criar Conta</h1>
          <p className={styles.subtitle}>Preencha os dados abaixo para começar</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome</label>
            <input 
              type="text" 
              name="nome" 
              className={styles.input} 
              value={formData.nome} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Sobrenome</label>
            <input 
              type="text" 
              name="sobrenome" 
              className={styles.input} 
              value={formData.sobrenome} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input 
              type="email" 
              name="email" 
              className={styles.input} 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>CPF</label>
            <input 
              type="text" 
              name="cpf" 
              className={styles.input} 
              value={formData.cpf} 
              onChange={handleCpfChange} 
              placeholder="000.000.000-00"
              inputMode="numeric"
              pattern="[0-9]{3}[.][0-9]{3}[.][0-9]{3}[-][0-9]{2}"
              maxLength={14}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telefone</label>
            <input 
              type="text" 
              name="telefone" 
              className={styles.input} 
              value={formData.telefone} 
              onChange={handleTelefoneChange} 
              placeholder="(00) 00000-0000"
              inputMode="numeric"
              pattern="[(][0-9]{2}[)] [0-9]{4,5}[-][0-9]{4}"
              maxLength={15}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Senha</label>
            <input 
              type="password" 
              name="senha" 
              className={styles.input} 
              value={formData.senha} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirmar Senha</label>
            <input 
              type="password" 
              name="confirmar_senha" 
              className={styles.input} 
              value={formData.confirmar_senha} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tipo de Perfil</label>
            <select 
              name="cargoNome" 
              className={styles.input} 
              value={formData.cargoNome} 
              onChange={handleChange}
            >
              <option value="empreendedor">Empreendedor (ME)</option>
              <option value="investidor">Investidor</option>
            </select>
          </div>

          <MotionButton 
            type="submit" 
            className={styles.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finalizar Cadastro
          </MotionButton>
        </form>

        <div className={styles.linkArea}>
          <p className={styles.registerText}>
            Já tem uma conta? <Link to="/login" className={styles.linkHighlight}>Entrar</Link>
          </p>
        </div>
      </MotionDiv>
    </div>
  );
}

export default Cadastro;
