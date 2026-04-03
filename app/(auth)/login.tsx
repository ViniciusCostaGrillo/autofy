import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type LoginMode = 'password' | 'otp';
type OtpStep = 'email' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp, signInWithPassword, signInAsAdmin, canUseLocalAdmin } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedEmail = email.trim().toLowerCase();

  const validateEmail = () => {
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Digite um email válido.');
      return false;
    }

    return true;
  };

  const handlePasswordLogin = async () => {
    if (!validateEmail()) return;
    if (!password.trim()) {
      setError('Digite sua senha.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: authError } = await signInWithPassword(normalizedEmail, password);
    setLoading(false);

    if (authError) {
      setError('Email ou senha inválidos. Tente novamente.');
    }
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setError('');
    const { error: authError } = await sendOtp(normalizedEmail);
    setLoading(false);

    if (authError) {
      setError('Não foi possível enviar o código. Tente novamente.');
      return;
    }

    setOtpStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      setError('Digite o código de 6 dígitos.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: authError } = await verifyOtp(normalizedEmail, otp.trim());
    setLoading(false);

    if (authError) {
      setError('Código inválido ou expirado. Tente novamente.');
    }
  };

  const handleResendOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setError('');
    const { error: authError } = await sendOtp(normalizedEmail);
    setLoading(false);

    if (authError) {
      setError('Não foi possível reenviar o código. Tente novamente.');
    }
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
          <View className="flex-row gap-3 mb-6">
            <Button
              label="Senha"
              onPress={() => {
                setMode('password');
                setError('');
              }}
              variant={mode === 'password' ? 'primary' : 'ghost'}
              className="flex-1"
            />
            <Button
              label="Código"
              onPress={() => {
                setMode('otp');
                setError('');
              }}
              variant={mode === 'otp' ? 'primary' : 'ghost'}
              className="flex-1"
            />
          </View>

          <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Bem-vindo</Text>
          <Text className="text-textMuted font-medium mb-6">
            {mode === 'password' ? 'Entre com email e senha.' : 'Entre com código enviado por email.'}
          </Text>

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
            returnKeyType="next"
            error={error}
          />

          {mode === 'password' ? (
            <>
              <Input
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
              />
              <Button label="Entrar com senha" onPress={handlePasswordLogin} isLoading={loading} className="mt-2" />
            </>
          ) : otpStep === 'email' ? (
            <Button label="Enviar código" onPress={handleSendOtp} isLoading={loading} className="mt-2" />
          ) : (
            <>
              <Text className="text-textMuted font-medium mb-1">Digite o código enviado para</Text>
              <Text className="text-primary font-black text-base mb-6">{normalizedEmail}</Text>
              <Input
                label="Código de verificação"
                placeholder="000000"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
              />
              <Button label="Entrar com código" onPress={handleVerifyOtp} isLoading={loading} className="mt-2 mb-4" />
              <TouchableOpacity onPress={handleResendOtp} className="items-center py-2 mb-2" disabled={loading}>
                <Text className="text-primary font-bold">Reenviar código</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setOtpStep('email');
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
