import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PreferencesProvider, usePreferences } from '@/lib/PreferencesContext';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

const darkSpotifyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#282828',
  },
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const { preferences, loading: preferencesLoading } = usePreferences();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || preferencesLoading) return;

    const inSetupGroup = segments[0] === '(setup)';
    if (!preferences.onboardingCompleted && !inSetupGroup) {
      router.replace('/(setup)/preferences');
      return;
    }

    if (!preferences.onboardingCompleted && inSetupGroup) {
      return;
    }

    if (preferences.onboardingCompleted && inSetupGroup) {
      router.replace(session ? '/(tabs)' : '/(auth)/login');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [loading, preferences.onboardingCompleted, preferencesLoading, router, segments, session]);

  if (loading || preferencesLoading) {
    return <View style={{ flex: 1, backgroundColor: '#121212' }} />;
  }

  return (
    <ThemeProvider value={darkSpotifyTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#121212' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modals)/trip-planner"
          options={{
            presentation: 'modal',
            title: 'Planejar Viagem',
            headerStyle: { backgroundColor: '#1E1E1E' },
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
            headerTintColor: '#1DB954',
          }}
        />
        <Stack.Screen
          name="(modals)/new-refuel"
          options={{
            presentation: 'modal',
            title: 'Abastecimento',
            headerStyle: { backgroundColor: '#1E1E1E' },
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
            headerTintColor: '#1DB954',
          }}
        />
        <Stack.Screen
          name="(modals)/new-vehicle"
          options={{
            presentation: 'modal',
            title: 'Novo Veiculo',
            headerStyle: { backgroundColor: '#1E1E1E' },
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
            headerTintColor: '#1DB954',
          }}
        />
        <Stack.Screen
          name="(modals)/new-oil-change"
          options={{
            presentation: 'modal',
            title: 'Troca de Oleo',
            headerStyle: { backgroundColor: '#1E1E1E' },
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
            headerTintColor: '#1DB954',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
