import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colores } from '../constants/colors';

// Estructura raíz: las pestañas (Inicio / Carta / Admin) y, encima de ellas,
// las pantallas del flujo de reserva (Reservar mesa -> Confirmación).
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.primario },
          headerTintColor: colores.blanco,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reservar/[mesaId]" options={{ title: 'Reservar mesa' }} />
        <Stack.Screen
          name="confirmacion"
          options={{ title: 'Confirmación', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
