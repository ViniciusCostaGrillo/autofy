import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type LoginMode = 'password' | 'otp';
type PasswordAction = 'signin' | 'signup';
type OtpStep = 'email' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp, signInWithPassword, signUpWithPassword, signInAsAdmin, canUseLocalAdmin } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [passwordAction, setPasswordAction] = useState<PasswordAction>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const normalizedEmail = email.trim().toLowerCase();

  const validateEmail = () => {
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Digite um email válido.');
      return false;
    }

    return true;
  };

  const validatePassword = () => {
    if (!password.trim()) {
      setError('Digite sua senha.');
      return false;
    }

    if (password.trim().length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async () => {
    if (!validateEmail() || !validatePassword()) return;

    setLoading(true);
    setError('');
    setInfo('');

    const action =
      passwordAction === 'signin'
        ? signInWithPassword(normalizedEmail, password)
        : signUpWithPassword(normalizedEmail, password);

    const { error: authError } = await action;
    setLoading(false);

    if (authError) {
      setError(
        passwordAction === 'signin'
          ? 'Email ou senha inválidos. Tente novamente.'
          : 'Não foi possível criar sua conta. Verifique o email e tente novamente.'
      );
      return;
    }

    if (passwordAction === 'signup') {
      setInfo('Conta criada com sucesso. Se necessário, confirme o email e faça login.');
      setPasswordAction('signin');
    }
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    setError('');
    setInfo('');
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
    setInfo('');
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
    setInfo('');
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
                setInfo('');
              }}
              variant={mode === 'password' ? 'primary' : 'ghost'}
              className="flex-1"
            />
            <Button
              label="Código"
              onPress={() => {
                setMode('otp');
                setError('');
                setInfo('');
              }}
              variant={mode === 'otp' ? 'primary' : 'ghost'}
              className="flex-1"
            />
          </View>

          <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Bem-vindo</Text>
          <Text className="text-textMuted font-medium mb-6">
            {mode === 'password'
              ? passwordAction === 'signin'
                ? 'Entre com email e senha.'
                : 'Crie sua conta com email e senha.'
              : 'Entre com código enviado por email.'}
          </Text>

          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
              setInfo('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            error={error}
          />

          {info ? <Text className="text-primary font-bold mb-4">{info}</Text> : null}

          {mode === 'password' ? (
            <>
              <Input
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                  setInfo('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
              />
              <Button
                label={passwordAction === 'signin' ? 'Entrar com senha' : 'Criar conta'}
                onPress={handlePasswordSubmit}
                isLoading={loading}
                className="mt-2"
              />
              <TouchableOpacity
                onPress={() => {
                  setPasswordAction((current) => (current === 'signin' ? 'signup' : 'signin'));
                  setError('');
                  setInfo('');
                }}
                className="items-center py-3"
              >
                <Text className="text-primary font-bold">
                  {passwordAction === 'signin' ? 'Criar conta com senha' : 'Já tenho conta'}
                </Text>
              </TouchableOpacity>
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
                  setInfo('');
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
                  setInfo('');
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
