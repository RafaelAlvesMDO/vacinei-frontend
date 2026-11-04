import { Redirect } from 'expo-router';

// Aba central "Digitalizar": o toque abre o fluxo por cima das abas (cidadao/digitalizar). Esta rota só é
// alcançada por um link direto, e então redireciona para o fluxo
export default function ScanTabRoute() {
  return <Redirect href="/cidadao/digitalizar" />;
}
