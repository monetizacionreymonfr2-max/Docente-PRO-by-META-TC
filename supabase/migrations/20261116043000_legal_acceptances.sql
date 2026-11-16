-- Aceptación auditable de políticas DOCENTY PRO (v1).
-- Registro inmutable por versión, siempre fechado por PostgreSQL.
CREATE TABLE IF NOT EXISTS public.docenty_legal_acceptances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, version),
  CONSTRAINT legal_version_valid CHECK (length(version) >= 8 AND length(version) <= 30)
);
ALTER TABLE public.docenty_legal_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.docenty_legal_acceptances FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.docenty_legal_acceptances TO authenticated;

DROP POLICY IF EXISTS docenty_legal_acceptances_read_own ON public.docenty_legal_acceptances;
CREATE POLICY docenty_legal_acceptances_read_own
ON public.docenty_legal_acceptances FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Ningún cliente puede insertar, modificar, borrar o falsificar fechas directamente.
CREATE OR REPLACE FUNCTION public.accept_docenty_legal(p_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $legal$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Se requiere iniciar sesión'; END IF;
  IF p_version <> '2026-11-16' THEN RAISE EXCEPTION 'Versión de condiciones no disponible'; END IF;
  INSERT INTO public.docenty_legal_acceptances (user_id, version, accepted_at)
  VALUES (v_uid, p_version, now())
  ON CONFLICT (user_id, version) DO NOTHING;
END
$legal$;
REVOKE ALL ON FUNCTION public.accept_docenty_legal(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_docenty_legal(text) TO authenticated;
