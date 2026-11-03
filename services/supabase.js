// Conexión con Supabase (la "base de datos en la nube" de la app).
// Las claves se leen del archivo .env (ver .env.example).
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Verdadero solo si el .env tiene los dos valores.
export const supabaseConfigurado = Boolean(url && clave);

export const supabase = createClient(
  url || 'https://sin-configurar.supabase.co',
  clave || 'sin-configurar',
  {
    // Esta app no usa inicio de sesión de clientes, así que no guardamos sesión.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }
);
