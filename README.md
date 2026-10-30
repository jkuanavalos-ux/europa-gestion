# Europa — demo local

Ejecutar `npm start` dentro de esta carpeta y abrir http://localhost:5180. También se puede usar iniciar.bat. Detener con Ctrl+C.

No requiere instalar dependencias. Necesita Node.js moderno.

Los datos se guardan en localStorage de este navegador y dirección. No hay cuentas, sincronización ni base compartida todavía. Exportar respaldo descarga un JSON; borrar datos del navegador elimina la copia local. No se incluyen eventos, aportes ni canciones ficticias.

Arquitectura: public/store.js concentra persistencia y validación de enlaces, public/app.js controla las vistas y los formularios, public/style.css define la presentación. server.js sirve archivos locales. La base contiene repertorios con referencias a canciones, eventos, integrantes y movimientos. Cambiar una lista no borra canciones del catálogo. Las operaciones persisten antes de actualizar la pantalla.

Para la versión compartida: reemplazar la capa de persistencia por un repositorio remoto con autenticación, permisos de banda y control de concurrencia. Esta demo no publica datos en internet.

## Secciones principales
- **Repertorios:** cada canción tiene casillas por instrumento (Voz, Coros, Guitarra 2, Guitarra 1, Bajo, Batería y los que se agreguen). Cualquiera con el enlace puede marcar «ya lo aprendí». El estado vive en la **canción**, así que si el tema está en otro repertorio conserva sus marcas.
- **Armar repertorios:** al crear o editar se pueden elegir canciones que ya existen (con buscador por título o artista, sin importar tildes ni mayúsculas) y también escribir canciones nuevas. Los repertorios nuevos aparecen arriba.
- **Ordenar:** *↕ Ordenar* en la lista (repertorios) y *↕ Ordenar canciones* dentro de cada repertorio, con ▲ ▼ y *Guardar orden*. El editor también tiene flechas ↑ ↓ por fila.
- **Colores:** cada repertorio y cada fecha puede tener un color (paleta de 9 + «Sin color») que pinta su tarjeta. Se elige en el formulario de edición.
- **Eliminar:** *Editar repertorio → Eliminar repertorio*. Las canciones y sus marcas se conservan en la biblioteca.
- **Recursos:** enlaces de la banda (redes, Drive…) para abrir o copiar. Se agregan, editan y eliminan desde la propia pestaña.
- **Próximas fechas:** las fechas nuevas se agregan arriba. Se pueden reordenar (*↕ Ordenar*, con ▲ ▼ o *Por fecha*) y eliminar (*Eliminar fecha* dentro de cada una).
- Las pestañas *Objetivos* y *Ahorros* se quitaron (sus datos, `goals` y `movements`, siguen guardados pero ocultos). Los datos viejos (`goals`) siguen guardados en la base, solo que ocultos.

## Pegar una lista
En *Crear/Editar repertorio → Pegar lista* se acepta una canción por línea (`Título – Artista`, con o sin número o viñeta) o el formato de WhatsApp de abajo. Si el repertorio ya tiene la canción, se completa su artista y nombre en vez de duplicarla.

### Formato de WhatsApp
En *Crear/Editar repertorio → Pegar lista* se puede pegar un texto como este (✅ = ya lo aprendió):

```
*ROCK RIO PLATENSE*

- *Tan Lejos*
Voz:✅
Coros:
Bajo:✅

- *El tiempo no para - Bersuit*
Voz:✅
```
Cada canción empieza con un guion; `Título - Artista` separa el artista. Las marcas pegadas se **suman** a las existentes, nunca desmarcan.

## Código
- `public/canciones.js`, `marcas.js`, `importar.js`, `recursos.js`: lógica sin DOM, con tests (`npm test`).
- `api/_validar.js`: valida en el servidor los campos opcionales `resources` y `songs[].parts`.
- Los campos nuevos son opcionales: los datos viejos siguen funcionando y volver a una versión anterior no pierde datos.

## Volver atrás
- Etiqueta de la versión previa a estos cambios: `antes-de-recursos`.
- Deshacer un cambio concreto: `git revert <commit>` (del más nuevo al más viejo) y `git push`.
- Urgente: en Vercel → Deployments, elegir un despliegue anterior y *Promote / Rollback*.

