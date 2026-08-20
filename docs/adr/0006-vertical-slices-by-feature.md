# Arquitectura mediante vertical slices por feature

**Estado:** Aceptada

## Decisión

Organizar la aplicación principalmente mediante vertical slices definidos por features del producto.

Una feature representa una capacidad o flujo con valor reconocible para el usuario. No representa automáticamente una página, una entidad, un componente visual ni una capa técnica. Una feature puede participar en varias rutas y una ruta puede componer varias features.

Cada slice reúne el código necesario para ofrecer su capacidad, incluyendo únicamente los módulos que su complejidad justifique. Como referencia, puede contener:

- `domain/` para reglas, conceptos e invariantes propios.
- `application/` para coordinar casos de uso cuando exista lógica de orquestación real.
- `api/` para integrar fuentes de datos externas.
- `ui/` para presentar la capacidad e interactuar con el usuario.
- `index.ts` como interfaz pública del slice.

Esta lista es una guía, no una plantilla obligatoria. Una feature sencilla puede contener únicamente UI y una función de datos. No se crearán carpetas, interfaces o capas vacías para aparentar una arquitectura uniforme.

El código debe permanecer cerca de donde se utiliza. Solo se moverá a un módulo compartido cuando exista reutilización real, estable y semánticamente equivalente en varios slices.

Los slices son independientes y no se importan entre sí. Cuando una feature necesita un concepto, componente o lógica que pertenece a otra, esa necesidad indica que la parte reutilizable debe extraerse a `shared/`. La composición de varias features ocurre en el nivel de la aplicación.

## Criterios de decisión

### El sistema cambia por capacidades, no por tipos de archivo

La mayoría de los cambios de producto se expresan como capacidades:

- Permitir descubrir podcasts mediante búsqueda y filtros.
- Reproducir un episodio y recordar el progreso.
- Guardar podcasts como favoritos.
- Mostrar recomendaciones personalizadas.

Un cambio de este tipo suele afectar UI, reglas, datos y tests al mismo tiempo. Si el código se organiza mediante carpetas horizontales globales como `components/`, `hooks/`, `services/`, `models/` y `api/`, implementar una sola capacidad obliga a navegar y modificar varias zonas distantes.

Un vertical slice coloca juntas las partes que cambian por la misma razón. Esto aumenta la cohesión y mejora la localidad del cambio:

- El conocimiento necesario para entender una feature se concentra en una zona.
- Los errores y sus tests se encuentran cerca de la implementación afectada.
- Eliminar o reemplazar una capacidad requiere menos modificaciones fuera de su slice.
- El impacto de un cambio resulta más sencillo de estimar.

La estructura sigue el eje principal de evolución del producto en lugar del tipo técnico de cada archivo.

### Colocation como punto de partida

El código comienza en el lugar más cercano a su único consumidor.

Un componente utilizado solamente por la búsqueda de podcasts pertenece a esa feature, aunque visualmente parezca reutilizable. Un hook que solo coordina el reproductor pertenece a la feature de reproducción. Una función no se mueve a `shared/` solo porque podría resultar útil en el futuro.

La extracción ocurre cuando varios slices presentan una necesidad real y estable. Antes de compartir, debe comprobarse que:

1. Los consumidores necesitan el mismo concepto, no solo código parecido.
2. La abstracción puede ofrecer una interfaz más simple que las implementaciones duplicadas.
3. El módulo compartido tiene ownership y un propósito claros.
4. Un cambio en un consumidor no obligará a añadir excepciones para los demás.

Una duplicación pequeña y temporal suele ser menos costosa que una abstracción compartida equivocada.

### Módulos profundos e interfaces públicas

Cada slice funciona como un módulo. Su interfaz incluye todo lo que otros módulos deben conocer para utilizarlo correctamente, no solo los tipos exportados.

Una buena interfaz pública ofrece pocas operaciones y oculta decisiones internas como:

- La estructura de la respuesta externa.
- La librería utilizada para obtener datos.
- La organización de componentes internos.
- El formato de persistencia.
- Los pasos necesarios para completar un caso de uso.

El objetivo es crear módulos profundos: una interfaz pequeña que proporcione una capacidad significativa y mantenga la complejidad dentro del slice.

La interfaz pública es consumida por el nivel de composición de la aplicación. Otra feature no puede importar esa interfaz ni acceder mediante imports profundos a detalles como `features/favorites/application/internal-command`.

La interfaz pública también es la superficie principal de test. Los tests deben verificar reglas y comportamientos a través de las mismas operaciones que utilizan los consumidores. Se pueden mantener seams internos para tests específicos, pero no forman parte del contrato externo.

### Independencia entre slices

Los slices no mantienen dependencias directas entre sí. Esta regla evita que las fronteras de las features sean únicamente una convención de carpetas mientras el acoplamiento real atraviesa todo el sistema.

Cuando dos features necesitan colaborar existen dos opciones:

1. El nivel de la aplicación importa sus interfaces públicas y coordina la interacción.
2. El concepto mínimo que ambas necesitan se extrae a un módulo de `shared/`.

La composición desde la aplicación es adecuada cuando las capacidades siguen siendo diferentes. Por ejemplo, una ruta puede renderizar descubrimiento y favoritos sin que ninguna feature conozca la otra.

La extracción a `shared/` es adecuada cuando aparece un concepto neutral que realmente pertenece a ambas. Solo se mueve la parte reutilizable, no toda la feature de origen. El módulo extraído debe tener una interfaz clara, ownership definido y una semántica independiente de sus consumidores.

Si la extracción necesita conocer detalles de ambas features, probablemente no existe todavía una abstracción compartida estable. En ese caso debe revisarse si las features forman una sola capacidad o si la coordinación pertenece a la aplicación.

Esta regla elimina las dependencias cíclicas entre features por construcción. También convierte cualquier import directo entre ellas en una señal inmediata de que debe revisarse la ubicación del código.

### Escalabilidad de la arquitectura

Esta decisión mejora la escalabilidad de la base de código y del equipo. No modifica por sí misma el rendimiento en runtime.

Con más features:

- El código nuevo tiene un destino definido por su responsabilidad de producto.
- La complejidad de una capacidad puede crecer dentro de su slice sin extenderse automáticamente al resto.
- Los módulos compartidos se mantienen pequeños porque deben demostrar reutilización real.

Con más personas:

- El ownership puede asignarse por capacidad.
- Equipos diferentes pueden trabajar en slices independientes con menos conflictos.
- Una persona necesita cargar menos contexto para modificar una feature.
- Los pull requests se concentran en una intención de producto y resultan más fáciles de revisar.

Con más complejidad:

- Un slice puede incorporar capas internas cuando aparezca una necesidad real.
- Los slices simples no pagan el coste de patrones diseñados para problemas que no tienen.
- Una feature especialmente compleja puede aplicar internamente principios de arquitectura hexagonal sin imponerlos al resto del sistema.

La arquitectura escala permitiendo complejidad localizada, no intentando que toda la aplicación tenga la misma profundidad.

## Ejemplos

### Descubrimiento de podcasts

Una feature `discover-podcasts` podría incluir:

- Un modelo de criterios de búsqueda.
- Un caso de uso que combina texto, género y orden.
- Un adapter para obtener candidatos desde una fuente externa.
- La cuadrícula, los filtros y sus estados visuales.
- Tests del filtrado y de la interacción.

La feature podría utilizarse en la página principal y en una pantalla de exploración avanzada. Sigue siendo una capacidad, no una ruta.

### Reproducción de episodios

Una feature `play-episode` podría comenzar con un componente que envuelve el elemento `<audio>`. Si más adelante incorpora progreso, velocidad, cola y persistencia, puede añadir módulos de dominio y application dentro del mismo slice.

No es necesario crear esas capas al inicio. La estructura crece con el problema.

### Favoritos

Una feature `manage-favorites` podría exponer una interfaz pequeña:

```ts
export {
  FavoriteButton,
  getFavoritePodcastIds,
  toggleFavoritePodcast,
} from "./public";
```

El almacenamiento, la sincronización y la representación interna permanecen ocultos. Descubrimiento o detalle de podcast pueden utilizar `FavoriteButton` sin importar directamente hooks o adapters internos.

### UI compartida

Si un botón aparece por primera vez dentro de favoritos, permanece allí. Cuando varias features necesiten el mismo botón con el mismo contrato visual y de accesibilidad, puede extraerse a `shared/ui`.

No debe compartirse únicamente porque dos elementos tienen temporalmente las mismas clases CSS. La abstracción se justifica por un concepto estable y varios consumidores reales.

## Reglas de organización

1. Nombrar slices mediante capacidades o acciones del producto.
2. Colocar inicialmente el código junto a su consumidor.
3. Exponer una interfaz pública por slice.
4. Prohibir imports directos entre features, incluidos sus entrypoints públicos.
5. Componer varias features desde el nivel de la aplicación.
6. Mantener la composición global, el routing y el arranque fuera de los slices.
7. Extraer a `shared/` el concepto mínimo cuando una segunda feature demuestre una reutilización semántica real.
8. Asignar ownership a cada módulo compartido.
9. Añadir capas internas únicamente cuando oculten complejidad real.
10. Revisar las fronteras cuando un cambio habitual atraviese demasiados slices.

## Opciones consideradas

### Vertical slices por feature, elegida

Esta opción alinea la estructura con las capacidades que evolucionan, concentra los cambios relacionados y permite que cada parte adopte solo la complejidad que necesita.

Se acepta que las fronteras entre features requieren criterio y pueden cambiar al aprender más sobre el dominio. También se acepta cierta duplicación temporal para evitar abstracciones prematuras.

### Capas horizontales globales, descartada como estructura principal

Organizar por `components/`, `hooks/`, `services/`, `models/` y `api/` resulta familiar y facilita localizar todos los archivos del mismo tipo técnico. También puede simplificar cambios realmente transversales, como sustituir una infraestructura utilizada de manera uniforme.

Se descartó como eje principal porque una modificación de producto suele atravesar varias carpetas. La cohesión se basa en el tipo de archivo, no en la razón por la que cambia. A medida que crece la aplicación, cada carpeta acumula elementos de capacidades no relacionadas y aumenta el contexto necesario para seguir un flujo completo.

Las capas técnicas todavía pueden existir dentro de una feature o como infraestructura compartida cuando respondan a una necesidad real.

### Clean o Hexagonal Architecture aplicada uniformemente, descartada

Clean y Hexagonal Architecture proporcionan principios valiosos para separar dominio, casos de uso e infraestructura mediante seams y adapters. Son especialmente útiles cuando existen múltiples implementaciones, reglas complejas o dependencias externas que deben sustituirse.

Se descartó imponer esa estructura a todas las features desde el inicio. Obligar a cada slice a tener entities, use cases, ports, adapters y una raíz de composición genera módulos poco profundos cuando la capacidad es sencilla. Cada interfaz hipotética aumenta la superficie que debe comprenderse y probarse sin ocultar complejidad real.

Los principios no se rechazan. Una feature puede aplicarlos internamente cuando:

- Tiene reglas de dominio significativas.
- Existen dos o más adapters reales para el mismo seam.
- La orquestación merece aislarse de la UI.
- Sustituir una dependencia constituye un requisito concreto.

La arquitectura selecciona el patrón según la profundidad de cada feature en lugar de aplicarlo de forma uniforme.

## Consecuencias

- La estructura del repositorio refleja capacidades del producto.
- Los cambios de una feature tienden a concentrarse en su slice.
- La navegación y comprensión de un flujo requieren menos saltos entre carpetas globales.
- Los equipos pueden asumir ownership por feature con menor solapamiento.
- Una feature puede crecer internamente sin imponer la misma arquitectura a las demás.
- Elegir la granularidad correcta de un slice requiere criterio y revisión continua.
- Algunas reglas técnicas transversales pueden requerir cambios en varios slices.
- Puede existir duplicación temporal antes de que una abstracción compartida se justifique.
- `shared/` puede convertirse en una carpeta sin cohesión si no se exige reutilización real y ownership.
- Las features no pueden reutilizar código mediante imports directos. Deben extraer el concepto mínimo a `shared/` o delegar la coordinación al nivel de la aplicación.
- La independencia estricta simplifica el grafo de dependencias, pero puede exigir más trabajo de composición o extracción.
- Las interfaces públicas añaden disciplina, pero no deben convertirse en archivos que solo reexportan todos los internals.
- Reubicar una responsabilidad cuando cambian las fronteras forma parte del mantenimiento normal de la arquitectura.

## Heurísticas de salud

### Deletion test

Imaginar que se elimina un slice completo:

- Si desaparece una capacidad reconocible y el resto necesita pocos cambios, la frontera es saludable.
- Si se rompe código no relacionado en muchas zonas, el slice expone demasiados detalles o contiene responsabilidades compartidas.
- Si eliminarlo no reduce complejidad y sus reglas reaparecen distribuidas entre consumidores, probablemente era una capa superficial.

### Localidad del cambio

Revisar los cambios recientes:

- Si una feature habitual modifica principalmente un slice, la estructura acompaña al producto.
- Si casi todos los cambios atraviesan muchos slices, las fronteras o la granularidad deben revisarse.
- Si todos los cambios terminan en `shared/`, esa carpeta está absorbiendo responsabilidades de producto.

### Grafo de dependencias

Observar las relaciones entre slices:

- No deben existir conexiones directas entre features.
- Las features pueden depender de módulos estables de `shared/`.
- Un import entre features indica que debe extraerse un concepto compartido o revisarse la frontera.
- Un módulo de `shared/` con demasiados consumidores o responsabilidades puede estar recreando una capa global sin cohesión.

## Cuándo reconsiderar la decisión

Esta decisión debe volver a evaluarse si se cumple alguna de las siguientes condiciones:

- Los cambios de producto atraviesan sistemáticamente numerosos slices.
- La necesidad de extraer a `shared/` aparece en casi todos los cambios.
- `shared/` concentra lógica de negocio sin ownership claro.
- La granularidad produce decenas de slices pequeños que deben modificarse juntos.
- Una parte importante del sistema requiere los mismos seams y adapters, haciendo más útil una arquitectura uniforme.
- Los equipos se organizan alrededor de plataformas técnicas y no de capacidades del producto.
- Las restricciones de despliegue exigen separar módulos en paquetes o servicios independientes.

Reconsiderar no implica abandonar necesariamente los vertical slices. Primero debe evaluarse si las fronteras son incorrectas, si dos slices deben fusionarse, si uno debe dividirse o si un concepto compartido merece un módulo propio.
