# Validación y transformación de datos externos con Zod

**Estado:** Aceptada

## Decisión

Usar Zod para validar en runtime todas las respuestas externas en el límite de la aplicación y transformarlas directamente al modelo de dominio.

Cada función dentro de `api/` define el esquema de la respuesta que consume. La función recibe JSON desconocido, lo valida con Zod y devuelve únicamente tipos internos como `PodcastSummary` o `Episode`. Ningún componente, hook ni función de dominio debe conocer o manipular directamente la estructura original de Apple o de futuros feeds.

Toda validación aplica la misma política base: los datos inválidos no se propagan y el error se registra en la consola con suficiente contexto para diagnosticarlo. La respuesta de la interfaz depende de si el error impide obtener datos utilizables:

- Si la estructura principal de una respuesta es inválida y no pueden obtenerse datos utilizables, se rechaza la operación, se registra el error y se muestra al usuario un mensaje amigable y básico.
- Si un elemento individual de una colección es inválido pero los demás siguen siendo utilizables, se descarta únicamente ese elemento y se registra el error. No se muestra un mensaje al usuario porque la funcionalidad puede continuar con los datos válidos.
- El catálogo es una unidad coherente. Si su estructura principal o alguna entrada requerida es inválida, se rechaza la respuesta completa.
- La respuesta de episodios puede contener junto a los episodios otros resultados de Apple o elementos individuales inválidos. Cada elemento se valida mediante `safeParse()`, se conservan los episodios válidos y se registran los que se descartan.
- No se implementa una experiencia elaborada de recuperación. El mensaje al usuario no expone detalles técnicos y el diagnóstico permanece en la consola.

## Criterios de decisión

### Problema y requisitos actuales

Los datos proceden de un backend externo sobre el que la aplicación no tiene control. Aunque sus respuestas tengan una estructura conocida hoy, Apple puede omitir campos, cambiar tipos, añadir variantes o introducir breaking changes sin que el compilador del proyecto lo detecte.

TypeScript solo verifica el código durante el desarrollo. Sus tipos se eliminan al compilar y no demuestran que el JSON recibido durante la ejecución cumpla una interfaz. Anotar el resultado de `response.json()` como `PodcastSummary[]` proporcionaría confianza estática sin ninguna garantía real sobre los datos.

Por ese motivo, toda respuesta externa se considera `unknown` hasta superar una validación en runtime. Zod permite expresar el contrato esperado y convertir la respuesta externa al modelo interno en la misma operación:

- Los campos anidados de Apple, como `im:name.label`, se convierten en propiedades de dominio como `title`.
- Los identificadores numéricos se normalizan como strings cuando así lo requiere el modelo.
- Los campos opcionales o ausentes pueden recibir defaults explícitos cuando la interfaz puede continuar sin ellos.
- Las URLs, arrays y estructuras anidadas se comprueban antes de llegar a la UI.
- Los campos externos que la aplicación no utiliza no se propagan al resto del sistema.

La validación en el límite concentra el conocimiento del contrato externo en un solo lugar. Si Apple cambia su respuesta, el error aparece en la función de `api/` correspondiente en vez de manifestarse más tarde como un fallo ambiguo dentro de un componente.

### Estado futuro

Esta decisión cobra más valor a medida que se incorporan nuevas APIs o contratos externos.

- Cada nueva fuente de datos debe tener su propio esquema en el límite de su slice.
- Un cambio incompatible en Apple debe producir un error de validación localizado y observable, no datos parcialmente corruptos dentro de la aplicación.
- La futura lectura de feeds XML debe tratar el resultado del parser como datos desconocidos y validarlo antes de convertirlo en episodios.
- Si distintas fuentes representan el mismo concepto de maneras diferentes, cada adaptador puede transformarlas al mismo tipo de dominio sin trasladar esas diferencias a la UI.

La política estricta o tolerante debe decidirse por respuesta, pero no cambia la obligación de registrar todos los errores. Las colecciones que solo tienen sentido completas pueden rechazarse por entero y mostrar un mensaje básico. Las colecciones donde un elemento inválido no impide utilizar los demás pueden conservar los elementos válidos sin interrumpir al usuario, siempre registrando qué se descartó y por qué.

## Opciones consideradas

### Zod, elegida

Zod valida datos reales durante la ejecución y permite transformarlos al modelo de dominio dentro del mismo pipeline.

Su enfoque TypeScript first permite describir esquemas utilizando un modelo familiar para quienes trabajan en TypeScript, con inferencia estática y validación en runtime a partir de la misma definición.

También se valora su madurez, documentación y adopción dentro del ecosistema. Otras librerías pueden proporcionar garantías similares, pero Zod resuelve el problema sin introducir una curva de aprendizaje o un riesgo de adopción adicional para este proyecto.

Se acepta el coste de una dependencia y de ejecutar validación en el cliente porque los datos no están bajo nuestro control y un tipo de TypeScript no ofrece esa protección.

### Confiar únicamente en tipos o assertions de TypeScript, descartada

Esta opción tendría coste de ejecución nulo y menos código. Las respuestas podrían declararse directamente como los tipos esperados mediante annotations o assertions.

Se descartó porque TypeScript no valida JSON en runtime. Una assertion solo indica al compilador que confíe en el desarrollador. Si una respuesta externa no cumple el tipo declarado, el problema atraviesa la capa de datos y falla más tarde en un lugar menos claro.

Esta alternativa solo sería aceptable para datos creados y controlados completamente dentro del mismo proceso, no para respuestas de terceros.

### Otra librería de validación de esquemas, descartada

Librerías como Valibot, ArkType o io-ts podrían resolver la validación en runtime y algunas ofrecen ventajas específicas de tamaño, rendimiento o estilo de tipos.

No se identificó para este proyecto una necesidad concreta que justificara elegirlas sobre Zod. La experiencia previa, el enfoque TypeScript first y la madurez del ecosistema de Zod reducen el riesgo de implementación. La decisión no implica que las otras opciones sean técnicamente incapaces.

## Consecuencias

- Las estructuras externas solo se conocen dentro de las funciones y esquemas de `api/`.
- El resto de la aplicación trabaja exclusivamente con tipos de dominio validados y normalizados.
- Los cambios incompatibles de una API fallan cerca de la fuente y resultan más fáciles de diagnosticar.
- Los esquemas añaden código y coste de validación en runtime al bundle del cliente.
- Las transformaciones de Zod quedan acopladas tanto al contrato externo como al modelo interno.
- Los defaults aplicados con `.catch()` permiten continuar ante campos no esenciales inválidos, pero también pueden ocultar degradaciones del contrato. Deben reservarse para valores cuya ausencia tenga una alternativa segura.
- La validación estricta del catálogo prioriza coherencia sobre disponibilidad parcial.
- La validación tolerante de episodios prioriza mostrar los elementos válidos, pero exige observabilidad para que los elementos descartados no pasen desapercibidos.
- La implementación actual descarta silenciosamente los episodios que no superan `safeParse()`. Debe añadirse un registro en consola de `error.issues` para cumplir la política acordada.
- La implementación debe mostrar un mensaje amigable y básico cuando una respuesta completa no pueda utilizarse.
- Los errores recuperables de elementos individuales se registran, pero no interrumpen al usuario ni sustituyen los datos válidos por un estado de error.
- No mostrar detalles técnicos ni una experiencia avanzada de recuperación es una restricción deliberada del alcance actual, no una recomendación para una aplicación de producción.

## Cuándo reconsiderar la decisión

Esta decisión debe volver a evaluarse si se cumple alguna de las siguientes condiciones:

- El coste de bundle o de validación de Zod se vuelve medible y relevante.
- Los contratos pasan a generarse desde OpenAPI, JSON Schema u otra fuente que favorezca una herramienta diferente.
- El volumen de datos requiere una estrategia de validación incremental o más eficiente.
- La aplicación necesita compartir contratos ejecutables con un backend propio.
- Zod deja de adaptarse al modelo de tipos o a las necesidades de transformación del proyecto.

La presencia de más schemas no es por sí sola una razón para sustituir Zod. La migración solo estaría justificada por una limitación concreta y medible de la estrategia actual.
