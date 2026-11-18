-- Delivery Pro: preservar el bloque de vehículos al guardar desde versiones antiguas.
-- No crea tablas nuevas ni modifica registros existentes.
create or replace function public.dp_guardar(p_token uuid, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_user text := dp_usuario_de(p_token);
  v_old jsonb; v_new jsonb := p_data; m_new jsonb; k text;
  km_old numeric; km_new numeric;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'datos_invalidos' using errcode = 'P0001';
  end if;
  select data into v_old from dp_datos where username = v_user;
  if v_old is not null then
    if jsonb_typeof(v_old->'meses') = 'object' then
      m_new := case when jsonb_typeof(v_new->'meses') = 'object' then v_new->'meses' else '{}'::jsonb end;
      for k in select jsonb_object_keys(v_old->'meses') loop
        if not (m_new ? k)
           or (length((v_old->'meses'->k)::text) > 300
               and length((m_new->k)::text) < length((v_old->'meses'->k)::text) / 2) then
          m_new := jsonb_set(m_new, array[k], v_old->'meses'->k, true);
        end if;
      end loop;
      v_new := jsonb_set(v_new, '{meses}', m_new, true);
    end if;
    km_old := coalesce(nullif(regexp_replace(coalesce(v_old->'moto'->>'km',''), '[^0-9.]', '', 'g'), '')::numeric, 0);
    km_new := coalesce(nullif(regexp_replace(coalesce(v_new->'moto'->>'km',''), '[^0-9.]', '', 'g'), '')::numeric, 0);
    if km_old > 0 and km_new = 0 then
      v_new := jsonb_set(v_new, '{moto}', v_old->'moto', true);
    end if;
    foreach k in array array['gastosFijos', 'depositos', 'gastosPersonales', 'autos'] loop
      if jsonb_typeof(v_old->k) in ('array', 'object')
         and length((v_old->k)::text) > 2
         and (not (v_new ? k) or length(coalesce((v_new->k)::text, '')) <= 2) then
        v_new := jsonb_set(v_new, array[k], v_old->k, true);
      end if;
    end loop;
  end if;
  insert into dp_datos(username, data, updated_at) values (v_user, v_new, now())
  on conflict (username) do update set data = excluded.data, updated_at = now();
  return true;
end $$;
