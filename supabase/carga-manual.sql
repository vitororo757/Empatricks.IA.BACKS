-- Execute apenas manualmente, após revisão, no banco autorizado com psql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/carga-manual.sql
-- CSV com cabeçalho: patrimonio,url. URLs já enviadas manualmente ao bucket público.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE imagens (patrimonio text PRIMARY KEY, url text NOT NULL UNIQUE) ON COMMIT DROP;
\copy imagens(patrimonio, url) FROM 'urls.csv' WITH (FORMAT csv, HEADER true)
CREATE TEMP TABLE carga (patrimonio text PRIMARY KEY, nome text NOT NULL, categoria text NOT NULL, situacao text NOT NULL) ON COMMIT DROP;
INSERT INTO carga VALUES
('TI-0001','Notebook 14 polegadas','notebook','available'),
('TI-0002','Notebook 15 polegadas','notebook','available'),
('TI-0003','Notebook 13 polegadas','notebook','available'),
('TI-0004','Notebook 15 polegadas','notebook','maintenance'),
('TI-0005','Monitor 24 polegadas','monitor','available'),
('TI-0006','Monitor 27 polegadas','monitor','available'),
('TI-0007','Monitor 22 polegadas','monitor','maintenance'),
('TI-0008','Cabo HDMI 2 m','cabo','available'),
('TI-0009','Cabo USB-C 1 m','cabo','available'),
('TI-0010','Cabo de rede 3 m','cabo','maintenance'),
('TI-0011','Webcam Full HD','camera','available'),
('TI-0012','Câmera compacta','camera','available');
LOCK TABLE public.equipment, public.loans IN SHARE ROW EXCLUSIVE MODE;
DO $check$
BEGIN
 IF (SELECT count(*) FROM imagens) <> 12 OR EXISTS (SELECT 1 FROM carga c LEFT JOIN imagens i USING (patrimonio) WHERE i.patrimonio IS NULL OR i.url !~ '^https://[^[:space:]]+$') THEN
   RAISE EXCEPTION 'São necessárias 12 URLs HTTPS únicas para os patrimônios exatos.';
 END IF;
 IF EXISTS (SELECT 1 FROM public.equipment e JOIN carga c ON c.patrimonio=e.asset_tag WHERE e.status <> c.situacao) THEN
   RAISE EXCEPTION 'Estado existente difere do inicial; revisão manual necessária.';
 END IF;
 IF EXISTS (SELECT 1 FROM public.equipment e JOIN carga c ON c.patrimonio=e.asset_tag JOIN public.loans l ON l.equipment_id=e.id WHERE l.returned_at IS NULL) THEN
   RAISE EXCEPTION 'Há equipamento com empréstimo ativo; não sobrescrever.';
 END IF;
END $check$;
INSERT INTO public.equipment (asset_tag,name,category,status,image_url)
SELECT c.patrimonio,c.nome,c.categoria,c.situacao,i.url FROM carga c JOIN imagens i USING (patrimonio)
ON CONFLICT (asset_tag) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,status=EXCLUDED.status,image_url=EXCLUDED.image_url;
COMMIT;


