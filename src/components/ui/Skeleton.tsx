import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, type ViewStyle } from 'react-native'
import { useColors } from '~/theme/colors'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  radius?: number
  style?: ViewStyle
  className?: string
  animate?: boolean
}

/** Bloque de carga con pulso suave. Atom base para skeletons por feature. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  style,
  className,
  animate = true
}: SkeletonProps) {
  const c = useColors()
  const opacity = useRef(new Animated.Value(0.4)).current
  const [reduceMotion, setReduceMotion] = useState(true)

  useEffect(() => {
    // Mantiene el bloque estático hasta conocer la preferencia y escucha cambios del sistema.
    let mounted = true
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled)
      })
      .catch(() => {})
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    )
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (!animate || reduceMotion) {
      opacity.setValue(0.7)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity, animate, reduceMotion])

  return (
    <Animated.View
      className={className}
      style={[
        { width, height, borderRadius: radius, backgroundColor: c.sh, opacity },
        style
      ]}
    />
  )
}
