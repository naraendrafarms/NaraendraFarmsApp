-- Permanent, systematic fix for "same real item, different name in Intent /
-- PO / GRN / Medicine Usage" — instead of relying on exact-string name
-- matching between independently-typed free-text columns (the class of bug
-- behind the Vitalosin duplicate and the unlinked medicine_usage.item_id
-- issue), every alternate name an item is known by becomes an explicit,
-- auditable row here, pointing at ONE canonical items.id.
CREATE TABLE IF NOT EXISTS public.item_aliases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL,
  source      TEXT,  -- 'item_name'|'short_name'|'medicine'|'grn'|'po'|'intent'|'manual' — informational only
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One alias string can only ever point at one item — this is what makes
-- "search finds the right item no matter which of its names you type"
-- possible without ambiguity.
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_aliases_norm
  ON public.item_aliases (lower(trim(alias)));

CREATE INDEX IF NOT EXISTS idx_item_aliases_item ON public.item_aliases(item_id);

ALTER TABLE public.item_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY item_aliases_select ON public.item_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY item_aliases_insert ON public.item_aliases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY item_aliases_update ON public.item_aliases FOR UPDATE TO authenticated USING (true);
CREATE POLICY item_aliases_delete ON public.item_aliases FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_audit ON public.item_aliases;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.item_aliases
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Reusable resolver: given a free-text name, find its item_id via the alias
-- table (falls back to nothing if unknown — callers leave item_id NULL and
-- the app's "Link to Item" picker is how a brand-new name gets its first
-- alias registered).
CREATE OR REPLACE FUNCTION public.fn_resolve_item_id(p_name TEXT)
RETURNS UUID LANGUAGE sql STABLE AS
$$
  SELECT item_id FROM public.item_aliases
  WHERE lower(trim(alias)) = lower(trim(p_name))
  LIMIT 1;
$$;

-- Registers (or no-ops if it already exists) an alias — every "Link to
-- Item" action in the app calls this so that name is remembered forever
-- afterward. ON CONFLICT DO NOTHING: an alias already pointing at a
-- DIFFERENT item is left alone rather than silently repointed; the caller
-- can see that from fn_resolve_item_id returning the existing item_id.
CREATE OR REPLACE FUNCTION public.fn_register_item_alias(p_item_id UUID, p_alias TEXT, p_source TEXT DEFAULT 'manual')
RETURNS VOID LANGUAGE plpgsql AS
$$
BEGIN
  IF p_alias IS NULL OR trim(p_alias) = '' THEN RETURN; END IF;
  INSERT INTO public.item_aliases (item_id, alias, source)
  VALUES (p_item_id, trim(p_alias), p_source)
  ON CONFLICT (lower(trim(alias))) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ── One-time seed from every existing name source ──────────────────────────
-- Every item's own name and short_name.
INSERT INTO public.item_aliases (item_id, alias, source)
SELECT id, name, 'item_name' FROM public.items WHERE name IS NOT NULL AND trim(name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

INSERT INTO public.item_aliases (item_id, alias, source)
SELECT id, short_name, 'short_name' FROM public.items WHERE short_name IS NOT NULL AND trim(short_name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

-- Medicines master names (only those already resolvable to a real item by
-- exact name match — same join migration 347/187 used).
INSERT INTO public.item_aliases (item_id, alias, source)
SELECT i.id, mm.name, 'medicine'
FROM public.medicines_master mm
JOIN public.items i ON lower(trim(i.name)) = lower(trim(mm.name))
WHERE mm.name IS NOT NULL AND trim(mm.name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

-- GRN / PO / Purchase Intent line names that are ALREADY linked via item_id
-- (from the 151 backfill) — their exact wording becomes a permanent alias
-- for that item too, so it's found by that name from now on everywhere.
INSERT INTO public.item_aliases (item_id, alias, source)
SELECT DISTINCT item_id, item_name, 'grn'
FROM public.grn WHERE item_id IS NOT NULL AND item_name IS NOT NULL AND trim(item_name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

INSERT INTO public.item_aliases (item_id, alias, source)
SELECT DISTINCT item_id, item_name, 'po'
FROM public.purchase_orders WHERE item_id IS NOT NULL AND item_name IS NOT NULL AND trim(item_name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

INSERT INTO public.item_aliases (item_id, alias, source)
SELECT DISTINCT item_id, item_name, 'intent'
FROM public.purchase_intent_lines WHERE item_id IS NOT NULL AND item_name IS NOT NULL AND trim(item_name) <> ''
ON CONFLICT (lower(trim(alias))) DO NOTHING;

SELECT count(*) AS aliases_seeded FROM public.item_aliases;
