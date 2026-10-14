import React, { useEffect, useState } from 'react';
import { FeedbackBanner, type Feedback } from '../../components/feedback/FeedbackBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { CardError, CardLoading } from '../../components/ui/CardState';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { getOwnUser } from '../../services/users';
import { ChangePasswordCard } from './components/ChangePasswordCard';
import { PersonalDataCard } from './components/PersonalDataCard';

// Tempo de exibição do aviso de sucesso (RNF03)
const FEEDBACK_DURATION_MS = 8000;

/**
 * Perfil do usuário logado (RF003): dados pessoais (só o nome é editável, D19) e troca de senha
 */
export const Profile: React.FC = () => {
  const { refreshProfile } = useAuth();
  const ownUser = useAsync(getOwnUser, 'Não foi possível carregar seus dados.');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleNameSaved = (name: string) => {
    setFeedback({ variant: 'success', title: 'Nome atualizado', detail: `Seu nome agora é exibido como "${name}".` });
    ownUser.reload();
    // Atualiza o nome da barra superior; uma falha aqui não desfaz a alteração já salva
    refreshProfile().catch(() => undefined);
  };

  const handlePasswordChanged = () => {
    setFeedback({
      variant: 'success',
      title: 'Senha alterada',
      detail: 'As outras sessões abertas foram encerradas. Esta continua conectada.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Meu perfil" subtitle="Confira seus dados cadastrais e altere sua senha." />

      {feedback && <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr] xl:items-start">
        {ownUser.data ? (
          // A chave reinicia o formulário com o nome salvo após a recarga
          <PersonalDataCard key={ownUser.data.name} user={ownUser.data} onNameSaved={handleNameSaved} />
        ) : (
          <Card title="Dados pessoais">
            {ownUser.error ? (
              <CardError message={ownUser.error.message} onRetry={ownUser.reload} />
            ) : (
              <CardLoading label="Carregando seus dados..." />
            )}
          </Card>
        )}

        <ChangePasswordCard onPasswordChanged={handlePasswordChanged} />
      </div>
    </div>
  );
};

export default Profile;
