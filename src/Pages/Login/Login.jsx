import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import styles from "./Login.module.css";
import logo from "../../assets/logo.png";
import { apiRequest } from '../../services/api';


function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});

  const validar = () => {
    const novosErros = {};
    if (!email.trim()) {
      novosErros.email = "O campo de email é obrigatório.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      novosErros.email = "Digite um email válido.";
    }

    if (!senha.trim()) {
      novosErros.senha = "O campo de senha é obrigatório.";
    } else if (senha.length < 6) {
      novosErros.senha = "A senha deve ter pelo menos 6 caracteres.";
    }
    return novosErros;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const novosErros = validar();
    setErros(novosErros);

    if (Object.keys(novosErros).length === 0) {
      const toastId = toast.loading("A verificar credenciais...");

      try {
        // Usando a porta 5153 que localizámos no seu terminal
        const response = await apiRequest("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            senha: senha,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          localStorage.setItem("token", data.token);

          const payload = JSON.parse(atob(data.token.split(".")[1]));
          const userId =
            payload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ];

          localStorage.setItem("user", JSON.stringify({ id: userId }));

          toast.success("Login bem-sucedido!", { id: toastId });
          setTimeout(() => navigate("/"), 1500);
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "Credenciais inválidas.", { id: toastId });
        }
      } catch (error) {
        toast.error(
          "Erro ao conectar ao servidor. Verifique se o back-end está ligado.",
          { id: toastId },
        );
        console.error("Erro de Login:", error);
      }
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-center" />
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.header}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Aceda à sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`${styles.input} ${erros.email ? styles.inputError : ""}`}
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {erros.email && <span className={styles.error}>{erros.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="senha" className={styles.label}>
              Senha
            </label>
            <input
              type="password"
              id="senha"
              className={`${styles.input} ${erros.senha ? styles.inputError : ""}`}
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            {erros.senha && <span className={styles.error}>{erros.senha}</span>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={styles.button}
          >
            Entrar
          </motion.button>
        </form>

        <div className={styles.linksArea}>
          <Link to="/recup-senha" className={styles.link}>
            Esqueci minha senha
          </Link>
          <p className={styles.registerText}>
            Não tem conta?{" "}
            <Link to="/cadastro" className={styles.linkHighlight}>
              Criar conta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
