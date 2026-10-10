import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { COULEURS, COULEURS_STATUT, ROUTE_AERIENNE } from './api'

const LARGEUR = 960
const HAUTEUR = 480
const MARGE = 72

const LATITUDES = ROUTE_AERIENNE.map((point) => point.latitude)
const LONGITUDES = ROUTE_AERIENNE.map((point) => point.longitude)
const LAT_MIN = Math.min(...LATITUDES)
const LAT_MAX = Math.max(...LATITUDES)
const LNG_MIN = Math.min(...LONGITUDES)
const LNG_MAX = Math.max(...LONGITUDES)

function projeter(point) {
  const x = MARGE + ((point.longitude - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (LARGEUR - 2 * MARGE)
  const y = MARGE + ((LAT_MAX - point.latitude) / (LAT_MAX - LAT_MIN)) * (HAUTEUR - 2 * MARGE)
  return { x, y }
}

function ContenuCarte({ suivi }) {
  const points = useMemo(() => ROUTE_AERIENNE.map((point) => ({ ...projeter(point), label: point.label })), [])
  const etapeMaximale = useMemo(
    () => (suivi ?? []).reduce((maximum, point) => Math.max(maximum, point.numero_etape), 0),
    [suivi]
  )
  const pointsRealises = useMemo(
    () => (suivi ?? []).filter((point) => point.latitude !== null && point.longitude !== null),
    [suivi]
  )
  const dernierPoint = pointsRealises[pointsRealises.length - 1] ?? null
  const position = useMemo(
    () => (dernierPoint ? projeter(dernierPoint) : projeter({ latitude: -4.42, longitude: 15.3 })),
    [dernierPoint]
  )
  const indexPosition = dernierPoint
    ? ROUTE_AERIENNE.findIndex(
        (point) => point.latitude === dernierPoint.latitude && point.longitude === dernierPoint.longitude
      )
    : -1
  const indexParcouru = etapeMaximale >= 6 ? Math.max(indexPosition, 1) : 0

  const grilles = useMemo(() => {
    const verticales = []
    for (let longitude = Math.ceil(LNG_MIN / 20) * 20; longitude <= LNG_MAX; longitude += 20) {
      verticales.push(projeter({ latitude: LAT_MAX, longitude }).x)
    }
    const horizontales = []
    for (let latitude = Math.ceil(LAT_MIN / 10) * 10; latitude <= LAT_MAX; latitude += 10) {
      horizontales.push(projeter({ latitude, longitude: LNG_MIN }).y)
    }
    return { verticales, horizontales }
  }, [])

  const traceComplete = points.map((point) => `${point.x},${point.y}`).join(' ')
  const traceParcourue = points.slice(0, indexParcouru + 1).map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      role="img"
      aria-label="Carte du parcours Guangzhou Kinshasa"
    >
      <defs>
        <linearGradient id="fond-carte-colis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1a38" />
          <stop offset="100%" stopColor="#10204a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={LARGEUR} height={HAUTEUR} rx="14" fill="url(#fond-carte-colis)" />
      {grilles.verticales.map((x) => (
        <line key={`v-${x}`} x1={x} y1="0" x2={x} y2={HAUTEUR} stroke="#1d3563" strokeWidth="1" />
      ))}
      {grilles.horizontales.map((y) => (
        <line key={`h-${y}`} x1="0" y1={y} x2={LARGEUR} y2={y} stroke="#1d3563" strokeWidth="1" />
      ))}
      <text x="26" y="34" fill="#7ea6e8" fontSize="15" fontWeight="700" letterSpacing="2">
        RDC — CHINE
      </text>
      <text x="26" y="54" fill="#5f7fc0" fontSize="11">
        Route aérienne Guangzhou → Kinshasa
      </text>
      <polyline points={traceComplete} fill="none" stroke="#3f66b5" strokeWidth="2" strokeDasharray="5 7" />
      {indexParcouru > 0 ? (
        <polyline points={traceParcourue} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      ) : null}
      {points.map((point, index) => {
        const cote = point.x > LARGEUR - 170 ? 'end' : point.x < 170 ? 'start' : 'middle'
        const decalage = point.x > LARGEUR - 170 ? -12 : point.x < 170 ? 12 : 0
        const auDessus = index % 2 === 0
        return (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
            <text
              x={point.x + decalage}
              y={point.y + (auDessus ? -12 : 22)}
              textAnchor={cote}
              fill="#a9c4f5"
              fontSize="11"
              fontWeight="600"
            >
              {point.label}
            </text>
          </g>
        )
      })}
      {pointsRealises.map((point) => {
        const coordonnees = projeter(point)
        return (
          <circle
            key={point.id}
            cx={coordonnees.x}
            cy={coordonnees.y}
            r="6"
            fill={COULEURS_STATUT[point.statut] ?? '#3b82f6'}
            fillOpacity="0.85"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        )
      })}
      <circle cx={position.x} cy={position.y} r="14" fill="#60a5fa" opacity="0.35">
        <animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={position.x} cy={position.y} r="7.5" fill="#1e40af" stroke="#ffffff" strokeWidth="2.5" />
      <text x={LARGEUR - 26} y={HAUTEUR - 26} textAnchor="end" fill="#5f7fc0" fontSize="11">
        {dernierPoint ? `Position : ${dernierPoint.lieu}` : 'Position : en attente'}
      </text>
    </svg>
  )
}

export function CarteSuivi({ suivi, hauteur, montrerBoutonPleinEcran, onPleinEcran }) {
  return (
    <View style={[styles.conteneurCarte, { height: hauteur }]}>
      <ContenuCarte suivi={suivi} />
      {montrerBoutonPleinEcran ? (
        <TouchableOpacity style={styles.boutonPleinEcran} onPress={onPleinEcran}>
          <Text style={styles.textePleinEcran}>Voir sur carte plein écran</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function CarteEtendue({ suivi }) {
  return (
    <View style={styles.carteEtendue}>
      <ContenuCarte suivi={suivi} />
    </View>
  )
}

export function dernierePositionConnue(suivi) {
  for (let index = suivi.length - 1; index >= 0; index -= 1) {
    const point = suivi[index]
    if (point.latitude !== null && point.longitude !== null) {
      return { latitude: point.latitude, longitude: point.longitude }
    }
  }
  return { latitude: -4.42, longitude: 15.3 }
}

const styles = StyleSheet.create({
  conteneurCarte: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0b1a38'
  },
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
  carteEtendue: { flex: 1, backgroundColor: '#0b1a38' }
})
