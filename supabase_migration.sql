-- Run this in your Supabase SQL editor to create the responses table.
-- Table: dpe_responses
-- Stores every completed questionnaire submission + computed results.

CREATE TABLE IF NOT EXISTS dpe_responses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Step 1: General
  housing_type        TEXT,
  surface_area        INTEGER,
  construction_period TEXT,
  arrondissement      TEXT,

  -- Step 2: Current DPE
  current_dpe  TEXT,
  annual_bill  INTEGER,

  -- Step 3: Envelope
  wall_insulation  TEXT,
  roof_insulation  TEXT,
  floor_insulation TEXT,
  window_type      TEXT,
  orientation      TEXT,

  -- Step 4: Heating
  heating_types      TEXT[],
  heating_age        TEXT,
  distribution_system TEXT,

  -- Step 5: Energy
  energy_sources TEXT[],

  -- Step 6: Ventilation
  ventilation_type TEXT,
  air_leakage      TEXT,

  -- Step 7: Occupancy & Habits
  occupants            INTEGER,
  hot_water_usage      TEXT,
  thermostat_temp      NUMERIC,
  heating_habits       TEXT,
  heating_frequency    TEXT,
  airing_habit         TEXT,
  laundry_frequency    TEXT,
  uses_dishwasher      BOOLEAN,
  uses_dryer           BOOLEAN,
  leaves_lights_on     BOOLEAN,
  programmable_heating BOOLEAN,

  -- Computed results
  computed_consumption INTEGER,  -- kWh/m²/year from rule-based engine
  ml_dpe_class         TEXT,     -- prediction from the ML model (may be null if API unreachable)
  rule_dpe_class       TEXT      -- fallback from dpe-calculator.ts
);

-- Optional: disable RLS for anonymous inserts (adjust to your security policy)
ALTER TABLE dpe_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON dpe_responses FOR INSERT
  TO anon
  WITH CHECK (true);
