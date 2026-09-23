# Delivery Pro — guía para subir esta versión

## Novedades de esta versión: CUENTAS
- **Cuentas** (antes "Fijos") ahora está en la barra de abajo, con un globito rojo cuando hay algo atrasado o que vence hoy.
- Al tocar **Pagar**, elegís el monto, la **fecha y hora exacta** y una nota. Te sale un comprobante.
- **Historial de pagos**: pestaña *Historial* (todas las cuentas o una sola) y dentro de cada cuenta.
- **Cuotas**: cuántas pagaste, cuántas faltan, cuánto pagaste y cuánto te falta, y la fecha estimada de la última.
- **Atrasos**: aviso rojo con los días de atraso y los meses sin pagar. Ya no se "resetea" al cambiar de mes, así que un mes sin pagar no desaparece.
- **Anular pago** si te equivocaste; **Deshacer** después de eliminar cualquier cosa.
- **PDF del mes**: estado de cada cuenta + lista de pagos con fecha y hora exactas.
- Todo es **opcional**: si no cargás cuentas, no aparece nada.
- Tus gastos fijos actuales se convierten solos, sin perder nada.

**SQL:** esta versión NO necesita SQL nuevo. Las cuentas se guardan dentro de tus datos de siempre.
El único SQL es `supabase/seguridad-delivery-pro.sql` (el mismo de antes). Si ya lo corriste, no hace falta correrlo de nuevo.

La app funciona **antes y después** de correr el SQL: el orden de los pasos no la rompe.

---

## PASO 1 — Subir a GitHub

### Opción A: desde la página de GitHub (sin instalar nada)
1. Abrí tu repositorio en github.com.
2. Borrá el ícono viejo: entrá a `icon-delivery.png` → ícono de papelera → **Commit changes**.
3. Volvé al inicio del repo → **Add file → Upload files**.
4. Descomprimí el zip en tu PC y **arrastrá TODO el contenido** (incluidas las carpetas `.github` y `supabase`).
   - En Windows, si no ves `.github`: Explorador → **Vista → Mostrar → Elementos ocultos**.
5. Abajo tocá **Commit changes**.
6. Revisá que exista el archivo `.github/workflows/keepalive-supabase.yml` en el repo.
   Si no se subió, creálo a mano: **Add file → Create new file**, nombre
   `.github/workflows/keepalive-supabase.yml`, pegá el contenido del archivo y **Commit changes**.

### Opción B: con git (terminal, dentro de la carpeta del repo con el zip ya descomprimido ahí)
```bash
git rm --ignore-unmatch icon-delivery.png && git add -A && git commit -m "Seguridad + robot keep-alive + mejoras" && git push
```

---

## PASO 2 — Activar el robot anti-sueño
1. En el repo: pestaña **Actions**. Si pide habilitarlas: **I understand my workflows, go ahead and enable them**.
2. Elegí **Keep-alive Supabase** → **Run workflow** → **Run workflow**.
3. En un minuto tiene que quedar en verde ✅ con el mensaje "Supabase despierto".

Desde ahí corre solo cada 3 días. Si alguna vez falla, GitHub te avisa por mail.

---

## PASO 3 — Activar la seguridad en Supabase
1. supabase.com/dashboard → proyecto de Delivery Pro → **SQL Editor** → **New query**.
2. Pegá TODO el contenido de `supabase/seguridad-delivery-pro.sql` → **Run**.
3. Al final tiene que mostrar `usuarios_migrados` y `datos_migrados` con números mayores a 0.

No toca las tablas `usuarios` / `datos_usuario`: tus otras apps siguen igual.
Se puede correr más de una vez sin problema.

Después de esto, la app pide ingresar una vez más (mismo usuario y contraseña) y ya queda en modo seguro.

---

## PASO 4 — Cambiar tu contraseña
En la app tocá tu nombre (arriba a la derecha) → **Cambiar contraseña**.
Usá una NUEVA que no uses en tus otras apps (la vieja sigue visible en la tabla `usuarios`).

---

## PASO 5 — Limpieza final (unos días después, cuando todo ande bien)
En el SQL Editor corré:
```sql
delete from public.datos_usuario where username like 'delivery\_%';
```

---

## Si algo falla
| Problema | Solución |
|---|---|
| El robot sale en rojo ❌ | El proyecto quedó pausado: supabase.com/dashboard → **Restore project**, y volvé a correr el robot. |
| No aparece la pestaña Actions o el robot | Falta la carpeta `.github` (ver Paso 1, punto 6). |
| La app sigue mostrando la versión vieja | Cerrala del todo y abrila de nuevo (o recargá 2 veces en el navegador). |
| "Demasiados intentos fallidos" | Esperá 15 minutos. |
