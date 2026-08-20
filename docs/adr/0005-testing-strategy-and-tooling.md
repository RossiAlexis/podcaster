# Estrategia y herramientas de testing

**Estado:** Aceptada

## Decisión

Mantener una suite de tests dividida en tres niveles:

- Tests unitarios con Vitest para lógica de dominio, transformaciones y funciones puras.
- Tests de componentes con Vitest, React Testing Library y `@testing-library/user-event` sobre jsdom.
- Tests end to end con Playwright sobre el build estático de producción.

Vitest es el runner común para tests unitarios y de componentes. React Testing Library define la forma de probar la UI mediante el DOM observable y queries cercanas a cómo una persona identifica los elementos. `user-event` es la opción predeterminada para interacciones.

Playwright valida los flujos críticos en un navegador real. La configuración actual ejecuta Chromium, pero la herramienta se elige también por permitir ampliar la cobertura a Firefox y WebKit sin cambiar de runner.

El workflow de CI debe ejecutar formato, lint, typecheck, tests de Vitest, build de producción y tests de Playwright. Toda la secuencia debe completarse correctamente antes de integrar cambios en `main`.

## Criterios de decisión

### Problema y requisitos actuales

La aplicación combina lógica pura, componentes interactivos, routing del lado del cliente, caché persistida y un artefacto estático con reglas de fallback. Ningún nivel de test cubre por sí solo todos esos riesgos con un coste razonable.

La estrategia separa responsabilidades:

- Los tests unitarios proporcionan feedback rápido sobre reglas y transformaciones sin montar React.
- Los tests de componentes comprueban el comportamiento observable de piezas de UI sin arrancar un navegador completo.
- Los tests end to end verifican que las rutas, la navegación, el build estático y la aplicación integrada funcionan en un navegador real.

Cada comportamiento debe probarse en el nivel más bajo que proporcione confianza suficiente. Los tests end to end se reservan para flujos críticos y riesgos de integración, no para repetir todas las combinaciones ya cubiertas por tests unitarios o de componentes.

### Vitest para tests unitarios y de componentes

El proyecto utiliza Vite, ESM y TypeScript. Vitest utiliza la canalización de Vite para transformación y resolución, y soporta directamente TypeScript, JSX y ESM. Esto evita mantener para los tests una segunda estrategia basada en Babel, `ts-jest` u otros transformadores.

Vitest proporciona una API compatible en gran parte con Jest, incluyendo assertions, mocks, spies, snapshots y temporizadores. También ofrece watch mode basado en el grafo de módulos de Vite, ejecución paralela, sharding y cobertura mediante V8 o Istanbul.

Estas capacidades no implican que Vitest sea universalmente más rápido o completo que Jest. Ambos tienen watch mode, paralelismo, mocks y cobertura. La ventaja concreta en este repositorio es reducir la distancia entre el entorno de build y el entorno de tests.

### React Testing Library para comportamiento de componentes

React Testing Library fomenta tests basados en la salida observable del componente en lugar de su estado interno, métodos privados o estructura de implementación.

Las queries por rol y nombre accesible son la primera opción porque se aproximan a la forma en que una persona o una tecnología asistiva identifica controles y contenido. Esto mejora la resistencia de los tests frente a refactors internos y también incentiva una semántica HTML correcta.

`user-event` describe interacciones completas, como hacer foco, escribir y disparar la secuencia correspondiente de eventos.

Esta aproximación tiene límites claros. Los tests actuales se ejecutan en jsdom, una implementación del DOM dentro de Node, no en Chromium, Firefox o WebKit. jsdom no reproduce con autoridad layout, pintura, hit testing, navegación, selección ni todas las APIs del navegador. `user-event` simula secuencias más realistas dentro de ese entorno, pero no genera interacciones mediante un navegador real.

Los comportamientos cuyo riesgo dependa de CSS, foco real, medidas, scroll, navegación o diferencias entre motores deben probarse con Playwright.

### Playwright para tests end to end

Playwright ejecuta la aplicación en navegadores reales y proporciona:

- Browser contexts aislados para cada test.
- Locators orientados a roles, labels y contenido visible.
- Auto waiting antes de realizar acciones.
- Assertions que reintentan hasta cumplirse o agotar su timeout.
- Ejecución paralela y sharding.
- Trazas con acciones, snapshots del DOM, red, consola y errores.
- Capturas de pantalla y vídeo configurables.
- Proyectos para Chromium, Firefox y WebKit.

Estas capacidades encajan con una SPA cuyo routing y fallback estático deben verificarse sobre el artefacto de producción. El E2E ejecuta primero el build, sirve `build/client/` y recorre las rutas reales.

Auto waiting no elimina toda posible intermitencia. Los tests todavía pueden fallar por dependencias externas, estado compartido, selectores ambiguos o condiciones imposibles. Los reintentos ayudan a recopilar información de diagnóstico, pero no deben utilizarse para ignorar tests inestables.

### Estado futuro

- **Más flujos end to end:** Playwright permite paralelizar tests independientes y distribuir la suite mediante sharding. Antes de aumentar el paralelismo debe comprobarse que los tests no compartan datos ni estado externo.
- **Cobertura cross browser:** Los smoke tests críticos podrán ejecutarse en Chromium, Firefox y WebKit. El soporte de WebKit de Playwright aproxima el motor de Safari, pero no sustituye una prueba sobre Safari real si esa plataforma se convierte en requisito.
- **Regresión visual:** Playwright puede incorporar comparaciones de screenshots. Deberán definirse tolerancias, plataformas de referencia y una política explícita de actualización para evitar snapshots inestables.
- **Accesibilidad:** Las queries por rol mejoran la semántica, pero no forman una auditoría completa. Se podrán añadir comprobaciones automatizadas y pruebas manuales específicas sin sustituir los tests funcionales.
- **Tests de componentes en navegador:** Vitest Browser Mode puede añadirse selectivamente cuando un componente dependa de APIs o comportamiento que jsdom no representa. No se duplicará toda la suite por defecto.

## Opciones consideradas

### Vitest, elegido

Vitest encaja con la canalización Vite, ESM y TypeScript del proyecto y cubre tanto tests unitarios como de componentes mediante una configuración pequeña. Su compatibilidad conceptual con Jest reduce la curva de aprendizaje sin introducir una segunda cadena de transformación.

### Jest, descartado

Jest es un runner maduro con un ecosistema amplio, watch mode, mocks, snapshots, paralelismo y cobertura. Sería especialmente razonable en una organización con presets, plugins o infraestructura interna ya construida alrededor de Jest.

Se descartó porque este repositorio tendría que mantener una configuración separada para transformar TypeScript, JSX y ESM, además de reproducir o simular comportamientos de Vite. La propia documentación de Jest advierte que Vite no está soportado directamente debido a diferencias con su sistema de plugins.

El soporte ESM de Jest también continúa documentado como experimental y utiliza APIs específicas como `jest.unstable_mockModule`. Vitest no elimina todas las dificultades de mocking en ESM, pero se adapta de forma más natural a la configuración actual.

No se utiliza como argumento que Vitest sea siempre más rápido. Esa afirmación necesitaría un benchmark sobre esta suite concreta.

### React Testing Library, elegida

Permite probar componentes mediante roles, labels, texto visible e interacciones observables. Los tests sobreviven mejor a cambios de implementación que no alteran el comportamiento del usuario.

Se acepta la menor visibilidad sobre el estado interno porque ese estado no forma parte del contrato que la UI ofrece.

### Enzyme, descartado

Enzyme facilita inspeccionar árboles de componentes, props, estado y unidades renderizadas de forma superficial. Ese estilo puede resultar útil para aislar piezas internas.

Se descartó porque fomenta tests ligados a la estructura del componente y a detalles que pueden cambiar durante un refactor sin modificar el comportamiento. La estrategia elegida prioriza el DOM y las interacciones que constituyen el contrato observable.

### Playwright, elegido

Proporciona una API de test integrada, aislamiento por browser context, auto waiting, trazas portables y soporte para Chromium, Firefox y WebKit. Encaja con la preferencia personal por sus locators y herramientas de diagnóstico.

### Cypress, descartado

Cypress es una alternativa sólida. Su Open Mode, Command Log y snapshots por comando ofrecen una experiencia de depuración local especialmente rica. También proporciona aislamiento y un modelo de retry que reduce esperas manuales.

Se eligió Playwright porque su aislamiento mediante browser contexts, sus trazas utilizables después de un fallo en CI y su soporte estable de proyectos WebKit encajan mejor con las prioridades del proyecto. El soporte WebKit de Cypress continúa marcado como experimental y con limitaciones documentadas.

Ambas herramientas tienen modelos de espera y reintento distintos. No existe evidencia suficiente para afirmar que una sea universalmente más estable. Migrar a Cypress solo se justificaría si su experiencia interactiva, Cypress Cloud o su modelo de component testing resolvieran una necesidad concreta.

### Suite completa frente a tests unitarios y de componentes solamente

Omitir E2E reduciría el tiempo de configuración y ejecución, algo razonable para una prueba técnica pequeña.

Se descartó porque los tests en jsdom no pueden demostrar que el build estático, el fallback de rutas y la navegación funcionen dentro de un navegador. Un conjunto pequeño de tests de Playwright cubre esa brecha y funciona también como smoke test del artefacto desplegable.

## Consecuencias

- La suite completa aumenta el tiempo de CI y la cantidad de herramientas que mantener.
- Vitest y Playwright tienen responsabilidades distintas y no deben utilizarse para duplicar sistemáticamente los mismos casos.
- Los tests de componentes son rápidos, pero jsdom no valida comportamiento visual ni fidelidad de navegador.
- Playwright prueba el build real, por lo que CI debe ejecutar `npm run build` antes de E2E o trasladar explícitamente esa responsabilidad a `webServer`.
- La configuración actual de Playwright solo ejecuta Chromium. La capacidad cross browser existe, pero todavía no se utiliza.
- Los navegadores de Playwright deben instalarse y actualizarse junto con la versión del paquete.
- `fullyParallel: true` exige que los tests futuros no compartan estado mutable ni dependan del orden de ejecución.
- Los reintentos en CI deben registrarse y revisarse para no ocultar flakiness.
- Los E2E que dependen directamente de Apple pueden fallar por disponibilidad o cambios externos aunque la aplicación no haya cambiado.
- Las queries accesibles ayudan a detectar problemas semánticos, pero no sustituyen una auditoría de accesibilidad.
- La protección de `main` es una configuración del repositorio y debe exigir el workflow real de CI.

## Cuándo reconsiderar la decisión

Esta decisión debe volver a evaluarse si se cumple alguna de las siguientes condiciones:

- La suite de Vitest deja de representar correctamente la configuración o las transformaciones de Vite.
- Una capacidad imprescindible depende del ecosistema o de la infraestructura de Jest.
- jsdom produce diferencias frecuentes respecto al navegador real.
- El coste de ejecutar Playwright en CI crece de forma desproporcionada.
- Los tests E2E presentan flakiness sostenida que no se resuelve con mejor aislamiento o control de dependencias.
- El equipo necesita las capacidades de Cypress Cloud, Selenium Grid, dispositivos móviles mediante Appium u otra infraestructura no cubierta por Playwright.
- La matriz de navegadores o plataformas exige Safari real u otros entornos que los builds distribuidos por Playwright no representan.

Antes de migrar herramientas, debe comprobarse la limitación con un prototipo sobre los tests reales y comparar tiempo de ejecución, estabilidad, mantenimiento y calidad del diagnóstico.
