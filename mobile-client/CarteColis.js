import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps'
import { COULEURS, ROUTE_AERIENNE } from './api'

const POSITION_DEFAUT = { latitude: -4.42, longitude: 15.3 }
const DELTA_CARTE = 45

export function dernierePositionConnue(suivi) {
  for (let index = suivi.length - 1; index >= 0; index -= 1) {
    const point = suivi[index]
    if (point.latitude !== null && point.longitude !== null) {
      return { latitude: point.latitude, longitude: point.longitude }
    }
  }
  return POSITION_DEFAUT
}

export function CarteSuivi({ suivi, hauteur, montrerBoutonPleinEcran, onPleinEcran }) {
  const position = useMemo(() => dernierePositionConnue(suivi), [suivi])
  const regionAnimee = useRef(
    new AnimatedRegion({
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: DELTA_CARTE,
      longitudeDelta: DELTA_CARTE
    })
  ).current

  useEffect(() => {
    regionAnimee.timing({
      toValue: {
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: DELTA_CARTE,
        longitudeDelta: DELTA_CARTE
      },
      duration: 2500,
      useNativeDriver: false
    }).start()
  }, [position.latitude, position.longitude, regionAnimee])

  const pointsRealises = suivi.filter((point) => point.latitude !== null && point.longitude !== null)

  return (
    <View style={styles.conteneurCarte}>
      <MapView style={{ height: hauteur }} initialRegion={{ ...POSITION_DEFAUT, latitudeDelta: 55, longitudeDelta: 55 }}>
        <Polyline
          coordinates={ROUTE_AERIENNE.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))}
          strokeColor={COULEURS.primaireClair}
          strokeWidth={2}
          lineDashPattern={[4, 6]}
        />
        {pointsRealises.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.pointMarqueur} />
          </Marker>
        ))}
        <Marker.Animated coordinate={regionAnimee} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.marqueurActuel}>
            <View style={styles.marqueurActuelHalo} />
            <View style={styles.marqueurActuelCoeur} />
          </View>
        </Marker.Animated>
      </MapView>
      {montrerBoutonPleinEcran ? (
        <TouchableOpacity style={styles.boutonPleinEcran} onPress={onPleinEcran}>
          <Text style={styles.textePleinEcran}>Voir sur carte plein écran</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function CarteEtendue({ suivi }) {
  const carteRef = useRef(null)
  const position = useMemo(() => dernierePositionConnue(suivi ?? []), [suivi])

  return (
    <MapView
      ref={carteRef}
      style={styles.carteEtendue}
      initialRegion={{ ...POSITION_DEFAUT, latitudeDelta: 60, longitudeDelta: 60 }}
      onMapReady={() => {
        carteRef.current?.fitToCoordinates(
          ROUTE_AERIENNE.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
          { edgePadding: { top: 60, right: 40, bottom: 60, left: 40 }, animated: false }
        )
      }}
    >
      <Polyline
        coordinates={ROUTE_AERIENNE.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))}
        strokeColor={COULEURS.primaireClair}
        strokeWidth={3}
        lineDashPattern={[6, 8]}
      />
      {(suivi ?? [])
        .filter((point) => point.latitude !== null && point.longitude !== null)
        .map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.pointMarqueur}>
              <Text style={styles.textePointMarqueur}>{point.numero_etape}</Text>
            </View>
          </Marker>
        ))}
      <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.marqueurActuel}>
          <View style={styles.marqueurActuelHalo} />
          <View style={styles.marqueurActuelCoeur} />
        </View>
      </Marker>
    </MapView>
  )
}

const styles = StyleSheet.create({
  conteneurCarte: { borderRadius: 14, overflow: 'hidden', backgroundColor: COULEURS.carte },
  boutonPleinEcran: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COULEURS.primaire,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center'
  },
  textePleinEcran: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  pointMarqueur: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: COULEURS.primaire,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textePointMarqueur: { fontSize: 7, fontWeight: '800', color: COULEURS.primaire },
  marqueurActuel: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  marqueurActuelHalo: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${COULEURS.primaire}33`
  },
  marqueurActuelCoeur: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COULEURS.primaire,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  carteEtendue: { flex: 1 }
})
