import { Stack } from 'expo-router';
import { colors } from '@/theme';

// Rotas sem sessão: login (/), cadastro e recuperação de senha
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
