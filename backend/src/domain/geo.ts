export interface PointGeographique {
  label: string
  latitude: number
  longitude: number
}

export const POSITION_GUANGZHOU: PointGeographique = { label: 'Guangzhou', latitude: 23.1291, longitude: 113.2644 }

export const POSITION_AEROPORT_BAIYUN: PointGeographique = { label: 'Aéroport Baiyun', latitude: 23.3924, longitude: 113.2988 }

export const POSITION_KINSHASA_CENTRE: PointGeographique = { label: 'Kinshasa Centre', latitude: -4.42, longitude: 15.3 }

export const POSITION_NDJILI: PointGeographique = { label: "Aéroport N'djili", latitude: -4.3858, longitude: 15.4446 }

export const POSITION_ADRESSE_CLIENT: PointGeographique = { label: 'Adresse client', latitude: -4.4419, longitude: 15.2663 }

export const POINTS_TRANSIT: readonly PointGeographique[] = [
  { label: 'Asie du Sud-Est', latitude: 15.0, longitude: 105.0 },
  { label: 'Océan Indien', latitude: 5.0, longitude: 80.0 },
  { label: "Corne de l'Afrique", latitude: 2.0, longitude: 45.0 },
  { label: "Afrique de l'Est", latitude: -1.0, longitude: 36.0 },
  { label: 'Approche RDC', latitude: -3.0, longitude: 25.0 }
]

export const ROUTE_AERIENNE: readonly PointGeographique[] = [
  POSITION_GUANGZHOU,
  POSITION_AEROPORT_BAIYUN,
  ...POINTS_TRANSIT,
  POSITION_NDJILI,
  POSITION_KINSHASA_CENTRE,
  POSITION_ADRESSE_CLIENT
]
