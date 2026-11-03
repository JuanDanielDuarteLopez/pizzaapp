import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../../constants/colors';

// Barra de pestañas inferior: Inicio, Carta y Admin.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.primario },
        headerTintColor: colores.blanco,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: '#7C8790',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'Konys Pizza',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="carta"
        options={{
          title: 'Carta',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          headerTitle: 'Administración',
          tabBarIcon: ({ color, size }) => <Ionicons name="lock-closed-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
