import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Cadastro.module.css';
import logo from '../../assets/logo.png';
import { apiRequest } from '../../services/api';

function Cadastro() {
  const navigate = useNavigate();
  
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        cpf: formData.cpf,           // Campo esperado no back
        email: formData.email,       // Campo esperado no back
        telefone: formData.telefone, // Campo esperado no back
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

      <motion.div 
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
              onChange={handleChange} 
              placeholder="000.000.000-00"
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
              onChange={handleChange} 
              placeholder="(00) 00000-0000"
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

          <motion.button 
            type="submit" 
            className={styles.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finalizar Cadastro
          </motion.button>
        </form>

        <div className={styles.linkArea}>
          <p className={styles.registerText}>
            Já tem uma conta? <Link to="/login" className={styles.linkHighlight}>Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Cadastro;