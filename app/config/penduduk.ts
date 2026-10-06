/** Five-year age bands used for the population pyramid (Dukcapil/BPS format), youngest first. */
export const AGE_BANDS = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
  '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75+',
] as const

export type AgeBand = typeof AGE_BANDS[number]

/** Shared with the gender donut so each sex keeps one colour across charts (validated red pair). */
export const SEX_COLORS = { male: '#A3122A', female: '#EE7C88' } as const

export function ageBandLabel(band: AgeBand) {
  return band === '75+' ? '75 tahun ke atas' : `${band.replace('-', '–')} tahun`
}
