# React Router en modo framework

**Estado:** Aceptada

## Decisión

Usar React Router en modo framework como framework de la aplicación, configurado con `ssr: false` y prerenderizado de `/` durante el build.

La elección se basa en los requisitos actuales, en cómo podría evolucionar la aplicación y en una preferencia personal explícita por la filosofía de diseño de React Router. No implica que React Router sea universalmente mejor que las alternativas.

## Criterios de decisión

### Problema y requisitos actuales

El enunciado requiere una SPA. routing del lado del cliente sin URLs con hash, bundling y code splitting reales, un build que se distribuya como archivos estáticos y cache del lado del cliente.

La aplicación tiene tres rutas limpias del lado del cliente: el catálogo de podcasts, el detalle de un podcast y el detalle de un episodio. Los datos proceden de endpoints públicos de Apple, se almacenan en caché en el navegador y actualmente no se necesita un backend propio, sesiones autenticadas, secretos exclusivos del servidor ni renderizado por petición.

Esta solución satisface el problema actual sin introducir infraestructura de ejecución que todavía no tendría ninguna responsabilidad.
React Router en modo framework integra el router, Vite y el servidor de desarrollo, con rutas tipadas y code splitting por ruta, sin exigir un servidor. `ssr:false` produce una salida estática en `build/client/`. También permite prerenderizar rutas específicas durante el build mediante la configuración `prerender`, que utilizamos únicamente para `/`.

### Estado futuro

La elección debe seguir siendo útil si la aplicación incorpora más rutas, funcionalidades, tráfico, colaboradores o un backend propio.

- **Más rutas y funcionalidades:** Los módulos de ruta proporcionan un modelo consistente de `Component`, `loader` y `action`. El renderizado, la carga de datos, las mutaciones, los límites de error y la navegación pueden evolucionar sin inventar un patrón distinto para cada funcionalidad.
- **Un equipo más grande:** Las convenciones del framework y los tipos generados reducen la cantidad de convenciones locales que deben aprender los colaboradores y evitan que diverjan los patrones de routing y carga de datos.
- **Más tráfico:** Los archivos estáticos pueden distribuirse mediante una CDN sin escalar un servidor de aplicaciones. Esto permite escalar la entrega de la aplicación, aunque no elimina las limitaciones de disponibilidad o de tasa de las APIs de Apple.
- **Un backend propio:** React Router no impide esta evolución. La primera opción sería conservar el frontend actual y añadir una API independiente. Si los loaders, las actions, los secretos o el renderizado por petición en el servidor pasan a ser fundamentales, React Router también puede desplegarse con SSR habilitado. Cualquiera de los dos caminos cambia la arquitectura de despliegue y deberá evaluarse cuando exista una necesidad concreta.

El framework permite estos caminos de crecimiento, pero el diseño actual no paga su coste operativo por adelantado.

### Preferencia personal

La preferencia personal es un criterio válido cuando las opciones viables satisfacen los requisitos y quien mantiene el proyecto asumirá el coste cotidiano de la elección.

Existe una experiencia comparable con React Router y Next.js, por lo que la decisión no se debe a conocer solamente una de las opciones. Se prefiere React Router porque su equipo diseña de forma consistente alrededor de las APIs del navegador y la mejora progresiva, y porque el patrón `Component` / `loader` / `action` de sus módulos de ruta ofrece un modelo mental claro para el renderizado, las lecturas y las escrituras.

Esta preferencia está subordinada a los requisitos y compromisos anteriores, pero sirve para desempatar entre opciones igualmente válidas.

## Opciones consideradas

### React Router en modo framework — elegida

React Router proporciona una estructura integrada para la aplicación sin exigir un runtime de servidor. Soporta directamente la estrategia de renderizado estático elegida, módulos de ruta tipados, rutas anidadas, code splitting y el modelo `Component` / `loader` / `action`.

La contrapartida es el acoplamiento con las convenciones del modo framework y con el plugin de Vite de React Router. Se acepta ese acoplamiento porque esas convenciones son precisamente la capacidad que se está eligiendo, no dependencias accidentales.

### Next.js App Router — descartada

Next.js es una opción válida y existe experiencia relevante con ella. Ofrece convenciones maduras, un ecosistema sólido, generación estática y renderizado en el servidor.

No se eligió porque supondría sobrediseñar una aplicación de este alcance. App Router convierte los React Server Components en una opción principal y predeterminada, pero el renderizado y el acceso a datos orientados al servidor no aportan un beneficio significativo a una aplicación pequeña cuyos datos públicos se obtienen de Apple, se almacenan en el navegador y se presentan mediante interacciones del cliente. Adoptar ese modelo añadiría superficie conceptual y operativa sin resolver ningún requisito.

Next.js puede producir una exportación estática, pero una salida completamente estática resulta incómoda para las URLs dinámicas de podcasts y episodios cuyos parámetros no se conocen por completo durante el build. Las alternativas serían precalcular todas las rutas, modificar la estrategia de URLs o desplegar un runtime de servidor. Todas ellas añaden restricciones o infraestructura que el fallback de SPA de React Router evita.

El crecimiento por sí solo no justifica adoptar Next.js: React Router puede soportar muchas más rutas, funcionalidades, tráfico y colaboradores. La comparación solo debería reabrirse si el producto desarrolla requisitos concretos para capacidades como estado autenticado en el servidor, React Server Components o renderizado por petición.

### React y Vite con una libreria de Routing — descartada

Esta opción podría satisfacer la aplicación actual y reduciría el acoplamiento con un framework. Para una aplicación de solo tres rutas, el trabajo inicial también sería manejable.

No se eligió porque habría que ensamblar y mantener convenciones para la definición de rutas, carga de datos, mutaciones, generación de tipos, code splitting, límites de error e integración entre el router y las herramientas de build. Esa flexibilidad no aporta valor actualmente, y la cantidad de decisiones locales crecería junto con el número de rutas y el tamaño del equipo. Además en el caso de crecimiento y necesidad de SSR o metodos de renderizado que impliquen web server implicaria un esfuerzo grande que la opcion elegida ya da por resuelto.

La opción sería más atractiva si la independencia respecto al framework o una arquitectura de routing muy personalizada llegaran a ser más importantes que las convenciones integradas.

### TanStack Router y TanStack Start — descartada

TanStack Router ofrece un routing especialmente sólido en cuanto a tipado, y TanStack Start proporciona un framework full-stack más amplio a su alrededor.

En el momento de la decisión, las ventajas adicionales de tipado no compensaban la adopción de una capa de framework menos conocida cuando React Router ya satisfacía los requisitos. La filosofía de React Router, basada en la plataforma web, y su modelo de módulos de ruta también encajaban mejor con las preferencias personales. Elegir TanStack Start habría introducido riesgo de adopción sin resolver un problema actual que React Router dejara pendiente.

Este descarte refleja las necesidades y preferencias del proyecto en el momento de la decisión; no es un juicio general sobre TanStack Router o TanStack Start.

## Consecuencias

- El build de producción es estático y no proporciona SSR por petición ni un lugar para lógica exclusiva del servidor.
- El hosting estático debe reescribir las rutas dinámicas que no coincidan hacia el archivo de fallback de React Router. En Cloudflare Pages esa reescritura no puede apuntar a `__spa-fallback.html`; el mecanismo concreto está en [ADR 0008](0008-cloudflare-pages-spa-fallback.md).
- Solo pueden prerenderizarse las rutas cuyos paths y datos estén disponibles durante el build.
- Los módulos de ruta y el build quedan acoplados a las APIs y al ciclo de actualizaciones del modo framework de React Router.
- La aplicación obtiene un modelo consistente para routing, datos de las rutas, mutaciones, navegación pendiente y errores de ruta.
- Añadir un backend no obliga automáticamente a cambiar de framework, pero sí requiere una nueva decisión de despliegue.
- El criterio de bundling del enunciado supone una configuración manual de Webpack o Parcel. El plugin de Vite de React Router abstrae esa configuración.
- El criterio adicional de SSR del enunciado no se cumple literalmente porque no existe renderizado en el servidor por petición. La alternativa es el prerenderizado estático durante el build de la ruta con mayor tráfico, `/`, que proporciona contenido real en el primer renderizado sin mantener un servidor activo. Se persigue el mismo objetivo, un primer renderizado rápido y no vacío, mediante otro mecanismo.
