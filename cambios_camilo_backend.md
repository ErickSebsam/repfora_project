# Documentación de Cambios - Backend ⚙️

Este documento recopila de forma detallada todos los desarrollos, correcciones y optimizaciones realizados en la arquitectura del **Backend** para estabilizar el sistema de planeación pedagógica de **Repfora**.

---

## 1. Persistencia y Guardado Incremental (Upsert) 📥
* **Archivo afectado**: `controllers/planning.controller.js` (o equivalente en controlador de planeación).
* **Descripción del cambio**:
  * Se optimizó el método de guardado de borradores (`saveDraft`) para utilizar un modelo de actualización inteligente (**Upsert** de Mongoose).
  * En lugar de generar duplicados, el backend busca el documento de planeación utilizando la propiedad única `pedagogicalPlanning.fiche` (la ficha del programa).
  * Si ya existe un registro para esa ficha, se actualiza en su totalidad el objeto `pedagogicalPlanning`. Si no existe, se inserta un documento nuevo.
  * Se aseguró la integridad del campo `leaderEmail` para registrar de manera inmutable el correo del primer instructor que generó la planeación (instructor líder).

---

## 2. Estandarización del Esquema Mongoose 🗄️
* **Archivo afectado**: `models/Planning.js`
* **Descripción del cambio**:
  * Se sincronizó la estructura del esquema con la información y jerarquía JSON real que envía el frontend:
    * **Ficha**: `pedagogicalPlanning.fiche` (string único).
    * **Líder**: `pedagogicalPlanning.leaderEmail` (correo del instructor líder).
    * **Contenido**: Array de fases (`ANALYSIS`, `PLANNING`, `EXECUTION`, `EVALUATION`, `ETAPA_PRODUCTIVA`).
    * **Competencias**: Cada fase tiene un listado de competencias con su `code` y `name`.
    * **Resultados (RAPs)**: Cada competencia tiene resultados de aprendizaje con su `description`.
    * **Actividades**: Cada RAP cuenta con actividades pedagógicas donde se añade el objeto `suggestedInstructor` con los campos:
      * `id`: Identificador único del instructor sugerido.
      * `name`: Nombre completo del instructor sugerido.
      * `assignmentStatus`: Estado de confirmación (`'pending'` o `'confirmed'`).

---

## 3. Depuración y Saneamiento de Código Basura 🧹
* **Archivos afectados**: Raíz del proyecto.
* **Descripción del cambio**:
  * Se eliminaron scripts de diagnóstico temporal como `find_edgar.js` que se utilizaron durante el proceso de depuración en vivo para inspeccionar la estructura de MongoDB. El repositorio de producción ha quedado 100% limpio de archivos basura o de desarrollo local.

---

## 4. Corrección de Compatibilidad del Extractor (Python/Py Launcher) 🐍
* **Archivo afectado**: `controller/planning.controller.js`
* **Descripción del cambio**:
  * Se identificó un fallo (Error 500) en el proceso de extracción de PDFs debido a que el comando `python` no estaba mapeado correctamente en el PATH del servidor Windows.
  * Se actualizó la lógica de ejecución para utilizar el lanzador `py`, el cual es el estándar recomendado para Windows y garantiza que el script `extractor.py` se ejecute con la versión correcta de Python instalada en el sistema.
  * Se mejoró el registro de errores en el archivo `extract_error.log` para facilitar el diagnóstico de problemas de permisos o rutas en el futuro.
