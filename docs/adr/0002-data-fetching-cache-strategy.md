# Estrategia de obtención de datos y gestión de caché

**Estado:** Aceptada

## Decisión

Usar TanStack Query como único mecanismo para obtener, compartir y almacenar en caché los datos remotos de la aplicación.

La caché vive en memoria durante la ejecución y se persiste en `localStorage` mediante `@tanstack/query-sync-storage-persister` y `PersistQueryClientProvider`. Tanto el tiempo máximo de persistencia como el tiempo de garbage collection son de un día. Cada recurso define además un `staleTime` de un día, de acuerdo con el requisito de no volver a solicitar los mismos datos durante ese periodo.

El catálogo utiliza la query key `["podcast-catalog"]`. El detalle de cada podcast, incluida su lista de episodios, utiliza `["podcast-detail", podcastId]`, lo que proporciona una entrada y un periodo de frescura independientes para cada podcast.

El `loader` de `/` obtiene el catálogo durante el build para generar HTML con contenido real. Durante la hidratación, esos datos se entregan a la misma query del catálogo mediante `initialData`. El loader mejora el primer renderizado, pero no introduce otra caché ni otro mecanismo de obtención de datos.

## Criterios de decisión

### Problema y requisitos actuales

El enunciado exige almacenar los datos en el cliente y no volver a obtenerlos hasta que haya pasado un día. El catálogo se comparte entre varias rutas, cada podcast tiene su propia lista de episodios y la caché debe sobrevivir a una recarga del navegador.

Esto requiere resolver correctamente varias responsabilidades:

- Identificar cada recurso de forma estable.
- Evitar peticiones duplicadas para el mismo recurso.
- Distinguir entre datos frescos, obsoletos y eliminables.
- Persistir y restaurar la caché.
- Gestionar peticiones concurrentes, reintentos y errores.
- Mantener sincronizados todos los componentes que consumen el mismo recurso.

La invalidación de caché y la coherencia de datos se consideran problemas especialmente difíciles de implementar correctamente. Una solución manual puede parecer sencilla mientras solo existe un endpoint, pero su complejidad crece rápidamente al añadir recursos, estados de red y reglas de actualización.

TanStack Query es una librería especializada, madura y ampliamente probada que resuelve estas responsabilidades mediante query keys, políticas explícitas de frescura, deduplicación, reintentos y notificaciones reactivas a sus consumidores. Adoptarla reduce la cantidad de código propio en una parte del sistema donde los errores suelen ser sutiles.

El prerenderizado de `/` plantea una necesidad adicional. El HTML debe contener el catálogo para evitar un estado de carga inicial, pero esos datos no deben crear una segunda fuente de verdad. Utilizar `initialData` permite que el contenido generado durante el build inicialice la misma entrada que utilizarán las peticiones posteriores del navegador.

### Estado futuro

- **Más recursos y endpoints:** Cada recurso puede incorporar su propia query key, función de obtención y política de frescura sin modificar un gestor central de caché. Las variables de una petición forman parte de su query key, por lo que los datos permanecen aislados y pueden actualizarse de manera independiente.
- **Mutaciones y backend propio:** TanStack Query proporciona un modelo de mutations e invalidación de queries que permite sincronizar cambios con un backend sin reemplazar la estrategia actual. Las reglas concretas de invalidación deberán definirse cuando existan operaciones de escritura.
- **Persistencia y funcionamiento offline:** La persistencia actual permite reutilizar datos después de una recarga y conservar datos disponibles temporalmente cuando no hay red. Una experiencia offline completa requeriría decisiones adicionales sobre network modes, reintentos, mutations pendientes, service workers y resolución de conflictos.
- **SSR o mayor uso de loaders:** TanStack Query admite hidratación y deshidratación de su caché. Si la aplicación adopta SSR, deberá evaluarse la creación de un `QueryClient` por petición y la transferencia explícita de su estado al cliente. El uso actual de `initialData` para una sola ruta no pretende resolver ese escenario completo.

La estrategia puede crecer con la aplicación sin exigir una abstracción propia delante de TanStack Query. Los hooks de cada funcionalidad, como `usePodcastCatalog()` y `usePodcastDetail()`, siguen siendo la API interna de sus consumidores.

## Opciones consideradas

### TanStack Query con persistencia en `localStorage`, elegida

Resuelve la obtención, deduplicación, frescura, actualización reactiva y persistencia de los datos remotos mediante una única caché. Las query keys permiten separar el catálogo de las listas de episodios y mantener un periodo de un día para cada recurso.

Se acepta depender de la API y del ciclo de actualizaciones de TanStack Query porque sustituye una cantidad significativa de lógica compleja que, de otro modo, tendría que diseñarse, probarse y mantenerse dentro del proyecto.

### Hooks propios con una caché TTL manual en `localStorage`, descartada

Esta opción permitiría implementar exactamente el requisito actual con pocas funciones y sin una dependencia especializada.

Se descartó porque el TTL es solo una parte del problema. También habría que implementar deduplicación de peticiones concurrentes, sincronización entre consumidores, reintentos, errores, garbage collection, restauración segura, invalidación y actualización al recuperar la conexión o el foco. El código inicial sería pequeño, pero crecería hacia una versión incompleta de una librería de server state.

La opción solo sería razonable si las necesidades de caché fueran permanentemente triviales o si existiera una restricción que impidiera incorporar TanStack Query.

### Context personalizado para compartir el catálogo y la caché, descartada

Un `PodcastCatalogProvider` permitiría compartir el catálogo entre rutas y evitar prop drilling. Sin embargo, Context distribuye un valor dentro del árbol de React, pero no proporciona por sí mismo semántica de caché, deduplicación, frescura, persistencia ni revalidación.

Mantener un Context propio encima de TanStack Query duplicaría la fuente de verdad. Mantenerlo sin TanStack Query obligaría a implementar manualmente todas esas responsabilidades dentro del provider. Por ese motivo, los componentes consumen hooks basados directamente en la caché de TanStack Query.

## Consecuencias

- TanStack Query es la única fuente de verdad en tiempo de ejecución para los datos remotos.
- `localStorage` contiene una representación persistida de la caché, no una segunda caché gestionada manualmente.
- El catálogo prerenderizado inicializa la query mediante `initialData`; después de la hidratación se aplican las mismas reglas que a cualquier otro dato de TanStack Query.
- Los componentes que utilizan la misma query key reciben datos compartidos y actualizaciones coordinadas sin un Context de dominio adicional.
- La configuración de query keys, `staleTime` y funciones de obtención vive en los hooks de cada funcionalidad.
- Las funciones de `api/` siguen limitándose a obtener, validar y transformar respuestas externas. No conocen la caché.
- El proyecto queda acoplado a TanStack Query y a su formato de persistencia.
- La caché persistida está limitada por la capacidad y las políticas de almacenamiento del navegador.
- `initialData` se considera actualizado en el momento en que la query se inicializa en el navegador. Si la antigüedad real respecto al momento del build pasa a ser relevante, habrá que proporcionar `initialDataUpdatedAt` o adoptar una hidratación explícita.

## Cuándo reconsiderar la decisión

Esta decisión debe volver a evaluarse si se cumple alguna de las siguientes condiciones:

- El servidor pasa a ser la fuente principal de caché y revalidación.
- El volumen de datos supera lo apropiado para `localStorage`.
- Se almacenan datos sensibles que no deberían persistirse en el navegador.
- La aplicación necesita garantías offline, sincronización en segundo plano o resolución de conflictos.
- Las actualizaciones en tiempo real requieren una estrategia de coherencia distinta.
- TanStack Query genera un coste de mantenimiento superior al valor que proporciona.

Ante esos escenarios debe evaluarse primero si basta con cambiar la configuración, el persister o la integración de TanStack Query. Sustituir la librería o crear una abstracción propia solo estaría justificado por una necesidad concreta que la estrategia actual no pueda satisfacer.
