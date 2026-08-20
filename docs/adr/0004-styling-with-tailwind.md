# Estrategia de estilos con Tailwind CSS

**Estado:** Aceptada

## Decisión

Usar Tailwind CSS v4 como estrategia principal de estilos de la aplicación.

Los componentes se diseñan mediante clases utilitarias colocadas directamente junto a su markup. Los tokens propios del producto se definen con `@theme`, que genera tanto utilidades como custom properties de CSS. El proyecto utiliza actualmente tokens de color para la marca y una sombra compartida para las tarjetas.

Tailwind se integra durante el build mediante `@tailwindcss/vite`. No incorpora un runtime de estilos en el navegador ni proporciona componentes visuales terminados. El diseño, la composición, el responsive y los estados de interacción siguen siendo decisiones propias de la aplicación.

## Criterios de decisión

### Problema y requisitos actuales

El enunciado valora que el CSS se escriba desde cero para demostrar su dominio. Tailwind no satisface literalmente ese criterio porque proporciona un sistema existente de utilidades. Esta tensión se acepta de forma explícita y no se presenta Tailwind como si fuera equivalente a escribir cada regla manualmente.

Sin embargo, utilizar Tailwind correctamente sigue exigiendo comprender CSS. Elegir `flex`, `grid`, tamaños, espaciado, especificidad, breakpoints, estados de foco, overflow y composición visual requiere el mismo conocimiento del modelo subyacente. Tailwind cambia la forma de expresar esas decisiones, pero no las toma por el desarrollador.

Al escribir CSS manual suele aparecer una repetición progresiva de declaraciones como `display: flex`, alineación, espaciado, bordes y tipografía. Una respuesta habitual es crear clases utilitarias propias para reutilizar esas reglas. Tailwind aplica esa misma idea de forma coherente, extensa y mantenida, evitando que el proyecto termine construyendo un framework de utilidades incompleto.

Para esta aplicación, Tailwind aporta:

- Mayor velocidad para construir y ajustar la interfaz.
- Una escala consistente de espaciado, tamaños, colores y estados.
- Colocación de los estilos junto a la estructura que los utiliza.
- Menos necesidad de inventar nombres para clases puramente visuales.
- Menos CSS huérfano después de eliminar o modificar componentes.
- Aislamiento frente a colisiones y efectos globales accidentales.
- Generación durante el build de los selectores de utilidades detectados en el código, sin incluir indiscriminadamente todas las utilidades disponibles.

La decisión no sustituye el diseño por una librería de componentes. Cada tarjeta, tabla, indicador, layout y estado interactivo continúa implementándose dentro del proyecto.

### Estado futuro

A medida que aumentan las pantallas y los componentes, también crece la cantidad de decisiones visuales que deben mantenerse consistentes. En una base de CSS manual, los nombres de clases, las excepciones y las reglas duplicadas tienden a crecer de forma desproporcionada.

Convenciones como BEM ayudan a organizar los nombres y las relaciones entre bloques, pero no resuelven por sí solas la repetición de valores, la eliminación de CSS obsoleto ni la consistencia de la escala visual. Además, mantener una convención de nombres uniforme se vuelve más difícil cuando participan más personas.

Tailwind permite que el crecimiento se apoye en un vocabulario compartido de utilidades y variantes. Los tokens definidos con `@theme` pueden evolucionar hacia un design system más amplio sin cambiar la forma en que los componentes consumen colores, espaciado, tipografía o sombras.

Si una combinación visual se repite de forma significativa, la primera opción es extraer un componente que represente el concepto de producto. No se crearán clases semánticas nuevas únicamente para ocultar todas las utilidades, ya que eso reconstruiría una capa de CSS paralela y perdería parte del beneficio elegido.

Pensando en el posible crecimiento de la aplicación, Tailwind está más justificado que en el alcance inicial. Su valor aumenta con la cantidad de componentes y colaboradores que necesitan compartir las mismas restricciones visuales.

## Opciones consideradas

### Tailwind CSS v4, elegida

Tailwind proporciona un sistema utility first, variantes responsive y de estado, tokens configurables y generación de CSS durante el build. Permite crear una interfaz completamente propia sin incorporar componentes prediseñados.

Se acepta que el JSX contenga más clases y que el proyecto quede acoplado al vocabulario de Tailwind. Ese coste se considera menor que mantener un sistema propio de utilidades, nombres, tokens y convenciones a medida que crece la interfaz.

### CSS Modules con variables CSS nativas, descartada

CSS Modules resolvería el scope local y evitaría colisiones entre componentes. Las custom properties permitirían definir tokens compartidos y cumpliría de forma más literal el criterio de CSS escrito desde cero.

Se descartó porque el scope no resuelve la repetición de declaraciones ni proporciona por sí mismo una escala consistente. Cada componente seguiría necesitando nombres propios, nuevas reglas y decisiones sobre cómo compartir patrones. Con el crecimiento de la aplicación, el resultado tendería a convertirse en un conjunto de módulos aislados con utilidades y valores repetidos.

Esta opción sería más atractiva si el criterio de escribir CSS manual tuviera prioridad absoluta o si la interfaz necesitara técnicas que no encajaran bien con clases utilitarias.

### CSS global escrito manualmente, descartada

Es la alternativa con menos dependencias y la que demuestra de forma más directa el conocimiento de CSS. Para una aplicación pequeña sería completamente viable.

Se descartó porque traslada al proyecto la responsabilidad de definir y mantener una convención global de nombres, evitar colisiones, eliminar reglas obsoletas y controlar la repetición. Incluso patrones como BEM reducen la ambigüedad de los nombres, pero añaden ceremonia y no sustituyen un sistema consistente de tokens y utilidades.

Esta opción también aumenta el riesgo de que una modificación local produzca efectos inesperados en otros componentes a medida que crece la hoja de estilos.

## Consecuencias

- El diseño visual sigue siendo propio, pero se expresa principalmente mediante utilidades de Tailwind.
- El proyecto no cumple literalmente el criterio de escribir todo el CSS desde cero.
- El uso correcto de Tailwind sigue requiriendo conocimiento de layout, responsive, cascada, estados y accesibilidad en CSS.
- Los estilos permanecen colocados junto al markup, lo que facilita modificar o eliminar un componente completo.
- El JSX puede volverse visualmente denso cuando un elemento necesita muchas utilidades.
- Las combinaciones repetidas deben extraerse como componentes cuando representan un concepto real, no copiarse indefinidamente.
- `@theme` centraliza los tokens del producto y los expone como custom properties reales de CSS.
- El build queda acoplado al plugin de Vite y al proceso de detección de clases de Tailwind.
- Los nombres de clase construidos dinámicamente deben evitarse cuando impidan que Tailwind detecte las utilidades durante el build.
- Migrar a CSS manual u otra solución exigiría traducir las clases presentes en todos los componentes.
- Tailwind elimina utilidades no detectadas del CSS generado, pero el tamaño final debe verificarse sobre el build en lugar de asumirse.

## Cuándo reconsiderar la decisión

Esta decisión debe volver a evaluarse si se cumple alguna de las siguientes condiciones:

- El volumen de clases en los componentes reduce de forma sostenida la legibilidad o la velocidad de cambio.
- La aplicación adopta un design system externo cuya estrategia de estilos no sea compatible con Tailwind.
- La personalización dinámica en runtime exige una solución que Tailwind no pueda expresar de forma mantenible.
- Las actualizaciones de Tailwind o de su integración con Vite generan un coste superior al valor de sus utilidades.
- El equipo acuerda priorizar CSS manual como objetivo explícito del producto o de la evaluación.

La aparición de más componentes no es por sí sola una razón para abandonar Tailwind. En este proyecto, ese crecimiento es precisamente una de las razones principales para utilizarlo.
