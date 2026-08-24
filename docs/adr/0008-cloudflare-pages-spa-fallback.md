# Fallback SPA en Cloudflare Pages mediante `404.html`

**Estado:** Aceptada

## Decisión

En Cloudflare Pages, servir el shell de SPA de React Router copiándolo a `404.html` durante el build. No usar `_redirects` hacia `__spa-fallback.html` y no depender del modo SPA por defecto de Pages.

El hook `buildEnd` de `react-router.config.ts` copia `build/client/__spa-fallback.html` a `build/client/404.html`. React Router no permite cambiar el nombre del fallback; Cloudflare Pages no permite elegir un archivo distinto de `index.html` o `404.html` para las rutas desconocidas.

## Criterios de decisión

### El problema

El build prerenderiza `/` a `index.html` (catálogo) y escribe el shell vacío en `__spa-fallback.html` para `/podcast/:id` y `/podcast/:id/episode/:id`. Recargar una URL dinámica exige que el hosting sirva ese shell con la URL original intacta, para que el cliente hidrate la ruta real.

Cloudflare Pages no ofrece un ajuste del tipo «rutas desconocidas → este HTML». Solo tiene dos modos, detectados por la presencia de un `404.html` en la raíz:

| Modo            | Condición          | Qué sirve para una ruta sin archivo  | Resultado en esta app                                                |
| --------------- | ------------------ | ------------------------------------ | -------------------------------------------------------------------- |
| SPA por defecto | No hay `404.html`  | Siempre `/` (`index.html`) con `200` | El catálogo prerenderizado; la URL de episodio acaba en el dashboard |
| Página 404      | Existe `/404.html` | Ese archivo, con estado `404`        | El shell de SPA; React Router hidrata `/podcast/...`                 |

Workers con `not_found_handling: "single-page-application"` también fija el fallback a `index.html`. No hay parámetro para apuntar a `__spa-fallback.html`.

### Por qué `_redirects` no sirve

La regla que documenta React Router para hosts estáticos:

```
/*    /__spa-fallback.html   200
```

en Pages no se queda en una reescritura `200`. Pages redirige los HTML a su URL sin extensión (`/__spa-fallback.html` → `308` `/__spa-fallback`). Esa URL vuelve a coincidir con `/*` y el ciclo produce `TOO_MANY_REDIRECTS`.

### Estado HTTP 404

Pages sirve `404.html` con `404`. La URL del navegador no cambia, así que la hidratación funciona. El coste es que recargas reales de podcast y episodio no son `200`. Se acepta porque es el único mecanismo estático que Pages documenta para no mapear esas URLs a `/`.
