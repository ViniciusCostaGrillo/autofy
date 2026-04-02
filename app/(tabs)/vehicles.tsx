import { View, Text } from 'react-native';

export default function VehiclesScreen() {
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center">
      <Text className="text-xl font-bold text-slate-800 dark:text-white">Frota de Veículos</Text>
      <Text className="text-slate-500 mt-2">Em breve: Gestão do seu carro</Text>
    </View>
  );
}
