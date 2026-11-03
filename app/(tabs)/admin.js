// Pestaña ADMIN: pide el PIN y, si es correcto, muestra el panel (RF-08).
import { useCallback, useEffect, useState } from 'react';
import { borrarPin, guardarPin, leerPinGuardado, verificarPin } from '../../services/admin';
import AccesoAdmin from '../../components/admin/AccesoAdmin';
import PanelAdmin from '../../components/admin/PanelAdmin';
import { Cargando } from '../../components/Estados';

export default function Admin() {
  const [estado, setEstado] = useState('cargando'); // cargando | bloqueado | abierto
  const [pin, setPin] = useState(null);
  const [avisoInicial, setAvisoInicial] = useState(null);

  // Si el administrador ya había entrado antes, intentamos reabrir su sesión.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const guardado = await leerPinGuardado();
      if (!guardado) {
        if (!cancelado) setEstado('bloqueado');
        return;
      }
      try {
        const correcto = await verificarPin(guardado);
        if (cancelado) return;
        if (correcto) {
          setPin(guardado);
          setEstado('abierto');
        } else {
          await borrarPin(); // el PIN cambió desde otro celular
          setEstado('bloqueado');
        }
      } catch (e) {
        if (cancelado) return;
        setAvisoInicial(e.message); // sin internet: no borramos el PIN guardado
        setEstado('bloqueado');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Devuelve null si todo salió bien, o el mensaje de error para mostrar.
  const ingresar = useCallback(async (pinEscrito) => {
    try {
      const correcto = await verificarPin(pinEscrito);
      if (!correcto) return 'PIN incorrecto. Inténtalo de nuevo.';
      await guardarPin(pinEscrito);
      setPin(pinEscrito);
      setEstado('abierto');
      return null;
    } catch (e) {
      return e.message;
    }
  }, []);

  const salir = useCallback(async () => {
    await borrarPin();
    setPin(null);
    setAvisoInicial(null);
    setEstado('bloqueado');
  }, []);

  if (estado === 'cargando') return <Cargando texto="Comprobando acceso…" />;
  if (estado === 'abierto') return <PanelAdmin pin={pin} onSalir={salir} onPinCambiado={setPin} />;
  return <AccesoAdmin onIngresar={ingresar} mensajeInicial={avisoInicial} />;
}
