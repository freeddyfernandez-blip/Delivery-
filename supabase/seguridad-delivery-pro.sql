-- ═══════════════════════════════════════════════════════════════════
--  DELIVERY PRO — Seguridad (pegar TODO en Supabase → SQL Editor → Run)
--
--  Qué hace:
--   • Crea tablas PROPIAS de Delivery Pro (dp_usuarios, dp_sesiones, dp_datos),
--     cerradas al público (RLS activado y sin permisos para la clave anon).
--   • Contraseñas con bcrypt (ya no base64).
--   • La app solo entra por funciones seguras: dp_login, dp_cargar, dp_guardar,
--     dp_logout, dp_cambiar_password, dp_ping.
--   • Bloquea 15 minutos un usuario tras 5 contraseñas incorrectas seguidas.
--   • Copia los usuarios y datos actuales (filas 'delivery_…' de datos_usuario).
--
--  NO toca ni borra las tablas usuarios / datos_usuario → tus otras apps siguen igual.
--  Se puede correr más de una vez sin problema.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ── Tablas ──────────────────────────────────────────────────────────
create table if not exists public.dp_usuarios (
  username        text primary key,
  pass_hash       text not null,
  fallos          int  not null default 0,
  bloqueado_hasta timestamptz,
  creado          timestamptz not null default now()
);

create table if not exists public.dp_sesiones (
  token    uuid primary key default gen_random_uuid(),
  username text not null references public.dp_usuarios(username) on delete cascade,
  creado   timestamptz not null default now(),
  expira   timestamptz not null default now() + interval '180 days'
);
create index if not exists dp_sesiones_username_idx on public.dp_sesiones(username);

create table if not exists public.dp_datos (
  username   text primary key references public.dp_usuarios(username) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Cerrar las tablas: nadie con la clave pública puede leerlas ni escribirlas
alter table public.dp_usuarios enable row level security;
alter table public.dp_sesiones enable row level security;
alter table public.dp_datos    enable row level security;
revoke all on public.dp_usuarios, public.dp_sesiones, public.dp_datos from anon, authenticated;

-- ── Funciones ───────────────────────────────────────────────────────
-- Devuelve el usuario dueño de un token válido (o error)
create or replace function public.dp_usuario_de(p_token uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_user text;
begin
  select username into v_user from dp_sesiones where token = p_token and expira > now();
  if v_user is null then raise exception 'sesion_invalida' using errcode = 'P0001'; end if;
  return v_user;
end $$;

-- Login: devuelve un token de sesión, o null si usuario/contraseña no coinciden
create or replace function public.dp_login(p_user text, p_pass text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare u dp_usuarios; v_token uuid;
begin
  select * into u from dp_usuarios where username = lower(trim(p_user));
  if u.username is null then
    perform pg_sleep(0.5);
    return null;
  end if;
  if u.bloqueado_hasta is not null and u.bloqueado_hasta > now() then
    raise exception 'bloqueado' using errcode = 'P0001';
  end if;
  if u.pass_hash <> crypt(p_pass, u.pass_hash) then
    update dp_usuarios
       set fallos = case when fallos + 1 >= 5 then 0 else fallos + 1 end,
           bloqueado_hasta = case when fallos + 1 >= 5 then now() + interval '15 minutes' end
     where username = u.username;
    perform pg_sleep(0.5);
    return null;
  end if;
  update dp_usuarios set fallos = 0, bloqueado_hasta = null where username = u.username;
  delete from dp_sesiones where expira < now();
  insert into dp_sesiones(username) values (u.username) returning token into v_token;
  return v_token;
end $$;

create or replace function public.dp_cargar(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_user text := dp_usuario_de(p_token); v_data jsonb;
begin
  select data into v_data from dp_datos where username = v_user;
  return v_data;
end $$;

create or replace function public.dp_guardar(p_token uuid, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_user text := dp_usuario_de(p_token);
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'datos_invalidos' using errcode = 'P0001';
  end if;
  insert into dp_datos(username, data, updated_at) values (v_user, p_data, now())
  on conflict (username) do update set data = excluded.data, updated_at = now();
  return true;
end $$;

create or replace function public.dp_logout(p_token uuid)
returns void language sql security definer set search_path = public, extensions as $$
  delete from dp_sesiones where token = p_token;
$$;

create or replace function public.dp_cambiar_password(p_token uuid, p_actual text, p_nueva text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_user text := dp_usuario_de(p_token); v_hash text;
begin
  if length(coalesce(p_nueva,'')) < 6 then
    raise exception 'password_corta' using errcode = 'P0001';
  end if;
  select pass_hash into v_hash from dp_usuarios where username = v_user;
  if v_hash <> crypt(p_actual, v_hash) then return false; end if;
  update dp_usuarios set pass_hash = crypt(p_nueva, gen_salt('bf')) where username = v_user;
  delete from dp_sesiones where username = v_user and token <> p_token; -- cierra otros teléfonos
  return true;
end $$;

-- Para el robot de GitHub: toca la base sin exponer nada
create or replace function public.dp_ping()
returns int language sql security definer set search_path = public as $$
  select count(*)::int from dp_usuarios;
$$;

-- Solo estas funciones quedan disponibles para la app
revoke all on function public.dp_usuario_de(uuid) from public, anon, authenticated;
revoke all on function public.dp_login(text,text), public.dp_cargar(uuid), public.dp_guardar(uuid,jsonb),
                       public.dp_logout(uuid), public.dp_cambiar_password(uuid,text,text), public.dp_ping()
  from public;
grant execute on function public.dp_login(text,text), public.dp_cargar(uuid), public.dp_guardar(uuid,jsonb),
                          public.dp_logout(uuid), public.dp_cambiar_password(uuid,text,text), public.dp_ping()
  to anon, authenticated;

-- ── Migración de usuarios y datos actuales ──────────────────────────
-- Las contraseñas viejas estaban en base64: se decodifican y se guardan con bcrypt.
do $$
declare r record; v_plain text; n int := 0;
begin
  for r in select username, password from public.usuarios where username is not null and password is not null loop
    begin
      v_plain := convert_from(decode(r.password, 'base64'), 'LATIN1');
      insert into public.dp_usuarios(username, pass_hash)
      values (lower(trim(r.username)), extensions.crypt(v_plain, extensions.gen_salt('bf')))
      on conflict (username) do nothing;
      n := n + 1;
    exception when others then
      raise notice 'Usuario % no migrado (contraseña con formato raro): %', r.username, sqlerrm;
    end;
  end loop;
  raise notice 'Usuarios procesados: %', n;
end $$;

insert into public.dp_datos(username, data, updated_at)
select u.username, d.data::jsonb, now()
from public.datos_usuario d
join public.dp_usuarios u on u.username = substr(d.username, length('delivery_') + 1)
where d.username like 'delivery\_%' and d.data is not null
on conflict (username) do nothing;

-- Avisar a la API que hay funciones nuevas
notify pgrst, 'reload schema';

-- Resumen
select (select count(*) from public.dp_usuarios) as usuarios_migrados,
       (select count(*) from public.dp_datos)    as datos_migrados;

-- ═══════════════════════════════════════════════════════════════════
--  PASO 2 (DESPUÉS, cuando confirmes que la app nueva funciona bien):
--  borrar la copia vieja de los datos de Delivery Pro, que sigue siendo pública.
--  Descomentá y corré solo esta línea:
--
--  delete from public.datos_usuario where username like 'delivery\_%';
-- ═══════════════════════════════════════════════════════════════════
