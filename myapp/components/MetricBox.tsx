import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function MetricBox({ label, value, unit, color = '#fff' }) {
  return (
    <View style={styles.mBox}>
      <Text style={styles.mLabel}>{label}</Text>
      <Text style={[styles.mVal, { color }]}>{value}</Text>
      <Text style={styles.mUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mBox: {
    width: (width - 60) / 3,
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  mVal: { fontSize: 20, fontWeight: '900', marginVertical: 2 },
  mUnit: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
});
