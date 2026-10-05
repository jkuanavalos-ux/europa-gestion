# Europa — demo local

Ejecutar `npm start` dentro de esta carpeta y abrir http://localhost:5180. También se puede usar iniciar.bat. Detener con Ctrl+C.

No requiere instalar dependencias. Necesita Node.js moderno.

Los datos se guardan en localStorage de este navegador y dirección. No hay cuentas, sincronización ni base compartida todavía. Exportar respaldo descarga un JSON; borrar datos del navegador elimina la copia local. No se incluyen eventos, aportes ni canciones ficticias.

Arquitectura: public/store.js concentra persistencia y validación de enlaces, public/app.js controla las vistas y los formularios, public/style.css define la presentación. server.js sirve archivos locales. La base contiene repertorios con referencias a canciones, eventos, integrantes y movimientos. Cambiar una lista no borra canciones del catálogo. Las operaciones persisten antes de actualizar la pantalla.

Para la versión compartida: reemplazar la capa de persistencia por un repositorio remoto con autenticación, permisos de banda y control de concurrencia. Esta demo no publica datos en internet.
