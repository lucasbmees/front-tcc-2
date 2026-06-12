import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Star, Eye, Edit2, TrendingUp } from 'lucide-react';
import styles from './IdeiaCard.module.css';

// ⚠️ Ajuste a rota abaixo conforme o seu App.jsx:
// Ex: '/ideia/:id'  → ROTA_IDEIA = '/ideia'
// Ex: '/ideias/:id' → ROTA_IDEIA = '/ideias'
const ROTA_IDEIA = '/ideia';
const ROTA_EDITAR = '/editar-ideia'; // ajuste se necessário

// variant: 'default' | 'owner' | 'dashboard'
function IdeiaCard({ ideia, variant = 'default' }) {
  const navigate = useNavigate();

  if (!ideia) return null;

  const id        = ideia.idaId;
  const nome      = ideia.idaNome;
  const categoria = ideia.categoriaNome;
  const estagio   = ideia.estagioNome;
  const regiao    = ideia.regiao;
  const statusId  = ideia.idaStatusId;
  const statusNome = ideia.statusNome;

  const info      = ideia.info ?? {};
  const descricao = info.idaInfoDescricao;
  const imagem    = info.idaInfoImagem;
  const fatia     = info.idaInfoFatia;
  const valorCaptacao = info.idaInfoValorCaptacao;

  const isAtivo =
    statusId === 1 ||
    String(statusNome ?? '').toLowerCase().includes('ativ');

  const irParaIdeia = () => navigate(`${ROTA_IDEIA}/${id}`);
  const irParaEditar = () => navigate(`${ROTA_EDITAR}/${id}`);

  return (
    <div className={`${styles.card} ${variant === 'dashboard' ? styles.dashboard : ''}`}>
      {/* Imagem */}
      <div className={styles.imageWrapper}>
        {imagem ? (
          <img src={imagem} alt={nome} className={styles.image} loading="lazy" />
        ) : (
          <div
            className={styles.image}
            style={{
              background: 'linear-gradient(135deg, #e8f0fe 0%, #c7d9f8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Rocket size={variant === 'dashboard' ? 36 : 48} color="#0d47a1" opacity={0.25} />
          </div>
        )}

        {/* Badge equity */}
        {fatia != null && fatia > 0 && variant !== 'dashboard' && (
          <span className={styles.equityBadge}>Fatia: {fatia}%</span>
        )}

        {/* Badge status — variante owner/dashboard */}
        {variant !== 'default' && (
          <span
            className={`${styles.statusBadge} ${isAtivo ? styles.statusAtivo : styles.statusPendente}`}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                display: 'inline-block',
              }}
            />
            {statusNome ?? (isAtivo ? 'Ativo' : 'Pendente')}
          </span>
        )}

        {/* Estrela — variante default */}
        {variant === 'default' && (
          <div className={styles.featuredBadge}>
            <Star size={16} color="white" fill="white" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className={styles.content}>
        <div className={styles.cardHeaderInfo}>
          <TrendingUp size={18} className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>{nome ?? '(sem título)'}</h3>
        </div>

        {categoria && (
          <div className={styles.metaRow}>
            <span className={styles.equitySimple}>{categoria}</span>
            {estagio && <span className={styles.dot}>•</span>}
            {estagio && <span className={styles.stageTag}>{estagio}</span>}
          </div>
        )}

        <p className={styles.description}>
          {descricao
            ? (descricao.length > 100 ? `${descricao.substring(0, 100)}...` : descricao)
            : variant === 'owner'
            ? 'Gerencie seu projeto e acompanhe o interesse de investidores.'
            : 'Explore este projeto para saber mais sobre a proposta de inovação e impacto.'}
        </p>

        {regiao && (
          <div className={styles.location}>
             <span>📍 {regiao}</span>
          </div>
        )}

        {fatia != null && fatia > 0 && variant !== 'dashboard' && (
          <div className={styles.equityInfo}>
            <span>Participação ofertada</span>
            <strong>{fatia}%</strong>
          </div>
        )}

        {/* Ações */}
        <div className={styles.actionArea}>
          {valorCaptacao > 0 && (
            <div className={styles.funding}>
              <span className={styles.fundingLabel}>Captação:</span>
              <span className={styles.fundingValue}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCaptacao)}
              </span>
            </div>
          )}
          {variant === 'owner' ? (
            <>
              <button className={styles.btnPrimary} onClick={irParaIdeia}>
                <Eye size={15} />
                Ver
              </button>
              <button className={styles.btnSecondary} onClick={irParaEditar}>
                <Edit2 size={15} />
                Editar
              </button>
            </>
          ) : (
            <button className={styles.cardButton} onClick={irParaIdeia}>
              <Eye size={16} />
              Explorar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdeiaCard;
