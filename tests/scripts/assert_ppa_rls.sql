-- Las políticas deben permitir a la docente A solo sus propios documentos.
INSERT INTO auth.users(id) VALUES ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222');
INSERT INTO public.camila_ppa_versiones(
 teacher_id,nombre,version,ruta_storage,consentimiento_documento_en
) VALUES
('11111111-1111-1111-1111-111111111111','PPA ficticio A',1,'11111111-1111-1111-1111-111111111111/1.docx',now()),
('22222222-2222-2222-2222-222222222222','PPA ficticio B',1,'22222222-2222-2222-2222-222222222222/2.docx',now());
INSERT INTO public.camila_consumo_tokens(teacher_id,modelo,modo,input_tokens,output_tokens)
VALUES
('11111111-1111-1111-1111-111111111111','claude-test','ppa_completo',12,18),
('22222222-2222-2222-2222-222222222222','claude-test','ppa_completo',40,60);
INSERT INTO public.camila_cuotas(teacher_id,plan,max_tokens_mes,max_peticiones_dia)
VALUES
('11111111-1111-1111-1111-111111111111','30_dias',5000,10),
('22222222-2222-2222-2222-222222222222','4_meses',10000,20);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.camila_ppa_versiones;
 IF n<>1 THEN RAISE EXCEPTION 'RLS versiones: esperado 1, recibido %',n; END IF;
 SELECT count(*) INTO n FROM public.camila_consumo_tokens;
 IF n<>1 THEN RAISE EXCEPTION 'RLS consumo: esperado 1, recibido %',n; END IF;
 SELECT count(*) INTO n FROM public.camila_cuotas;
 IF n<>1 THEN RAISE EXCEPTION 'RLS cuotas: esperado 1, recibido %',n; END IF;
END $$;
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.camila_ppa_versiones(teacher_id,nombre,version,ruta_storage,consentimiento_documento_en)
  VALUES('22222222-2222-2222-2222-222222222222','Ataque',2,'22222222-2222-2222-2222-222222222222/attack.docx',now());
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'RLS: se pudo insertar versión ajena'; END IF;
END $$;
DO $$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.camila_consumo_tokens(teacher_id,modelo,modo,input_tokens)
  VALUES('11111111-1111-1111-1111-111111111111','ficticio','chat',99);
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Consumo falsificado por docente'; END IF;
END $$;
SELECT 'RLS PPA, consumo y cuotas comprobados' AS resultado;
