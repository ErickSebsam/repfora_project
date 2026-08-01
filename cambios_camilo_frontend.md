# Documentación de Cambios - Frontend 💻

Este documento recopila de forma detallada todos los desarrollos, correcciones y optimizaciones realizados en la arquitectura del **Frontend** para garantizar el flujo de roles, la seguridad de visualización, la correcta modularización y el funcionamiento del calendario interactivo.

---

## 1. Corrección del Estado de Sesión en Pinia 🔑
* **Archivos afectados**: 
  * `src/store/planning.store.js`
  * `src/views/ExtractView.vue`
* **Descripción del cambio**:
  * **Problema raíz**: El archivo de arranque `src/main.js` define que la tienda del usuario de Pinia (`storeUser`) se guarde en `sessionStorage`. El código anterior intentaba consultar las credenciales mediante `localStorage.getItem('storeUser')`, retornando siempre `null` y rompiendo el flujo de instructores.
  * **Solución**: Se eliminaron todas las consultas directas al `localStorage`. Ahora se importa e instancía directamente el almacén de Pinia (`storeUser`) de manera 100% nativa y reactiva. Esto resolvió de raíz la detección del token activo para cualquier usuario logueado en la plataforma.

---

## 2. Reglas Globales de Negocio y Filtrado por Rol 🛡️
* **Archivo afectado**: `src/store/planning.store.js` (Getters: `filteredCompetencies` y `phaseCounts`)
* **Descripción del cambio**:
  * **Lógica del Instructor Líder**: El usuario que genera por primera vez la planeación de una ficha queda registrado como líder en la base de datos (`leaderEmail`). El líder tiene acceso total para ver, programar y estructurar todas las competencias de la planeación en su panel.
  * **Lógica del Instructor Sugerido**: Cualquier instructor que sea sugerido para dictar un resultado de aprendizaje de la ficha **verá única y exclusivamente las competencias y resultados específicos para los que fue asignado**. No podrá ver ni modificar el trabajo de los demás instructores.

---

## 3. Validación de Confirmación del Programador (`assignmentStatus`) 👥
* **Archivo afectado**: `src/store/planning.store.js`
* **Descripción del cambio**:
  * Se implementó un filtro estricto de seguridad basado en el estado de aprobación:
    * Cuando un instructor es sugerido, su estado inicial es `"pending"`.
    * En estado `"pending"`, la planeación **no le aparecerá en su panel ni tendrá acceso a ver los resultados**.
    * Una vez que el **Programador** ingresa desde su rol y **confirma** la asignación, el estado cambia a `"confirmed"`.
    * El sistema detecta inmediatamente este cambio en tiempo real y **desbloquea** de manera segura la planeación en el dashboard del instructor para que empiece a llenarla.

---

## 4. Reorganización de Archivos y Arquitectura Limpia 📦
* **Archivos afectados**: 
  * `src/components/PlanningCalendar/ScheduleCalendar.vue` (Nuevo archivo)
  * `src/views/PlanningView.vue`
  * `src/components/ScheduleCalendar.vue` (Eliminado)
* **Descripción del cambio**:
  * Se creó una carpeta dedicada llamada `/components/PlanningCalendar/` para alojar todo lo relacionado con el nuevo calendario de planeación pedagógica de manera organizada y modular.
  * Se trasladó el componente `ScheduleCalendar.vue` a esta subcarpeta y se actualizaron con total precisión sus importaciones internas (`../../utils/dateUtils` y `../../store/planning.store`) ajustando la profundidad de directorios para evitar fallos de compilación en Vite.
  * Se modificó el archivo `PlanningView.vue` para enlazar el calendario desde su nueva ubicación física.

---

## 5. Funcionamiento del Calendario Interactivo (`ScheduleCalendar.vue`) 📅

El sistema de agendamiento horario de Repfora ha sido completamente **componetizado** para asegurar que el código sea altamente escalable, desacoplado y mantenible.

### 5.1. Arquitectura y Componentización (Mantenibilidad)
* **Aislamiento de Lógica**: Toda la lógica matemática, visual e interactiva de las fechas de clase se encapsula en `ScheduleCalendar.vue`. Esto previene la sobrecarga de código ("Fat Views") en `PlanningView.vue`, permitiendo que la vista principal solo gestione la carga de datos del backend y deje el agendamiento gráfico al componente especializado.
* **Interfaz Limpia (Props y Emits)**:
  * **Props**:
    * `initialHours`: Horas directas e indirectas preexistentes de la actividad para cargar el estado del formulario.
    * `initialShift`: Jornada preseleccionada (`'diurna'` o `'nocturna'`).
    * `activityLabel`: Título descriptivo de la actividad.
    * `currentActivity`: La instancia de la actividad en edición (para excluir de manera segura sus propias horas agendadas y permitir la reprogramación sobre sus mismos días).
  * **Emits**:
    * `close`: Notifica a la vista principal el cierre del modal de calendario sin guardar cambios.
    * `confirm`: Envía de vuelta el array completo de sesiones programadas, jornada, horas asignadas y días de la semana seleccionados para ser integrados reactivamente en el borrador de la planeación.

### 5.2. Lógica de Agendamiento y Distribución de Horas
* **Cálculo de Carga Diaria**: El componente lee la jornada y asume las horas/día hábiles correspondientes (`getHoursPerDay`). Ej: Diurna equivale a 6 horas diarias de sesión, Nocturna a 5 horas.
* **Algoritmo de Generación Automática (`generateSessions`)**:
  * El componente observa reactivamente los cambios en la **Fecha de Inicio** (`startDate`), **Jornada** (`shift`), **Días de Clase** (`selectedDays`) y **Horas Directas** (`localHours.direct`).
  * Avanza día a día en un bucle cronológico:
    1. Comprueba si el día evaluado pertenece a los días seleccionados de clase.
    2. Valida contra la base de datos de festivos nacionales de Colombia (utilizando utilidades locales). Si es festivo, se marca la sesión como festiva (`festivo: true`) y no se descuentan horas del acumulado, permitiendo saltarse ese día laboral de forma automática.
    3. Compara contra `occupiedDates` (fechas ya programadas de otras actividades de la planeación) para evitar colisiones horarias de clases.
    4. Distribuye progresivamente las horas directas restantes en bloques correspondientes a las horas por día de la jornada.
    5. Agrega de manera ordenada cada día hábil a la cola de sesiones y finaliza una vez agotadas las horas requeridas.

### 5.3. Interactividad del Grid del Calendario Mensual Inline
* **Navegación Intuitiva**: El usuario puede avanzar o retroceder mes a mes de manera instantánea a través del encabezado gráfico (`prevMonth` / `nextMonth`).
* **Sincronización Automática**: El calendario se ajusta automáticamente al mes y año correspondientes a la fecha de inicio seleccionada por el usuario.
* **Agendamiento Manual / Deselección Interactiva (`handleDayClick`)**:
  * **Añadir Sesión**: Si el usuario pulsa en un día libre habilitado, el componente calcula cuántas horas de la actividad quedan pendientes por programar y crea una nueva sesión en ese día de forma manual.
  * **Eliminar Sesión**: Si pulsa sobre una sesión ya asignada para esta actividad, la sesión se remueve instantáneamente de la lista, recalculando y liberando las horas para ser asignadas en otro día del mes.
  * **Control de Excesos**: El componente impide la programación de horas de clase excedentes a lo configurado, lanzando alertas dinámicas y amigables mediante el plugin `Notify` de Quasar para guiar paso a paso al usuario en su interacción.

### 5.4. Diseño y Estados Visuales de Celda (CSS Premium)
El grid del calendario cuenta con estados semánticos altamente estilizados mediante clases dinámicas de CSS:
* `.programmed-day`: Celda de color verde brillante premium para representar visualmente que la sesión actual está programada y pertenece a la actividad que se edita.
* `.holiday-day`: Celda rosada/roja con tooltip explicativo para indicar un día festivo no laborable.
* `.occupied-day`: Celda con sombreado de advertencia y etiqueta `🚫 Ocupado` para bloquear la interacción sobre días agendados en otras actividades de la ficha.
* `.inactive-day`: Celda gris tenue que representa días del mes anterior o posterior dentro del grid de 42 celdas mensuales.
* `.clickable-day`: Celda disponible con sutiles microanimaciones y efectos de hover al pasar el cursor.

---

## 6. Depuración del Panel de Control (Planning Dashboard) 🚀
* **Archivo afectado**: `src/views/PlanningDashboard.vue`
* **Descripción del cambio**:
  * **Simplificación de Interfaz**: Se eliminaron las tarjetas de **Reportes** y **Horarios** para el rol de **Programador**, centrando la experiencia de usuario únicamente en las funciones críticas de "Nueva Planeación" y "Programador".
  * **Optimización Visual**: Se ajustó la rejilla (grid) de Quasar para que las tarjetas restantes se muestren con un tamaño de `col-md-5` y queden perfectamente centradas, mejorando la estética y el equilibrio visual del dashboard principal.
