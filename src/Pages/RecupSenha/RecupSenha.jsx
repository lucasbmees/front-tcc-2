import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import styles from './RecupSenha.module.css';
import logo from '../../assets/logo.png'; // Verifique se o caminho da logo está correto
import { apiRequest } from '../../services/api';

function RecupSenha() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [sending, setSending] = useState(false);

  const handleRecuperar = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    const toastId = toast.loading('Enviando instruções...');
    try {
      const res = await apiRequest('/api/auth/recuperar-senha', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.success(data.mensagem ?? 'Instruções enviadas.', { id: toastId });
        if (data.token) setToken(String(data.token));
        setStep(2);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao enviar instruções.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  const handleRedefinir = async (e) => {
    e.preventDefault();

    const t = token.trim();
    if (!t) {
      toast.error('Informe o token.');
      return;
    }
    if (!novaSenha.trim() || novaSenha.trim().length < 6) {
      toast.error('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setSending(true);
    const toastId = toast.loading('Redefinindo senha...');
    try {
      const res = await apiRequest('/api/auth/redefinir-senha', {
        method: 'POST',
        body: JSON.stringify({ token: t, novaSenha }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.success(data.mensagem ?? 'Senha redefinida com sucesso.', { id: toastId });
        setTimeout(() => navigate('/login'), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message ?? err.title ?? 'Erro ao redefinir senha.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão com o servidor.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>Recuperar Senha</h1>
          <p className={styles.subtitle}>
            {step === 1
              ? 'Insira seu e-mail para receber as instruções de redefinição.'
              : 'Informe o token recebido e defina sua nova senha.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRecuperar}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                placeholder="Ex: seuemail@dominio.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>

            <button type="submit" className={styles.button} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Token de Recuperação'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRedefinir}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Token</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Cole aqui o token recebido"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nova Senha</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Mínimo 6 caracteres"
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmar Senha</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Repita a nova senha"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                disabled={sending}
              />
            </div>

            <button type="submit" className={styles.button} disabled={sending}>
              {sending ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        )}

        <div className={styles.linkArea}>
          <Link to="/login" className={styles.link}>
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecupSenha;
