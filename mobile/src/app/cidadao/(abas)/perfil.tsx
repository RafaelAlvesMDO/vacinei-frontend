import { ProfileScreen } from '@/components/profile/ProfileScreen';

// Perfil da ala Cidadão: inclui "Meus dependentes" (D33), também para o profissional nesta ala (D11)
export default function CitizenProfile() {
  return <ProfileScreen showDependents />;
}
