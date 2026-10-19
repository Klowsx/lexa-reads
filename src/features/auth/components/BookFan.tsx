import { StyleSheet, View } from 'react-native';
import { alpha, useColors } from '~/theme/colors';

const BOOKS = [
  { c1: '#1E0808', c2: '#C43A3A' }, // Babel
  { c1: '#0C1628', c2: '#4A8AB8' }, // Piranesi
  { c1: '#2A1A08', c2: '#C49A20' }, // Cien años de soledad
  { c1: '#1C1635', c2: '#7B5EA7' }, // El nombre del viento
];

const W = 120;
const H = 180;

export function BookFan() {
  const c = useColors();
  const count = BOOKS.length;
  return (
    <View style={styles.container}>
      <View style={[styles.glow, { backgroundColor: alpha(c.accent, 0.12) }]} />
      <View style={{ width: W * 2, height: H + 40 }}>
        {BOOKS.map((b, i) => {
          const offset = i - (count - 1) / 2;
          const rotate = `${offset * 7}deg`;
          const translateX = offset * 28;
          const translateY = Math.abs(offset) * 8;
          return (
            <View
              key={i}
              style={[
                styles.bookWrap,
                {
                  zIndex: 10 - Math.round(Math.abs(offset)),
                  transform: [
                    { translateX: W / 2 + translateX - W / 2 },
                    { translateY: 30 + translateY },
                    { rotate },
                  ],
                },
              ]}
            >
              <View style={[styles.cover, { backgroundColor: b.c1 }]}>
                <View style={[styles.spine, { backgroundColor: b.c2 }]} />
                <View style={[styles.sheen, { backgroundColor: alpha(b.c2, 0.15) }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bookWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  cover: {
    width: W,
    height: H,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
