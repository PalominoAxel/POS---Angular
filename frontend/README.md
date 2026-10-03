# Frontend

Este proyecto se generó utilizando [Angular CLI](https://github.com/angular/angular-cli) versión 22.2.1.

## Servidor de desarrollo

Para iniciar un servidor de desarrollo local, ejecuta:

```bash
ng serve
```

Una vez que el servidor esté en marcha, abre tu navegador y dirígete a `http://localhost:4200/`. La aplicación se recargará automáticamente cada vez que modifiques alguno de los archivos fuente.

## Generación de código (scaffolding)

Angular CLI incluye potentes herramientas para la generación de código. Para generar un nuevo componente, ejecuta:

```bash
ng generate component component-name
```

Para obtener una lista completa de los esquemas disponibles (como `components`, `directives` o `pipes`), ejecuta:

```bash
ng generate --help
```

## Construcción del proyecto

Para construir el proyecto, ejecuta:

```bash
ng build
```

Esto compilará tu proyecto y almacenará los artefactos de la compilación en el directorio `dist/`. Por defecto, la compilación para producción optimiza la aplicación en cuanto a rendimiento y velocidad.

## Ejecución de pruebas unitarias

Para ejecutar pruebas unitarias con el motor de pruebas [Vitest](https://vitest.dev/), utiliza el siguiente comando:

```bash
ng test
```

## Ejecución de pruebas de extremo a extremo (end-to-end)

Para realizar pruebas de extremo a extremo (e2e), ejecuta:

```bash
ng e2e
```

Angular CLI no incluye un framework de pruebas de extremo a extremo por defecto. Puedes elegir el que mejor se adapte a tus necesidades.

## Recursos adicionales

Para obtener más información sobre el uso de Angular CLI, incluidas referencias detalladas de los comandos, visita la página [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).