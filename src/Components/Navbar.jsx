import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToken, getRoleFromToken } from '../utils/auth';
import styles from './Navbar.module.css';
import logo from '../assets/logo.png';

function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();
  const MotionDiv = motion.div;

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const fetchTudo = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const resNtf = await fetch('/api/notificacoes/minhas', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resNtf.ok) {
      const raw = await resNtf.json();
      const normalizado = raw
        .map(n => ({
          ntfId:      n.NtfId      ?? n.ntfId,
          tipoId:     n.TipoId     ?? n.tipoId,
          tipoNome:   n.TipoNome   ?? n.tipoNome,
          mensagem:   n.Mensagem   ?? n.mensagem   ?? '(sem mensagem)',
          lida:       n.Lida       ?? n.lida       ?? false,
          createDate: n.CreateDate ?? n.createDate,
        }))
        // Remove notificações do tipo "prp recebida" (tipoId 5) — redundante para o empreendedor
        .filter(n => n.tipoId !== 5);
      setNotificacoes(normalizado);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(fetchTudo, 0);
    const interval = setInterval(fetchTudo, 30000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchTudo]);

  const temNaoLidas = notificacoes.some(n => !n.lida);

  const handleNotificationClick = async (notificacao) => {
    const token = getToken();
    setShowNotifications(false);

    try {
      if (notificacao.ntfId) {
        fetch(`/api/notificacoes/${notificacao.ntfId}/lida`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
          if (res.ok) {
            setNotificacoes(prev =>
              prev.map(n => n.ntfId === notificacao.ntfId ? { ...n, lida: true } : n)
            );
          }
        });
      }

      const tipoId   = notificacao.tipoId;
      const tipoNome = (notificacao.tipoNome ?? '').toLowerCase();

      // Notificações do investidor (aceita/recusada/contraproposta) → minhas-propostas
      if ([1, 2, 6].includes(tipoId) || tipoNome.startsWith('prp')) {
        navigate('/minhas-propostas');
        return;
      }

      // Alerta com #ID na mensagem (ex: contraproposta do empreendedor) → responder-proposta
      const ideiaId = (notificacao.mensagem ?? '').match(/ideia\s*#(\d+)/i)?.[1];
      if (ideiaId) {
        navigate(`/responder-proposta/${ideiaId}`);
        return;
      }

      navigate('/dashboard');
    } catch {
      toast.error('Erro de conexão.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard',        label: 'Home' },
    { to: '/ideias',           label: 'Ideias' },
    { to: '/minhas-ideias',    label: 'Minhas Ideias' },
    { to: '/chat',             label: 'Mensagens' },
    { to: '/premium',          label: 'Premium' },
    { to: '/minhas-propostas', label: 'Minhas Propostas' },
    { to: '/perfil',           label: 'Meu Perfil' },
  ];

  const isAdmin = (getRoleFromToken(getToken() || '') || '').toLowerCase() === 'adm';
  if (isAdmin) {
    navLinks.unshift({ to: '/admin/dashboard', label: 'Dashboard ADM' });
  }

  return (
    <nav className={styles.navbar}>
      <Link to="/dashboard" className={styles.logo}>
        <img src={logo} alt="Logo" height={65} />
      </Link>

      {/* Links desktop */}
      <div className={`${styles.links} ${styles.desktopOnly}`}>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Ações desktop */}
      <div className={`${styles.actions} ${styles.desktopOnly}`}>

        {/* Sino */}
        <div className={styles.iconWrapper}>
          <button
            className={styles.iconButton}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificações"
          >
            <Bell size={22} />
            {temNaoLidas && <span className={styles.badge} />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <MotionDiv
                className={styles.popup}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className={styles.popupHeader}>
                  <h4>Notificações</h4>
                </div>

                {notificacoes.length === 0 ? (
                  <p className={styles.emptyState}>
                    Você não tem novas notificações no momento.
                  </p>
                ) : (
                  <ul className={styles.notificationList}>
                    {notificacoes.map(n => (
                      <li
                        key={n.ntfId}
                        className={styles.notificationItem}
                        style={{ cursor: 'pointer', opacity: n.lida ? 0.55 : 1 }}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <p className={styles.ntfMessage}>{n.mensagem}</p>
                        {n.createDate && (
                          <span className={styles.ntfDate}>
                            {new Date(n.createDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={18} />
          Sair
        </button>
      </div>

      {/* Botão hamburguer mobile */}
      <button
        className={styles.menuMobile}
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={26} />
      </button>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <MotionDiv
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <MotionDiv
              className={styles.mobileOnly}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className={styles.mobileHeader}>
                <button
                  className={styles.closeButton}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={26} />
                </button>
              </div>

              <nav className={styles.mobileNav}>
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={styles.navLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <hr className={styles.divider} />

              <button className={styles.mobileLogout} onClick={handleLogout}>
                <LogOut size={18} />
                Sair da conta
              </button>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
