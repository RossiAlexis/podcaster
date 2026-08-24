# Descripciones enriquecidas de episodios desde feeds RSS

**Estado:** Aceptada

## Decisión

Obtener el detalle básico del podcast y sus episodios desde la API Lookup de Apple y completar la descripción del episodio consultando el `feedUrl` del podcast.

La consulta del feed RSS es necesaria porque el requisito pide mostrar la descripción enriquecida con su estructura HTML. Apple permite localizar el podcast y el episodio, pero su respuesta no garantiza conservar el contenido HTML completo publicado por el productor. El RSS es la fuente que expone ese contenido mediante campos como `<content:encoded>` y `<description>`.

Se utiliza `fast-xml-parser` para transformar el XML del feed en datos JavaScript y DOMPurify para sanitizar el HTML no confiable antes de insertarlo en el DOM.

## Estrategia

### Obtención y enriquecimiento

1. La API Lookup de Apple proporciona los metadatos del podcast, la lista de episodios, sus `episodeGuid`, sus URLs de audio y el `feedUrl`.
2. TanStack Query almacena el detalle del podcast bajo `["podcast-detail", podcastId]`.
3. Al abrir un episodio, una query dependiente localiza primero el episodio dentro del detalle ya disponible.
4. Se solicita el `feedUrl` y se busca el `<item>` cuyo `<guid>` coincide con el `episodeGuid` entregado por Apple. Se utiliza como fallback la URL del `<enclosure>` y después el título normalizado, dado a que Apple no garantiza que `<guid>` y `episodeGuid` sean iguales para todos los episodios.
5. El episodio enriquecido se almacena bajo `["podcast-episode", podcastId, episodeId]`.

### Recuperación ante CORS o indisponibilidad

La aplicación intenta solicitar primero el feed directamente desde el navegador. Algunos proveedores permiten peticiones cross-origin y esta ruta evita intermediarios.

Los navegadores no permiten distinguir mediante `fetch` un bloqueo CORS de otros errores de red. Por eso, cuando la petición directa se rechaza o devuelve un estado HTTP no satisfactorio, se repite mediante el endpoint `/raw` de AllOrigins.

Cada intento de obtener el feed se aborta si no recibe respuesta en ocho segundos. Este timeout no responde a una característica del protocolo RSS ni a un SLA publicado por los proveedores: es una política de experiencia de usuario. Los feeds pertenecen a muchos hosts independientes, con disponibilidad y tiempos de respuesta heterogéneos. Esperar indefinidamente por una descripción impediría mostrar un episodio cuyos metadatos y audio ya están disponibles desde Apple.

Si también falla AllOrigins, el XML no puede interpretarse o no se encuentra un `<item>` correspondiente, la operación conserva el episodio procedente de Apple. La pantalla se degrada mostrando los datos disponibles en lugar de sustituir todo el episodio por un estado de error.

AllOrigins es un fallback y no una fuente de datos. Introduce una dependencia sobre un servicio público sin garantías propias de disponibilidad. Si esa dependencia deja de ser aceptable, deberá sustituirse por un proxy controlado por el proyecto.

## Parseo XML con `fast-xml-parser`

Se elige `fast-xml-parser` porque funciona en JavaScript sin dependencias nativas y transforma strings XML en objetos que pueden recorrerse de forma defensiva en el navegador.

La configuración conserva los atributos mediante `ignoreAttributes: false`, necesario para leer la URL del `<enclosure>`, y expone el contenido CDATA bajo una propiedad conocida mediante `cdataPropName`. Esto permite recuperar HTML incluido en CDATA sin tratarlo como markup del propio documento RSS.

También permite manejar diferencias habituales entre feeds:

- Un único `<item>` puede convertirse en un objeto mientras varios elementos se convierten en un array.
- Los feeds pueden utilizar namespaces como `content:encoded` e `itunes:summary`.
- Un valor puede aparecer como texto, número, CDATA o nodo con `#text`, incluido el `<guid>` utilizado para relacionar el episodio.
- Algunos productores publican campos presentes pero vacíos.

El resultado del parser continúa considerándose dato externo no confiable. Se accede mediante funciones defensivas que comprueban cada nodo antes de convertirlo al modelo `Episode`.

### Alternativas descartadas

`DOMParser`, disponible en el navegador, evitaría una dependencia y permitiría recorrer el documento mediante APIs del DOM. Se descartó porque trasladaría al proyecto más lógica manual para normalizar namespaces, CDATA, atributos y las diferencias entre uno o varios elementos. `fast-xml-parser` concentra esa transformación y mantiene la función de integración independiente de selectores DOM.

Interpretar el XML mediante expresiones regulares se descarta porque XML admite entidades, namespaces, atributos, CDATA y anidamiento que una expresión regular no modela de forma segura.

## Sanitización HTML con DOMPurify

El HTML incluido en un RSS procede de terceros y no debe insertarse directamente mediante `dangerouslySetInnerHTML`. Aunque el proveedor sea conocido, el contenido puede contener scripts, event handlers, URLs ejecutables u otros elementos capaces de producir XSS.

DOMPurify se ejecuta en el navegador sobre la descripción antes del renderizado. Se elige porque es una librería especializada y madura para sanear HTML utilizando las reglas reales del DOM, una superficie de seguridad que no es razonable reimplementar dentro del proyecto.

La configuración usa una allowlist reducida de etiquetas de contenido, como párrafos, énfasis, listas, encabezados, enlaces y bloques de código. Solo se permiten los atributos `href` y `title`; se deshabilitan atributos ARIA y `data-*` procedentes del feed. DOMPurify conserva URLs seguras y elimina protocolos ejecutables como `javascript:`.

El resultado saneado es el único valor que se entrega a `dangerouslySetInnerHTML`. Ninguna cadena HTML externa debe evitar esta frontera.
