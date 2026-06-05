// ============================================================
// NARAENDRA FARMS — TypeScript Types
// ============================================================

export interface Farm {
  id: string
  code: string
  name: string
  site_type: 'rearing' | 'laying' | 'feedmill' | 'hatchery' | 'office'
  address?: string
  taluka?: string
  district?: string
  elec_usc_1?: string
  is_active: boolean
  created_at: string
}

export interface Shed {
  id: string
  farm_id: string
  shed_no: string
  shed_name?: string
  shed_type: 'brooding' | 'grower' | 'laying' | 'rearing'
  sex: 'female' | 'male' | 'combined'
  a_side_boxes?: number
  b_side_boxes?: number
  total_boxes?: number
  capacity_female?: number
  capacity_male?: number
  birds_per_box?: number
  water_tank_litres?: number
  is_active: boolean
  farm?: Farm
}

export interface Flock {
  id: string
  flock_no: string
  breed: string
  rearing_farm_id: string
  laying_farm_id: string
  placement_date: string
  paid_female: number
  paid_male: number
  free_female: number
  free_male: number
  total_placed_f: number
  total_placed_m: number
  chick_rate: number
  chick_cost: number
  laying_start_date?: string
  status: 'rearing' | 'laying' | 'closed'
  close_date?: string
  remarks?: string
  created_at: string
  rearing_farm?: Farm
  laying_farm?: Farm
}

export interface FlockSummary {
  id: string
  flock_no: string
  breed: string
  status: string
  placement_date: string
  total_placed_f: number
  total_placed_m: number
  rearing_farm: string
  laying_farm: string
  last_record_date?: string
  current_female?: number
  current_male?: number
  total_eggs: number
  total_he: number
  he_pct: number
  he_revenue: number
  nhe_revenue: number
}

export interface DailyRecord {
  id: string
  flock_id: string
  record_date: string
  farm_id: string
  opening_female: number
  opening_male: number
  trcull_female: number
  trcull_male: number
  mortality_female: number
  mortality_male: number
  closing_female: number
  closing_male: number
  feed_female_kg: number
  feed_male_kg: number
  feed_type_f?: string
  feed_type_m?: string
  total_eggs: number
  he_eggs: number
  je_eggs: number
  te_eggs: number
  be_eggs: number
  le_eggs: number
  lighting_hrs?: number
  age_weeks?: number
  hd_pct: number
  he_pct: number
  remarks?: string
}

export interface HEDispatch {
  id: string
  flock_id: string
  dispatch_date: string
  prod_date?: string
  dc_no?: number
  hatchery_id?: string
  party_id?: string
  grade_a: number
  grade_b: number
  total_dispatched: number
  free_eggs: number
  invoice_eggs?: number
  rate?: number
  amount?: number
  setting_date?: string
  hatch_date?: string
  chicks_sold?: number
  hatch_pct?: number
  remarks?: string
  party?: Party
  hatchery?: Hatchery
}

export interface NHESale {
  id: string
  flock_id: string
  sale_date: string
  sale_type: 'je' | 'te' | 'be' | 'bird_cull' | 'bird_lame' | 'bird_weak' | 'bird_sex_error' | 'gas' | 'manure' | 'other'
  party_id?: string
  dc_no?: string
  quantity?: number
  unit?: string
  rate?: number
  amount: number
  remarks?: string
}

export interface FeedIngredient {
  id: string
  code: string
  name: string
  short_name?: string
  category: 'grain' | 'protein' | 'mineral' | 'supplement' | 'additive' | 'other'
  unit: string
  protein_pct?: number
  moisture_pct?: number
  is_active: boolean
}

export interface FeedType {
  id: string
  code: string
  name: string
  category: 'starter' | 'grower' | 'developer' | 'pre_breeder' | 'layer' | 'male'
  week_from?: number
  week_to?: number
  sex: 'female' | 'male' | 'both'
  is_active: boolean
  sort_order: number
}

export interface FeedFormula {
  id: string
  feed_type_id: string
  ingredient_id: string
  qty_per_ton: number
  effective_from: string
  effective_to?: string
  vet_name?: string
  feed_type?: FeedType
  ingredient?: FeedIngredient
}

export interface GRN {
  id: string
  grn_no: string
  grn_date: string
  farm_id: string
  party_id?: string
  invoice_no?: string
  invoice_date?: string
  ingredient_id?: string
  item_name?: string
  qty: number
  unit: string
  bags?: number
  price_per_unit?: number
  basic_amount?: number
  total_amount?: number
  vehicle_no?: string
  remarks?: string
  party?: Party
  ingredient?: FeedIngredient
  farm?: Farm
}

export interface ElectricityMeter {
  id: string
  farm_id: string
  usc_no: string
  service_no?: string
  meter_name: string
  is_active: boolean
  farm?: Farm
}

export interface ElectricityBill {
  id: string
  meter_id: string
  bill_month: string
  units_consumed?: number
  amount: number
  acd_dc_due: number
  deposit_amount: number
  paid_date?: string
  remarks?: string
  meter?: ElectricityMeter
}

export interface Employee {
  id: string
  emp_id?: string
  name: string
  designation?: string
  farm_id: string
  department?: string
  base_salary?: number
  increment?: number
  bank_name?: string
  bank_branch?: string
  account_no?: string
  joining_date?: string
  leaving_date?: string
  is_active: boolean
  farm?: Farm
}

export interface SalaryAbstract {
  id: string
  farm_id: string
  month: string
  total_salary: number
  total_advance: number
  net_salary: number
  employee_count: number
  farm?: Farm
}

export interface Party {
  id: string
  name: string
  type: 'buyer' | 'supplier' | 'both'
  category?: string
  contact?: string
  address?: string
  gstin?: string
  is_active: boolean
}

export interface Hatchery {
  id: string
  name: string
  type: 'Hitech' | 'VHL' | 'Other'
  location?: string
  city?: string
  is_active: boolean
}

export interface Medicine {
  id: string
  name: string
  type: 'medicine' | 'vaccine' | 'supplement' | 'sanitizer' | 'injectable' | 'disinfectant' | 'pesticide' | 'other'
  unit: string
  manufacturer?: string
  rate?: number
  is_active: boolean
}

export interface MedicineMonthly {
  id: string
  flock_id: string
  month: string
  total_amount: number
  remarks?: string
}

// Form types
export type FlockFormData = Omit<Flock, 'id' | 'total_placed_f' | 'total_placed_m' | 'chick_cost' | 'created_at' | 'rearing_farm' | 'laying_farm'>
export type DailyRecordForm = Omit<DailyRecord, 'id' | 'hd_pct' | 'he_pct'>
