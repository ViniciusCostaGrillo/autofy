import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp, signInAsAdmin, canUseLocalAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Digite um email valido');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await sendOtp(email.trim().toLowerCase());
    setLoading(false);

    if (error) setError('Nao foi possivel enviar o codigo. Tente novamente.');
    else setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Digite o codigo de 6 digitos');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await verifyOtp(email, otp.trim());
    setLoading(false);

    if (error) setError('Codigo invalido ou expirado. Tente novamente.');
  };

  const handleResendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Digite um email valido');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await sendOtp(email.trim().toLowerCase());
    setLoading(false);

    if (error) setError('Nao foi possivel reenviar o codigo. Tente novamente.');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-5 border-b-4 border-[#14833b]">
            <Car size={44} color="#121212" />
          </View>
          <Text className="text-textMain text-5xl font-black tracking-tighter text-center">Autofy</Text>
          <Text className="text-textMuted font-medium text-base mt-2 text-center">
            Controle seu carro com estilo
          </Text>
        </View>

        {canUseLocalAdmin ? (
          <Button
            label="Entrar como admin de teste"
            onPress={signInAsAdmin}
            className="mb-4"
            variant="secondary"
          />
        ) : null}

        <View className="bg-surface rounded-3xl p-6 border border-surfaceLight">
          {step === 'email' ? (
            <>
              <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Bem-vindo</Text>
              <Text className="text-textMuted font-medium mb-6">Entre com seu email para continuar</Text>
              <Input
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                error={error}
              />
              <Button label="Enviar codigo" onPress={handleSendOtp} isLoading={loading} className="mt-2" />
            </>
          ) : (
            <>
              <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Verifique o email</Text>
              <Text className="text-textMuted font-medium mb-1">Digite o codigo enviado para</Text>
              <Text className="text-primary font-black text-base mb-6">{email}</Text>
              <Input
                label="Codigo de verificacao"
                placeholder="000000"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                error={error}
              />
              <Button label="Entrar" onPress={handleVerifyOtp} isLoading={loading} className="mt-2 mb-4" />
              <TouchableOpacity
                onPress={handleResendOtp}
                className="items-center py-2 mb-2"
                disabled={loading}
              >
                <Text className="text-primary font-bold">Reenviar codigo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="items-center py-2"
              >
                <Text className="text-textMuted font-bold">Voltar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
