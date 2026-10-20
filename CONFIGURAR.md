# Publicar Europa

1. En Supabase → SQL Editor → New query: pegar `supabase/setup.sql` y pulsar Run. Crea una tabla de estado con revisión y un bucket privado de fotos; no elimina datos.
2. Importar este repositorio en Vercel. Framework: Other. Root Directory: raíz del repositorio. Output Directory: public. Sin comando de build. Las funciones están en api/ y Vercel las despliega automáticamente.
3. En Environment Variables de Vercel agregar:
   - SUPABASE_URL: URL del proyecto de Supabase.
   - SUPABASE_SECRET_KEY: clave secreta de Supabase (sb_secret_… o legacy service_role). Nunca ponerla en archivos públicos ni GitHub.
   - (Opcional, solo para acceso privado) EUROPA_PRIVATE=true y EUROPA_ACCESS_TOKEN: secreto aleatorio de al menos 32 caracteres. No hace falta para que el link de Vercel entre directo. Para generarlo localmente: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Deploy. Si las variables se agregan después, hacer Redeploy.
5. Abrir y compartir `https://TU-DOMINIO.vercel.app`: cualquiera que tenga ese enlace entra directo y puede ver y editar. Con el modo privado (EUROPA_PRIVATE=true) el enlace es `https://TU-DOMINIO.vercel.app/#acceso=TU_EUROPA_ACCESS_TOKEN`; para revocarlo se cambia el token y se redespliega.
6. Crear un repertorio desde un dispositivo y recargar desde otro. Probar también una foto y un aporte. Si dos dispositivos editan una misma versión, solo se acepta el primero: el segundo debe cerrar el formulario, recargar y repetir su edición.

## Datos y alcance

No hay cuentas ni pantalla de login. Cualquiera con el enlace de la app tiene permisos de lectura y edición (y puede borrar datos). Si el enlace se comparte fuera del grupo, activá el modo privado. No es posible identificar qué integrante hizo cada cambio.

La versión local sigue usando los datos anteriores en el navegador. No se copian automáticamente a Supabase. No borrar ese almacenamiento si se desea migrarlo después. La versión publicada empieza vacía.

La estructura actual se conserva dentro de una columna JSONB, con actualización atómica condicionada a la revisión. Esto evita una migración destructiva de la demo y puede separarse en tablas por entidad más adelante. Las fotos nuevas se comprimen en el navegador y se guardan en Storage privado, nunca en GitHub. Las fotos reemplazadas se conservan por ahora; su limpieza deberá hacerse posteriormente sin eliminar fotos en uso.

Los datos compartidos requieren conexión. No se realiza guardado local silencioso si el servidor falla. Se ven los cambios ajenos al recargar. No hay sincronización en vivo todavía.

## Que Supabase no se pause (plan gratis)
Vercel ejecuta `/api/keepalive` una vez por día (configurado en `vercel.json`), lo que mantiene activo el proyecto de Supabase. También sirve para diagnosticar: abrí `https://TU-DOMINIO.vercel.app/api/keepalive`. Si dice `{"ok":true}` la conexión funciona; si no, `detail` indica la causa (por ejemplo `HTTP 401: Invalid API key` = clave incorrecta, `HTTP 404` = falta ejecutar `supabase/setup.sql`).
Si el proyecto ya estaba pausado, restauralo primero desde el panel de Supabase (Resume project).
