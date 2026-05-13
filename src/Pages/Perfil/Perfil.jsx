import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar,
  Link as LinkIcon, AlignLeft, Camera, Check, X, Edit2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './Perfil.module.css';
import { apiRequest } from '../../services/api';

function Perfil() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    descricao: '',
    cep: '',
    dataNascimento: '',
    linkRedesSociais: '',
    cargoNome: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Você precisa estar logado para ver o perfil.');
        setLoading(false);
        return;
      }

      // Extrai o id diretamente do token JWT (padrão ASP.NET)
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      } catch {
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

          // Mapeia os campos da API (prefixo "usu") para o formData
          setFormData({
            nome:             data.usuNome            || '',
            sobrenome:        data.usuSobrenome       || '',
            email:            data.usuEmail           || '',
            telefone:         data.usuTelefone        || '',
            descricao:        data.perfil             || '',
            cep:              data.usuCep             || '',
            dataNascimento:   data.usuDataNascimento
                                ? data.usuDataNascimento.split('T')[0]
                                : '',
            linkRedesSociais: data.usuLinkRedesSociais || '',
            cargoNome:        data.cargo              || '',
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

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    } catch {
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
        // Mapeia de volta para os nomes que a API espera
        body: JSON.stringify({
  request: {
    usuNome:             formData.nome,
    usuSobrenome:        formData.sobrenome,
    usuTelefone:         formData.telefone,
    usuCep:              formData.cep,
    usuDataNascimento:   formData.dataNascimento || null,
    usuLinkRedesSociais: formData.linkRedesSociais,
    perfil:              formData.descricao,
  }
}),
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!', { id: toastId });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao atualizar perfil.', { id: toastId });
      }
    } catch (error) {
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

        </div>
      </div>
    </div>
  );
}

export default Perfil;
