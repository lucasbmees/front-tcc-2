import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar,
  Link as LinkIcon, AlignLeft, Camera, Check, X, Edit2, CreditCard
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Perfil.module.css';
import { apiRequest } from '../../services/api';
import { getToken, getUsuarioId } from '../../utils/auth';

function Perfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagamentos, setPagamentos] = useState([]);

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    descricao: '',
    historia: '',
    cep: '',
    dataNascimento: '',
    linkRedesSociais: '',
    cargoNome: '',
    investTicketMin: '',
    investTicketMax: '',
    investInteresses: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();

      if (!token) {
        toast.error('Você precisa estar logado para ver o perfil.');
        setLoading(false);
        return;
      }

      const userId = getUsuarioId();
      if (!userId) {
        toast.error('Erro ao recuperar id do usuário pelo token.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest(`/api/usuarios/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Contrato real: UserDetailsResponse
          // { usuId, usuCpf, usuEmail, usuTelefone, usuNome, usuSobrenome, cargo, perfil: { descricao, cep, dataNasc, linkRedes } }
          setFormData({
            nome:             data.usuNome                          || '',
            sobrenome:        data.usuSobrenome                     || '',
            email:            data.usuEmail                         || '',
            telefone:         data.usuTelefone                      || '',
            descricao:        data.perfil?.descricao                || '',
            historia:        data.perfil?.historia                 || '',
            cep:              data.perfil?.cep                      || '',
            dataNascimento:   data.perfil?.dataNasc
                                ? data.perfil.dataNasc.split('T')[0]
                                : '',
            linkRedesSociais: data.perfil?.linkRedes                || '',
            cargoNome:        data.cargo                            || '',
            investTicketMin:  data.perfil?.investTicketMin          || '',
            investTicketMax:  data.perfil?.investTicketMax          || '',
            investInteresses: data.perfil?.investInteresses         || '',
            receberEmailPropostas: data.perfil?.receberEmailPropostas ?? true,
            receberEmailMensagens: data.perfil?.receberEmailMensagens ?? true,
            receberEmailAlertas:   data.perfil?.receberEmailAlertas   ?? true,
          });
        } else {
          toast.error('Não foi possível carregar os dados do perfil.');
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast.error('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    const fetchPagamentos = async () => {
      const token = getToken();
      try {
        const res = await apiRequest('/api/pagamentos/meus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setPagamentos(await res.json());
      } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
      }
    };

    fetchProfile();
    fetchPagamentos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const userId = getUsuarioId();
    if (!userId) {
      toast.error('Erro ao recuperar id do usuário pelo token.');
      return;
    }

    const toastId = toast.loading('A guardar alterações...');
    try {
      const response = await apiRequest(`/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Contrato real: UpdateUserRequest
        // { nome, sobrenome, telefone, inativar, perfil: { descricao, cep, dataNasc, linkRedes } }
        body: JSON.stringify({
          nome:      formData.nome      || null,
          sobrenome: formData.sobrenome || null,
          telefone:  formData.telefone  || null,
          inativar:  null,
          perfil: {
            descricao:        formData.descricao        || null,
            historia:        formData.historia        || null,
            cep:              formData.cep              || null,
            dataNasc:         formData.dataNascimento   || null,
            linkRedes:        formData.linkRedesSociais || null,
            investTicketMin:  formData.investTicketMin  ? parseFloat(formData.investTicketMin) : null,
            investTicketMax:  formData.investTicketMax  ? parseFloat(formData.investTicketMax) : null,
            investInteresses: formData.investInteresses || null,
            receberEmailPropostas: formData.receberEmailPropostas,
            receberEmailMensagens: formData.receberEmailMensagens,
            receberEmailAlertas:   formData.receberEmailAlertas,
          },
        }),
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!', { id: toastId });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar perfil.', { id: toastId });
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId });
    }
  };

  if (loading) return <div className={styles.loading}>A carregar...</div>;

  return (
    <div className={styles.page}>
      <Toaster position="top-center" />
      <div className={styles.blob} />

      <div className={styles.container}>

        {/* Header do Perfil */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <User size={60} color="white" />
            </div>
            <button className={styles.cameraBtn} title="Alterar foto">
              <Camera size={18} />
            </button>
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              {isEditing ? (
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={styles.inputInline}
                    placeholder="Nome"
                  />
                  <input
                    type="text"
                    name="sobrenome"
                    value={formData.sobrenome}
                    onChange={handleChange}
                    className={styles.inputInline}
                    placeholder="Sobrenome"
                  />
                </div>
              ) : (
                <h1 className={styles.userName}>
                  {formData.nome} {formData.sobrenome}
                </h1>
              )}
              {formData.cargoNome && (
                <span className={styles.badge}>{formData.cargoNome}</span>
              )}
            </div>
            <p className={styles.userEmail}>{formData.email}</p>
          </div>

          <div className={styles.actions}>
            {isEditing ? (
              <div className={styles.saveGroup}>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <Check size={18} /> Salvar
                </button>
                <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                <Edit2 size={18} /> Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Grid de Cards */}
        <div className={styles.contentGrid}>

          {/* Card: Informações de Contato */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Informações de Contato</h3>

            <div className={styles.infoRow}>
              <Mail size={18} className={styles.icon} />
              <div className={styles.field}>
                <label>Email</label>
                <p>{formData.email}</p>
              </div>
            </div>

            <div className={styles.infoRow}>
              <Phone size={18} className={styles.icon} />
              <div className={styles.field}>
                <label>Telefone</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className={styles.inputInline}
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <p>{formData.telefone || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Localização e Social */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Localização e Social</h3>

            <div className={styles.infoRow}>
              <MapPin size={18} className={styles.icon} />
              <div className={styles.field}>
                <label>CEP</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    className={styles.inputInline}
                    placeholder="00000-000"
                  />
                ) : (
                  <p>{formData.cep || 'Não informado'}</p>
                )}
              </div>
            </div>

            <div className={styles.infoRow}>
              <LinkIcon size={18} className={styles.icon} />
              <div className={styles.field}>
                <label>Redes Sociais</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="linkRedesSociais"
                    value={formData.linkRedesSociais}
                    onChange={handleChange}
                    className={styles.inputInline}
                    placeholder="https://..."
                  />
                ) : (
                  formData.linkRedesSociais ? (
                    <a
                      href={formData.linkRedesSociais.startsWith('http') ? formData.linkRedesSociais : `https://${formData.linkRedesSociais}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.link}
                    >
                      {formData.linkRedesSociais}
                    </a>
                  ) : (
                    <p>Não informado</p>
                  )
                )}
              </div>
            </div>

            <div className={styles.infoRow}>
              <Calendar size={18} className={styles.icon} />
              <div className={styles.field}>
                <label>Nascimento</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    className={styles.inputInline}
                  />
                ) : (
                  <p>{formData.dataNascimento || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Perfil de Investimento — Apenas para Investidores */}
          {formData.cargoNome.toLowerCase().includes('invest') && (
            <div className={`${styles.card} ${styles.fullWidth}`}>
              <h3 className={styles.cardTitle}>Perfil de Investimento</h3>
              <div className={styles.gridInvestor}>
                <div className={styles.infoRow}>
                  <div className={styles.field}>
                    <label>Ticket Médio Mínimo (R$)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="investTicketMin"
                        value={formData.investTicketMin}
                        onChange={handleChange}
                        className={styles.inputInline}
                        placeholder="Ex: 50000"
                      />
                    ) : (
                      <p>{formData.investTicketMin ? `R$ ${parseFloat(formData.investTicketMin).toLocaleString('pt-BR')}` : 'Não informado'}</p>
                    )}
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.field}>
                    <label>Ticket Médio Máximo (R$)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="investTicketMax"
                        value={formData.investTicketMax}
                        onChange={handleChange}
                        className={styles.inputInline}
                        placeholder="Ex: 500000"
                      />
                    ) : (
                      <p>{formData.investTicketMax ? `R$ ${parseFloat(formData.investTicketMax).toLocaleString('pt-BR')}` : 'Não informado'}</p>
                    )}
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.field} style={{ width: '100%' }}>
                    <label>Setores de Interesse</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="investInteresses"
                        value={formData.investInteresses}
                        onChange={handleChange}
                        className={styles.inputInline}
                        placeholder="Ex: SaaS, Fintech, Agro"
                      />
                    ) : (
                      <p>{formData.investInteresses || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card: Sobre Mim — largura total */}
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h3 className={styles.cardTitle}>Sobre Mim</h3>
            <div className={styles.infoRow}>
              <AlignLeft size={18} className={styles.icon} />
              <div className={styles.field} style={{ width: '100%' }}>
                {isEditing ? (
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    className={styles.textareaInline}
                    placeholder="Fale um pouco sobre você..."
                  />
                ) : (
                  <p className={styles.bioText}>
                    {formData.descricao || 'Fale um pouco sobre você...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {(formData.cargoNome || '').toLowerCase() === 'empreendedor' && (
            <div className={`${styles.card} ${styles.fullWidth}`}>
              <h3 className={styles.cardTitle}>Jornada dos Founders</h3>
              <div className={styles.infoRow}>
                <AlignLeft size={18} className={styles.icon} />
                <div className={styles.field} style={{ width: '100%' }}>
                  {isEditing ? (
                    <textarea
                      name="historia"
                      value={formData.historia}
                      onChange={handleChange}
                      className={styles.textareaInline}
                      placeholder="Conte a história: como começou, experiências anteriores, principais aprendizados e conquistas..."
                    />
                  ) : (
                    <p className={styles.bioText}>
                      {formData.historia || 'Conte sua jornada e a trajetória do time fundador.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card: Preferências de Notificação (Módulo 7) */}
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h3 className={styles.cardTitle}>Preferências de Notificação</h3>
            <div className={styles.prefsGrid}>
              <div className={styles.prefItem}>
                <label>
                  <input
                    type="checkbox"
                    name="receberEmailPropostas"
                    checked={formData.receberEmailPropostas}
                    onChange={(e) => setFormData(prev => ({ ...prev, receberEmailPropostas: e.target.checked }))}
                    disabled={!isEditing}
                  />
                  <span>Receber e-mail para novas propostas</span>
                </label>
              </div>
              <div className={styles.prefItem}>
                <label>
                  <input
                    type="checkbox"
                    name="receberEmailMensagens"
                    checked={formData.receberEmailMensagens}
                    onChange={(e) => setFormData(prev => ({ ...prev, receberEmailMensagens: e.target.checked }))}
                    disabled={!isEditing}
                  />
                  <span>Receber e-mail para novas mensagens</span>
                </label>
              </div>
              <div className={styles.prefItem}>
                <label>
                  <input
                    type="checkbox"
                    name="receberEmailAlertas"
                    checked={formData.receberEmailAlertas}
                    onChange={(e) => setFormData(prev => ({ ...prev, receberEmailAlertas: e.target.checked }))}
                    disabled={!isEditing}
                  />
                  <span>Receber e-mail para alertas administrativos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card: Histórico de Pagamentos Simulados */}
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h3 className={styles.cardTitle}>Histórico de Assinaturas (Simulado)</h3>
            <div className={styles.paymentsList}>
              {pagamentos.length === 0 && <p className={styles.empty}>Nenhuma transação simulada encontrada.</p>}
              {pagamentos.map(p => (
                <div key={p.id} className={styles.paymentItem}>
                  <div className={styles.paymentIcon}>
                    <CreditCard size={20} />
                  </div>
                  <div className={styles.paymentInfo}>
                    <strong>{p.descricao}</strong>
                    <span>{new Date(p.createDate).toLocaleDateString('pt-BR')} às {new Date(p.createDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={styles.paymentValue}>
                    <strong>{parseFloat(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    <span className={styles.statusBadge}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
