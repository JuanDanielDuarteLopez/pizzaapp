// Hook para cargar datos cuando una pantalla se abre (y cada vez que vuelve a verse).
// Devuelve: datos, cargando (solo la primera vez), refrescando, error, recargar() y actualizar().
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useCarga(funcionDeCarga) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const funcionRef = useRef(funcionDeCarga);
  funcionRef.current = funcionDeCarga;
  const hayDatos = useRef(false);

  const cargar = useCallback(async (manual = false) => {
    if (manual) setRefrescando(true);
    else if (!hayDatos.current) setCargando(true);
    setError(null);
    try {
      const resultado = await funcionRef.current();
      setDatos(resultado);
      hayDatos.current = true;
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar(false);
    }, [cargar])
  );

  return {
    datos,
    cargando,
    refrescando,
    error,
    recargar: () => cargar(true), // con indicador de "jalar para actualizar"
    actualizar: () => cargar(false), // en silencio (útil después de guardar algo)
  };
}
