import { useEffect, useState } from 'react'

// Calcula la espera con tiempo real para que siga siendo correcta al salir y volver a la app.
export function useResendCountdown(initialSeconds = 60) {
  const [until, setUntil] = useState(() => Date.now() + initialSeconds * 1000)
  const [seconds, setSeconds] = useState(initialSeconds)
  useEffect(() => {
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [until])
  // Inicia otra espera únicamente cuando el servidor confirma el envío.
  function restart() {
    setUntil(Date.now() + 60_000)
    setSeconds(60)
  }
  return { seconds, restart }
}
