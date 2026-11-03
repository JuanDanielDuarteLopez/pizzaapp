-- =====================================================================
--  KONYS PIZZA · App de reservas de mesas
--  Esquema de base de datos para Supabase (PostgreSQL)
--
--  CÓMO USARLO
--  1. Entra a tu proyecto de Supabase > SQL Editor > New query.
--  2. Pega TODO este archivo y pulsa "Run".
--  3. Es seguro ejecutarlo más de una vez (no duplica datos de ejemplo).
--
--  PIN DE ADMINISTRADOR
--  Por defecto es 1234. Cámbialo desde la app (Admin > Cambiar PIN)
--  o ejecutando:  select public.admin_cambiar_pin('1234', '4821');
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. TABLAS
-- ---------------------------------------------------------------------

create table if not exists public.mesas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  zona        text not null check (zona in ('terraza', 'salon')),
  capacidad   int  not null check (capacidad > 0),
  activa      boolean not null default true,
  foto_url    text,
  creado_en   timestamptz not null default now()
);

create table if not exists public.horarios (
  id             uuid primary key default gen_random_uuid(),
  dia_semana     text not null check (dia_semana in
                   ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  jornada        text not null check (jornada in ('almuerzo', 'noche')),
  hora_inicio    time not null,
  hora_fin       time not null,
  duracion_slot  int  not null default 60 check (duracion_slot between 15 and 240),
  activo         boolean not null default true,
  unique (dia_semana, jornada),
  check (hora_fin > hora_inicio)
);

create table if not exists public.reservas (
  id                uuid primary key default gen_random_uuid(),
  mesa_id           uuid not null references public.mesas(id) on delete cascade,
  cliente_nombre    text not null,
  cliente_contacto  text,
  num_personas      int  not null check (num_personas > 0),
  fecha             date not null,
  hora_inicio       time not null,
  hora_fin          time not null,
  estado            text not null default 'confirmada'
                      check (estado in ('confirmada', 'cancelada', 'completada')),
  creado_en         timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

create index if not exists reservas_mesa_fecha_idx on public.reservas (mesa_id, fecha);
create index if not exists reservas_fecha_idx on public.reservas (fecha);

create table if not exists public.platos (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  categoria    text not null check (categoria in ('pizzas', 'entradas', 'postres', 'bebidas')),
  descripcion  text,
  precio       numeric(12,0) not null default 0 check (precio >= 0),
  disponible   boolean not null default true
);

-- Configuración interna (aquí vive el PIN del administrador, cifrado).
create table if not exists public.config (
  clave  text primary key,
  valor  text not null
);

-- ---------------------------------------------------------------------
-- 2. SEGURIDAD (Row Level Security)
--    - Los clientes SOLO pueden LEER mesas, horarios y platos disponibles.
--    - Nadie puede leer ni escribir "reservas" ni "config" directamente.
--    - Todo lo demás pasa por las funciones de la sección 3.
-- ---------------------------------------------------------------------

alter table public.mesas    enable row level security;
alter table public.horarios enable row level security;
alter table public.reservas enable row level security;
alter table public.platos   enable row level security;
alter table public.config   enable row level security;

drop policy if exists "lectura publica de mesas" on public.mesas;
create policy "lectura publica de mesas" on public.mesas
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica de horarios" on public.horarios;
create policy "lectura publica de horarios" on public.horarios
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica de platos disponibles" on public.platos;
create policy "lectura publica de platos disponibles" on public.platos
  for select to anon, authenticated using (disponible = true);

-- Permisos de lectura (por si tu proyecto no los trae por defecto).
grant select on public.mesas, public.horarios, public.platos to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. FUNCIONES
-- ---------------------------------------------------------------------

-- 3.1 Utilidades internas del PIN (no se pueden llamar desde la app)

create or replace function public.es_admin(p_pin text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select valor = extensions.crypt(coalesce(p_pin, ''), valor)
       from public.config where clave = 'admin_pin_hash'),
    false);
$$;

create or replace function public.exigir_admin(p_pin text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.es_admin(p_pin) then
    perform pg_sleep(0.4);               -- frena intentos masivos
    raise exception 'pin_incorrecto';
  end if;
end;
$$;

revoke all on function public.es_admin(text)      from public, anon, authenticated;
revoke all on function public.exigir_admin(text)  from public, anon, authenticated;

-- 3.2 Funciones para el CLIENTE

-- Horas ya ocupadas de una mesa en una fecha (sin exponer datos personales).
create or replace function public.slots_ocupados(p_mesa uuid, p_fecha date)
returns table (hora_inicio time, hora_fin time)
language sql stable security definer
set search_path = public
as $$
  select r.hora_inicio, r.hora_fin
    from public.reservas r
   where r.mesa_id = p_mesa
     and r.fecha = p_fecha
     and r.estado = 'confirmada';
$$;

-- Crea una reserva de forma atómica: valida y evita dobles reservas.
create or replace function public.crear_reserva(
  p_mesa         uuid,
  p_nombre       text,
  p_contacto     text,
  p_personas     int,
  p_fecha        date,
  p_hora_inicio  time,
  p_hora_fin     time
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_mesa  public.mesas;
  v_id    uuid;
  v_dia   text;
begin
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'nombre_requerido';
  end if;

  select * into v_mesa from public.mesas where id = p_mesa;
  if not found or not v_mesa.activa then
    raise exception 'mesa_no_disponible';
  end if;

  if p_personas is null or p_personas < 1 or p_personas > v_mesa.capacidad then
    raise exception 'capacidad_excedida';
  end if;

  if p_hora_fin <= p_hora_inicio then
    raise exception 'horas_invalidas';
  end if;

  if p_fecha < (now() at time zone 'America/Bogota')::date then
    raise exception 'fecha_pasada';
  end if;

  v_dia := (array['lunes','martes','miercoles','jueves','viernes','sabado','domingo'])
             [extract(isodow from p_fecha)::int];

  if not exists (
    select 1 from public.horarios h
     where h.dia_semana = v_dia
       and h.activo
       and p_hora_inicio >= h.hora_inicio
       and p_hora_fin    <= h.hora_fin
  ) then
    raise exception 'fuera_de_horario';
  end if;

  -- Bloqueo por mesa+fecha: dos clientes no pueden reservar a la vez.
  perform pg_advisory_xact_lock(hashtextextended(p_mesa::text || p_fecha::text, 0));

  if exists (
    select 1 from public.reservas r
     where r.mesa_id = p_mesa
       and r.fecha = p_fecha
       and r.estado = 'confirmada'
       and r.hora_inicio < p_hora_fin
       and r.hora_fin    > p_hora_inicio
  ) then
    raise exception 'slot_ocupado';
  end if;

  insert into public.reservas
    (mesa_id, cliente_nombre, cliente_contacto, num_personas, fecha, hora_inicio, hora_fin)
  values
    (p_mesa, trim(p_nombre), nullif(trim(coalesce(p_contacto, '')), ''),
     p_personas, p_fecha, p_hora_inicio, p_hora_fin)
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'mesa_nombre', v_mesa.nombre,
    'zona', v_mesa.zona,
    'fecha', p_fecha,
    'hora_inicio', p_hora_inicio,
    'hora_fin', p_hora_fin,
    'num_personas', p_personas,
    'cliente_nombre', trim(p_nombre)
  );
end;
$$;

-- 3.3 Funciones para el ADMINISTRADOR (todas exigen el PIN)

create or replace function public.admin_verificar(p_pin text)
returns boolean
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if public.es_admin(p_pin) then
    return true;
  end if;
  perform pg_sleep(0.4);
  return false;
end;
$$;

create or replace function public.admin_cambiar_pin(p_pin text, p_nuevo text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform public.exigir_admin(p_pin);
  if p_nuevo !~ '^[0-9]{4}$' then
    raise exception 'pin_invalido';
  end if;
  insert into public.config (clave, valor)
  values ('admin_pin_hash', extensions.crypt(p_nuevo, extensions.gen_salt('bf')))
  on conflict (clave) do update set valor = excluded.valor;
end;
$$;

-- Mesas
create or replace function public.admin_guardar_mesa(
  p_pin        text,
  p_id         uuid,
  p_nombre     text,
  p_zona       text,
  p_capacidad  int,
  p_activa     boolean,
  p_foto_url   text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public.exigir_admin(p_pin);
  if p_id is null then
    insert into public.mesas (nombre, zona, capacidad, activa, foto_url)
    values (trim(p_nombre), p_zona, p_capacidad, coalesce(p_activa, true),
            nullif(trim(coalesce(p_foto_url, '')), ''))
    returning id into v_id;
  else
    update public.mesas
       set nombre = trim(p_nombre), zona = p_zona, capacidad = p_capacidad,
           activa = coalesce(p_activa, activa),
           foto_url = nullif(trim(coalesce(p_foto_url, '')), '')
     where id = p_id
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_activar_mesa(p_pin text, p_id uuid, p_activa boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  update public.mesas set activa = p_activa where id = p_id;
end;
$$;

create or replace function public.admin_borrar_mesa(p_pin text, p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  if exists (
    select 1 from public.reservas r
     where r.mesa_id = p_id and r.estado = 'confirmada'
       and r.fecha >= (now() at time zone 'America/Bogota')::date
  ) then
    raise exception 'mesa_con_reservas';
  end if;
  delete from public.mesas where id = p_id;
end;
$$;

-- Horarios
create or replace function public.admin_guardar_horario(
  p_pin          text,
  p_dia          text,
  p_jornada      text,
  p_hora_inicio  time,
  p_hora_fin     time,
  p_duracion     int,
  p_activo       boolean
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  insert into public.horarios (dia_semana, jornada, hora_inicio, hora_fin, duracion_slot, activo)
  values (p_dia, p_jornada, p_hora_inicio, p_hora_fin, p_duracion, p_activo)
  on conflict (dia_semana, jornada) do update
    set hora_inicio = excluded.hora_inicio,
        hora_fin = excluded.hora_fin,
        duracion_slot = excluded.duracion_slot,
        activo = excluded.activo;
end;
$$;

-- Reservas
create or replace function public.admin_listar_reservas(p_pin text)
returns table (
  id uuid, mesa_id uuid, mesa_nombre text, cliente_nombre text, cliente_contacto text,
  num_personas int, fecha date, hora_inicio time, hora_fin time, estado text,
  creado_en timestamptz
)
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  return query
    select r.id, r.mesa_id, m.nombre, r.cliente_nombre, r.cliente_contacto,
           r.num_personas, r.fecha, r.hora_inicio, r.hora_fin, r.estado, r.creado_en
      from public.reservas r
      join public.mesas m on m.id = r.mesa_id
     order by r.fecha desc, r.hora_inicio desc;
end;
$$;

create or replace function public.admin_estado_reserva(p_pin text, p_id uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  if p_estado not in ('confirmada', 'cancelada', 'completada') then
    raise exception 'estado_invalido';
  end if;
  update public.reservas set estado = p_estado where id = p_id;
end;
$$;

-- Carta
create or replace function public.admin_listar_platos(p_pin text)
returns setof public.platos
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  return query select * from public.platos order by categoria, nombre;
end;
$$;

create or replace function public.admin_guardar_plato(
  p_pin          text,
  p_id           uuid,
  p_nombre       text,
  p_categoria    text,
  p_descripcion  text,
  p_precio       numeric,
  p_disponible   boolean
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public.exigir_admin(p_pin);
  if p_id is null then
    insert into public.platos (nombre, categoria, descripcion, precio, disponible)
    values (trim(p_nombre), p_categoria, nullif(trim(coalesce(p_descripcion, '')), ''),
            coalesce(p_precio, 0), coalesce(p_disponible, true))
    returning id into v_id;
  else
    update public.platos
       set nombre = trim(p_nombre), categoria = p_categoria,
           descripcion = nullif(trim(coalesce(p_descripcion, '')), ''),
           precio = coalesce(p_precio, 0), disponible = coalesce(p_disponible, disponible)
     where id = p_id
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_borrar_plato(p_pin text, p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public.exigir_admin(p_pin);
  delete from public.platos where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. DATOS DE EJEMPLO (solo se cargan si las tablas están vacías)
--    Cambia los precios y platos por los reales desde el panel Admin.
-- ---------------------------------------------------------------------

insert into public.config (clave, valor)
values ('admin_pin_hash', extensions.crypt('1234', extensions.gen_salt('bf')))
on conflict (clave) do nothing;

do $$
begin
  if not exists (select 1 from public.mesas) then
    insert into public.mesas (nombre, zona, capacidad, activa) values
      ('Mesa 1', 'terraza', 2, true),
      ('Mesa 2', 'terraza', 4, true),
      ('Mesa 3', 'salon',   6, true),
      ('Mesa 4', 'salon',   4, false),
      ('Mesa 5', 'salon',   8, true);
  end if;

  if not exists (select 1 from public.horarios) then
    insert into public.horarios (dia_semana, jornada, hora_inicio, hora_fin, duracion_slot)
    select d, j.jornada, j.ini, j.fin, 60
      from unnest(array['lunes','martes','miercoles','jueves','viernes','sabado','domingo']) as d,
           (values ('almuerzo', time '12:30', time '14:30'),
                   ('noche',    time '17:00', time '23:00')) as j(jornada, ini, fin);
  end if;

  if not exists (select 1 from public.platos) then
    insert into public.platos (nombre, categoria, descripcion, precio) values
      ('Pizza Konys',   'pizzas',   'La especialidad de la casa (ejemplo, edita ingredientes).', 45000),
      ('Margarita',     'pizzas',   'Salsa de tomate, mozzarella y albahaca.',                    32000),
      ('Hawaiana',      'pizzas',   'Jamón, piña y mozzarella.',                                  36000),
      ('Pepperoni',     'pizzas',   'Pepperoni y mozzarella.',                                    38000),
      ('Cuatro quesos', 'pizzas',   'Mezcla de cuatro quesos.',                                   40000),
      ('Pan de ajo',    'entradas', 'Pan artesanal con mantequilla de ajo.',                      12000),
      ('Tiramisú',      'postres',  'Postre clásico italiano.',                                   14000),
      ('Gaseosa',       'bebidas',  'Botella personal.',                                           5000),
      ('Limonada',      'bebidas',  'Limonada natural.',                                           8000);
  end if;
end $$;
