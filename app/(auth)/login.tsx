import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Car } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Digite um email válido');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await sendOtp(email.trim().toLowerCase());
    setLoading(false);
    if (error) setError('Não foi possível enviar o código. Tente novamente.');
    else setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Digite o código de 6 dígitos'); return; }
    setLoading(true);
    setError('');
    const { error } = await verifyOtp(email, otp.trim());
    setLoading(false);
    if (error) setError('Código inválido ou expirado. Tente novamente.');
    // Sucesso: o onAuthStateChange no AuthContext vai navegar automaticamente
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-8 justify-center">
        {/* Logo */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-5 border-b-4 border-[#14833b]">
            <Car size={44} color="#121212" />
          </View>
          <Text className="text-textMain text-5xl font-black tracking-tighter">Autofy</Text>
          <Text className="text-textMuted font-medium text-base mt-2 text-center">
            Controle seu carro com estilo
          </Text>
        </View>

        {/* Card de formulário */}
        <View className="bg-surface rounded-3xl p-6 border border-surfaceLight">
          {step === 'email' ? (
            <>
              <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Bem-vindo 👋</Text>
              <Text className="text-textMuted font-medium mb-6">Entre com seu email para continuar</Text>
              <Input
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={error}
              />
              <Button label="Enviar Código" onPress={handleSendOtp} isLoading={loading} className="mt-2" />
            </>
          ) : (
            <>
              <Text className="text-textMain font-black text-2xl tracking-tight mb-1">Verifique o Email ✉️</Text>
              <Text className="text-textMuted font-medium mb-1">Código enviado para</Text>
              <Text className="text-primary font-black text-base mb-6">{email}</Text>
              <Input
                label="Código de verificação"
                placeholder="000000"
                value={otp}
                onChangeText={(t) => { setOtp(t); setError(''); }}
                keyboardType="numeric"
                maxLength={6}
                error={error}
              />
              <Button label="Entrar" onPress={handleVerifyOtp} isLoading={loading} className="mt-2 mb-4" />
              <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); setError(''); }} className="items-center">
                <Text className="text-textMuted font-bold">← Voltar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
