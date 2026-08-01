<template>
  <q-form ref="formRef" @submit.prevent="enviarFormulario" novalidate>

    <!-- Fecha y hora de registro -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6">
        <q-input v-model="formData.fechaRegistro" type="date" outlined readonly
          bg-color="grey-3" color="green-9" label="Fecha de registro">
          <template v-slot:prepend><q-icon name="today" /></template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6">
        <q-input v-model="formData.horaRegistro" type="time" outlined readonly
          bg-color="grey-3" color="green-9" label="Hora de registro">
          <template v-slot:prepend><q-icon name="access_time" /></template>
        </q-input>
      </div>
    </div>

    <!-- ═══ SECCIÓN 1: DATOS DEL PROGRAMA ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('datosPrograma')">
        <q-icon name="description" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Datos del programa
        </div>
        <q-icon :name="collapsed.datosPrograma ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.datosPrograma" class="q-pa-md">

        <!-- Tipo de programa, aprendices, población -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-select v-model="formData.tipoPrograma"
              :options="OPCIONES_TIPO_PROGRAMA"
              outlined color="green-9" label="Tipo de programa"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="category" /></template>
            </q-select>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model.number="formData.numAprendices" type="number" outlined
              color="green-9" label="N° de aprendices" :min="1"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="groups" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-select v-model="formData.tipoPoblacion"
              :options="OPCIONES_TIPO_POBLACION"
              outlined color="green-9" label="Tipo de población atendida"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="diversity_3" /></template>
            </q-select>
          </div>
        </div>

        <!-- Proyecto asociado -->
        <div class="q-mt-sm">
          <q-input v-model="formData.proyectoAsociado" outlined
            color="green-9" label="Proyecto asociado"
            :disable="props.loading">
            <template v-slot:prepend><q-icon name="folder_special" /></template>
          </q-input>
        </div>

        <!-- Curso confirmado -->
        <q-input v-if="formData.prfCodigo"
          :model-value="props.cursoConfirmado?.prfDenominacion || formData.prfCodigo"
          outlined readonly bg-color="grey-3" color="green-9"
          label="Curso confirmado" class="q-mt-sm">
          <template v-slot:prepend>
            <q-icon name="menu_book" />
          </template>
          <template v-slot:append>
            <q-btn unelevated round icon="close" color="red-6" size="sm"
              @click="limpiarCursoConfirmado">
              <q-tooltip>Cambiar curso</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <!-- Banner: sin curso seleccionado -->
        <div v-if="!formData.prfCodigo" class="q-mt-sm">
          <q-banner dense rounded class="bg-green-1 text-green-9">
            <template v-slot:avatar>
              <q-icon name="info" color="green-9" />
            </template>
            Ve al <strong>Catálogo</strong>, abre el curso que necesitas y haz clic en
            <strong>Confirmar curso</strong> para continuar el registro.
          </q-banner>
        </div>

        <!-- Datos precargados del curso (readonly) -->
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.prfCodigo" outlined readonly
              bg-color="grey-3" color="green-9" label="Código del curso">
              <template v-slot:prepend><q-icon name="tag" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.prfVersion" outlined readonly
              bg-color="grey-3" color="green-9" label="Versión">
              <template v-slot:prepend><q-icon name="numbers" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.prfDuracionMaxima" outlined readonly
              bg-color="grey-3" color="green-9" label="Duración en horas">
              <template v-slot:prepend><q-icon name="schedule" /></template>
            </q-input>
          </div>
        </div>

      </div>
    </q-card>

    <!-- ═══ SECCIÓN 2: DATOS DEL INSTRUCTOR ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('instructor')">
        <q-icon name="person" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Datos del instructor
        </div>
        <q-icon :name="collapsed.instructor ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.instructor" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.nombreInstructor" outlined readonly
              bg-color="grey-3" color="green-9" label="Nombre instructor(a)">
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.cedulaInstructor" outlined readonly
              bg-color="grey-3" color="green-9" label="Cédula instructor(a)">
              <template v-slot:prepend><q-icon name="badge" /></template>
            </q-input>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.telefonoInstructor" outlined readonly
              bg-color="grey-3" color="green-9" label="Teléfono instructor(a)">
              <template v-slot:prepend><q-icon name="call" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.correoInstructor" outlined readonly
              bg-color="grey-3" color="green-9" label="Correo institucional">
              <template v-slot:prepend><q-icon name="mail" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.correoPersonalInstructor" outlined readonly
              bg-color="grey-3" color="green-9" label="Correo personal">
              <template v-slot:prepend><q-icon name="alternate_email" /></template>
            </q-input>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 3: UBICACIÓN ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('ubicacion')">
        <q-icon name="location_on" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Ubicación
        </div>
        <q-icon :name="collapsed.ubicacion ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.ubicacion" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.municipio" outlined
              color="green-9" label="Municipio de ejecución"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="location_on" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.vereda" outlined
              color="green-9" label="Vereda / Corregimiento"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="nature" /></template>
            </q-input>
          </div>
        </div>
        <div class="q-mt-sm">
          <q-input v-model="formData.direccion" outlined
            color="green-9" label="Dirección donde se impartirá el curso"
            :disable="props.loading">
            <template v-slot:prepend><q-icon name="home" /></template>
          </q-input>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 4: DATOS DE LA EMPRESA (condicional) ═══ -->
    <q-card v-if="mostrarCamposEmpresa" flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('empresa')">
        <q-icon name="business" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Datos de la empresa
        </div>
        <q-icon :name="collapsed.empresa ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.empresa" class="q-pa-md">
        <div class="q-mb-sm">
          <q-input v-model="formData.nombreEmpresa" outlined
            color="green-9" label="Nombre de la empresa"
            :disable="props.loading">
            <template v-slot:prepend><q-icon name="business" /></template>
          </q-input>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.nitEmpresa" outlined
              color="green-9" label="NIT"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="badge" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.contactoEmpresa" outlined
              color="green-9" label="Nombre contacto empresa"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="person" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.telefonoEmpresa" outlined
              color="green-9" label="Teléfono de contacto"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="call" /></template>
            </q-input>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 5: FECHAS DEL PROGRAMA ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('fechas')">
        <q-icon name="event" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Fechas del programa
        </div>
        <q-icon :name="collapsed.fechas ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.fechas" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.fechaInicio" type="date" outlined
              color="green-9" label="Fecha de inicio"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="event" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.fechaFin" type="date" outlined
              color="green-9" label="Fecha de finalización"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="event" /></template>
            </q-input>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.fechaInscripcion" type="date" outlined
              color="green-9" label="Fecha de inscripción"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="assignment_turned_in" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.inicioMatricula" type="date" outlined
              color="green-9" label="Inicio de matrícula"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="how_to_reg" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-model="formData.finMatricula" type="date" outlined
              color="green-9" label="Fin de matrícula"
              :disable="props.loading">
              <template v-slot:prepend><q-icon name="how_to_reg" /></template>
            </q-input>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 6: PROGRAMACIÓN DE SESIONES ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('sesiones')">
        <q-icon name="calendar_month" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Programación de la ficha
        </div>
        <q-icon :name="collapsed.sesiones ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.sesiones" class="q-pa-md">

        <!-- Toolbar del calendario -->
        <div class="row items-center q-mb-md q-gutter-sm">
          <q-btn outline color="green-9" icon="add" label="Agregar sesión"
            :disable="props.loading" @click="abrirDialogSesion(null)" />
          <q-btn outline color="green-9" icon="event_repeat" label="Programación general"
            :disable="props.loading" @click="dialogProgGeneral = true" />
          <q-space />
          <q-badge color="green-9" class="q-px-md q-py-xs" style="font-size: 14px">
            {{ sesiones.length }} sesiones programadas
          </q-badge>
        </div>

        <!-- Calendario -->
        <div class="calendar-wrapper">
          <FullCalendar
            ref="calendarRef"
            class="text-uppercase"
            :options="calendarOptions"
          >
            <template v-slot:eventContent="arg">
              <div class="event-content">
                <div class="text-weight-bold" style="font-size: 12px">
                  {{ arg.event.title }}
                </div>
                <div style="font-size: 10px" class="text-grey-7">
                  {{ arg.event.extendedProps.horaInicio }} – {{ arg.event.extendedProps.horaFin }}
                </div>
              </div>
            </template>
          </FullCalendar>
        </div>

        <!-- Totalizadores -->
        <div class="row justify-end q-mt-md q-gutter-x-lg text-weight-bold">
          <div class="text-green-9">
            Total horas programadas: <span class="text-black">{{ totalHorasProgramadas }}</span>
          </div>
          <div :class="faltanHoras > 0 ? 'text-orange-9' : 'text-green-9'">
            Faltan horas: <span class="text-black">{{ faltanHoras }}</span>
          </div>
          <div class="text-grey-7">horas</div>
        </div>

      </div>

      <!-- ═══ DIALOG: Agregar / Editar sesión ═══ -->
      <q-dialog v-model="dialogSesion" persistent>
        <q-card style="width: 420px; max-width: 90vw">
          <q-card-section class="bg-green-9 q-px-lg q-py-sm">
            <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
              {{ editandoSesion !== null ? 'EDITAR SESIÓN' : 'NUEVA SESIÓN' }}
            </h5>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <q-input v-model="sesionForm.fecha" type="date" outlined
              color="green-9" label="Fecha *"
              :disable="props.loading"
              :rules="[(val) => (val && val.length > 0) || 'La fecha es obligatoria']"
              lazy-rules>
              <template v-slot:prepend><q-icon name="event" /></template>
            </q-input>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input v-model="sesionForm.horaInicio" type="time" outlined
                  color="green-9" label="Hora inicio *"
                  :disable="props.loading"
                  :rules="[(val) => (val && val.length > 0) || 'Requerido']"
                  lazy-rules>
                  <template v-slot:prepend><q-icon name="schedule" /></template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input v-model="sesionForm.horaFin" type="time" outlined
                  color="green-9" label="Hora fin *"
                  :disable="props.loading"
                  :rules="[
                    (val) => (val && val.length > 0) || 'Requerido',
                    (val) => !sesionForm.horaInicio || val > sesionForm.horaInicio || 'Debe ser posterior al inicio'
                  ]"
                  lazy-rules>
                  <template v-slot:prepend><q-icon name="schedule" /></template>
                </q-input>
              </div>
            </div>

            <div class="text-center q-mt-md text-subtitle1 text-green-9 text-weight-bold">
              Total: {{ calcularHoras(sesionForm.horaInicio, sesionForm.horaFin) }} horas
            </div>
          </q-card-section>

          <q-card-actions align="center" class="q-pb-lg">
            <q-btn label="CANCELAR" flat color="grey-7" v-close-popup
              :disable="props.loading" />
            <q-btn label="GUARDAR" class="save_as q-mx-sm"
              :disable="props.loading" @click="guardarSesion" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- ═══ DIALOG: Programación general ═══ -->
      <q-dialog v-model="dialogProgGeneral" persistent>
        <q-card style="width: 520px; max-width: 95vw">
          <q-card-section class="bg-green-9 q-px-lg q-py-sm">
            <h5 class="q-mt-sm q-mb-sm text-white text-center text-weight-bold">
              PROGRAMACIÓN GENERAL
            </h5>
          </q-card-section>

          <q-card-section class="q-pa-lg q-pb-sm">

            <!-- Rango de fechas -->
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="progForm.fechaDesde" type="date" outlined
                  color="green-9" label="Desde *">
                  <template v-slot:prepend><q-icon name="event" /></template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input v-model="progForm.fechaHasta" type="date" outlined
                  color="green-9" label="Hasta *">
                  <template v-slot:prepend><q-icon name="event" /></template>
                </q-input>
              </div>
            </div>

            <!-- Días de la semana -->
            <div class="q-mt-md">
              <div class="text-caption text-grey-7 q-mb-sm">Días de la semana *</div>
              <div class="row q-gutter-sm justify-center">
                <q-btn
                  v-for="dia in DIAS_SEMANA" :key="dia.val"
                  :label="dia.label"
                  :color="progForm.dias.includes(dia.val) ? 'green-9' : 'grey-4'"
                  :text-color="progForm.dias.includes(dia.val) ? 'white' : 'grey-8'"
                  size="sm"
                  unelevated
                  @click="toggleDia(dia.val)"
                />
              </div>
            </div>

            <!-- Horario -->
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input v-model="progForm.horaInicio" type="time" outlined
                  color="green-9" label="Hora inicio *">
                  <template v-slot:prepend><q-icon name="schedule" /></template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input v-model="progForm.horaFin" type="time" outlined
                  color="green-9" label="Hora fin *">
                  <template v-slot:prepend><q-icon name="schedule" /></template>
                </q-input>
              </div>
            </div>

            <!-- Preview horas por sesión -->
            <div v-if="progForm.horaInicio && progForm.horaFin"
              class="text-center q-mt-sm text-caption text-green-9">
              {{ calcularHoras(progForm.horaInicio, progForm.horaFin) }} horas por sesión
              <span v-if="progForm.fechaDesde && progForm.fechaHasta && progForm.dias.length">
                · {{ sesionesAGenerar }} sesiones a crear
              </span>
            </div>

          </q-card-section>

          <q-card-actions align="center" class="q-pb-lg">
            <q-btn label="CANCELAR" flat color="grey-7" @click="cerrarProgGeneral" />
            <q-btn label="GENERAR SESIONES" class="save_as q-mx-sm"
              icon="event_repeat"
              :disable="!progFormValido"
              @click="generarSesiones" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>

    <!-- ═══ SECCIÓN 7: FORMACIÓN ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('formacion')">
        <q-icon name="school" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Formación
        </div>
        <q-icon :name="collapsed.formacion ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.formacion" class="q-pa-md">
        <div class="q-mb-sm">
          <q-input v-model="formData.competencias" type="textarea" outlined
            color="green-9" label="Competencias"
            :disable="props.loading" autogrow>
            <template v-slot:prepend><q-icon name="verified" /></template>
          </q-input>
        </div>
        <div class="q-mt-sm">
          <q-input v-model="formData.resultadosAprendizaje" type="textarea" outlined
            color="green-9" label="Resultados de aprendizaje"
            :disable="props.loading" autogrow>
            <template v-slot:prepend><q-icon name="checklist_rtl" /></template>
          </q-input>
        </div>
        <div class="q-mt-sm">
          <q-input v-model="formData.actividadAprendizaje" type="textarea" outlined
            color="green-9" label="Actividad de aprendizaje"
            :disable="props.loading" autogrow>
            <template v-slot:prepend><q-icon name="edit_note" /></template>
          </q-input>
        </div>
        <div class="q-mt-sm">
          <q-input v-model="formData.recursosNecesarios" type="textarea" outlined
            color="green-9" label="Recursos necesarios"
            :disable="props.loading" autogrow>
            <template v-slot:prepend><q-icon name="inventory" /></template>
          </q-input>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 8: REQUISITOS DE INGRESO ═══ -->
    <q-card v-if="requisitosLista.length" flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('requisitos')">
        <q-icon name="checklist" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Requisitos de ingreso
        </div>
        <q-badge color="green-9" :label="requisitosLista.length" class="q-mr-sm" />
        <q-icon :name="collapsed.requisitos ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.requisitos" class="q-pa-md">
        <div class="row q-col-gutter-sm">
          <div v-for="(req, i) in requisitosLista" :key="i" class="col-12 col-sm-6">
            <div class="req-chip">
              <q-icon name="check_circle" color="green-7" size="18px" class="q-mr-sm flex-shrink-0" />
              <span>{{ req }}</span>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ SECCIÓN 9: AMBIENTE Y DOCUMENTOS ═══ -->

    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('ambiente')">
        <q-icon name="meeting_room" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Ambiente y documentos
        </div>
        <q-icon :name="collapsed.ambiente ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.ambiente" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-select v-model="formData.ambienteFormacion"
              :options="props.environments"
              outlined color="green-9" label="Ambiente de formación"
              :disable="props.loading || props.environments.length === 0"
              :hint="props.environments.length === 0 ? 'Sin ambientes disponibles' : ''"
              emit-value map-options>
              <template v-slot:prepend><q-icon name="meeting_room" /></template>
            </q-select>
          </div>
          <div class="col-12 col-sm-6">
            <q-file v-model="formData.documentoFormacion"
              outlined color="green-9" label="Documento de formación"
              :disable="props.loading"
              accept=".pdf,.doc,.docx,.xls,.xlsx">
              <template v-slot:prepend><q-icon name="attach_file" /></template>
              <template v-slot:append v-if="formData.documentoFormacion">
                <q-icon name="close" class="cursor-pointer" @click.stop="formData.documentoFormacion = null" />
              </template>
            </q-file>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ FIRMAS ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('firmas')">
        <q-icon name="draw" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Firmas
        </div>
        <q-icon :name="collapsed.firmas ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.firmas" class="q-pa-md">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 q-mb-sm text-center">
              Firma del Coordinador Académico
            </div>
            <div class="firma-area"></div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 q-mb-sm text-center">
              Firma del Instructor
            </div>
            <div class="firma-area"></div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ SOFÍA PLUS ═══ -->
    <q-card flat bordered class="q-mb-md section-card">
      <div class="section-header row items-center q-px-md q-py-sm cursor-pointer"
        @click="toggleSection('sofia')">
        <q-icon name="database" color="green-9" size="20px" class="q-mr-sm" />
        <div class="text-green-9 text-weight-bold text-uppercase col" style="font-size: 18px">
          Sofía Plus
        </div>
        <q-icon :name="collapsed.sofia ? 'chevron_right' : 'expand_more'"
          color="green-9" size="20px" />
      </div>

      <q-separator color="green-3" />

      <div v-show="!collapsed.sofia" class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.codigoSolicitud" outlined readonly
              bg-color="grey-3" color="green-9" label="Código solicitud"
              placeholder="Generado al guardar">
              <template v-slot:prepend><q-icon name="qr_code" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="formData.fichaCaracterizacion" outlined readonly
              bg-color="grey-3" color="green-9" label="Ficha de caracterización"
              placeholder="Generado al guardar">
              <template v-slot:prepend><q-icon name="description" /></template>
            </q-input>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ═══ NOTA LEGAL ═══ -->
    <div class="text-caption text-grey-6 q-px-md q-mb-md">
      La firma de este formato refleja que se han validado los requisitos de idoneidad del instructor
      según el diseño curricular y la información del usuario según guía procedimiento de ingreso
      GFPI-G-025 (núm. 7.5)
    </div>

    <!-- ═══ BOTONES DE ACCIÓN ═══ -->
    <div class="row q-col-gutter-md q-mt-md q-mb-lg">
      <div class="col-12 col-sm-6">
        <q-btn
          label="PREVISUALIZAR PDF"
          icon="picture_as_pdf"
          outline
          color="green-9"
          class="full-width"
          :disable="props.loading"
          size="md"
          @click="previsualizarPdf"
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-btn
          label="GUARDAR SOLICITUD"
          icon="save"
          type="submit"
          class="save_as full-width"
          :loading="props.loading"
          :disable="props.loading"
          size="md"
        >
          <template v-slot:loading>
            <q-spinner-oval color="white" size="1em" />
          </template>
        </q-btn>
      </div>
    </div>

  </q-form>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import FullCalendar    from "@fullcalendar/vue3"
import dayGridPlugin   from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale        from "@fullcalendar/core/locales/es"
import { generateSolicitudPdf } from "../../utils/generateSolicitudPdf.js"
import { useQuasar } from "quasar"

const $q = useQuasar()

const props = defineProps({
  loading:        { type: Boolean, default: false },
  courses:        { type: Array,   default: () => [] },
  environments:   { type: Array,   default: () => [] },
  prefill:        { type: Object,  default: () => ({}) },
  cursoConfirmado: { type: Object, default: null },
})


function limpiarCursoConfirmado() {
  $q.dialog({
    title: "Cambiar curso",
    message: "¿Está seguro de cambiar el curso? Se limpiarán los datos del curso y las sesiones programadas.",
    cancel: { label: "No, mantener", flat: true, color: "grey-7" },
    ok: { label: "Sí, cambiar", color: "green-9" },
    persistent: true,
  }).onOk(() => {
    formData.value.catalogCourse     = ""
    formData.value.prfCodigo         = ""
    formData.value.prfVersion        = ""
    formData.value.prfDuracionMaxima = null
    formData.value.requisitosIngreso = ""
    sesiones.value = []
    emit("cursoCambiado", null)
  })
}

const emit = defineEmits(["submit", "cursoCambiado"])

// ─── Constantes ────────────────────────────────────────────────────────────────
const OPCIONES_TIPO_PROGRAMA = [
  "ATENCIÓN A INSTITUCIONES",
  "FORMACIÓN ESPECIAL MIPYMES-PND",
  "CAMPSENA",
  "CAMPSENA - AULA MÓVIL",
  "CAMPSENA RADIAL",
  "PROGRAMA DE BILINGÜISMO",
  "FULL POPULAR",
  "FULL POPULAR - AULA MÓVIL",
  "POSCONFLICTO",
  "AULA MÓVIL",
  "INPEC",
]

const OPCIONES_TIPO_POBLACION = [
  "Empresa",
  "Demanda social",
  "Emprendedores",
  "Convenio Universidad",
  "Remitidos por el CIE",
  "Apoyo a otros Centros",
  "Microempresarios",
]

// ─── Estado ────────────────────────────────────────────────────────────────────
const formRef = ref(null)

const formData = ref({
  // Registro
  fechaRegistro:          "",
  horaRegistro:           "",

  // Sección 1 — Datos del programa
  catalogCourse:          "",
  prfCodigo:              "",
  prfVersion:             "",
  prfDuracionMaxima:      null,
  tipoPrograma:           "",
  numAprendices:          null,
  tipoPoblacion:          "",
  proyectoAsociado:       "",

  // Sección 2 — Instructor (readonly, del prefill/JWT)
  nombreInstructor:       "",
  cedulaInstructor:       "",
  telefonoInstructor:     "",
  correoInstructor:       "",
  correoPersonalInstructor: "",

  // Sección 3 — Ubicación
  municipio:              "",
  vereda:                 "",
  direccion:              "",

  // Sección 4 — Empresa (condicional)
  nombreEmpresa:          "",
  nitEmpresa:             "",
  contactoEmpresa:        "",
  telefonoEmpresa:        "",

  // Sección 5 — Fechas
  fechaInicio:            "",
  fechaFin:               "",
  fechaInscripcion:       "",
  inicioMatricula:        "",
  finMatricula:           "",

  // Sección 7 — Formación
  competencias:           "",
  resultadosAprendizaje:  "",
  actividadAprendizaje:   "",
  requisitosIngreso:      "",
  recursosNecesarios:     "",

  // Sección 8 — Ambiente y documentos
  ambienteFormacion:      "",
  documentoFormacion:     null,

  // Sofía Plus
  codigoSolicitud:        "",
  fichaCaracterizacion:   "",
})

// ─── Secciones colapsables ─────────────────────────────────────────────────────
const collapsed = ref({
  datosPrograma: false,
  instructor:    false,
  ubicacion:     false,
  empresa:       false,
  fechas:        false,
  sesiones:      false,
  formacion:     false,
  requisitos:    false,
  ambiente:      false,
  firmas:        false,
  sofia:         true,
})

function toggleSection(section) {
  collapsed.value[section] = !collapsed.value[section]
}

function precargarCurso(courseId) {
  const course = props.courses.find(c => c._id === courseId)
  if (!course) return

  formData.value.prfCodigo         = course.prfCodigo  || ""
  formData.value.prfVersion        = course.prfVersion  || ""
  formData.value.prfDuracionMaxima = course.prfDuracionMaxima || null
  formData.value.requisitosIngreso = course.prfDescripcionRequisito || ""

  sesiones.value = []
}

// ─── Requisitos (split del texto del curso) ───────────────────────────────────
const requisitosLista = computed(() => {
  const text = formData.value.requisitosIngreso
  if (!text) return []
  return text.split(/[\n\t]+/).map(r => r.trim()).filter(r => r.length > 0)
})

// ─── Campos condicionales ──────────────────────────────────────────────────────
const mostrarCamposEmpresa = computed(() =>
  formData.value.tipoPoblacion === "Empresa"
)

watch(mostrarCamposEmpresa, (visible) => {
  if (!visible) {
    formData.value.nombreEmpresa   = ""
    formData.value.nitEmpresa      = ""
    formData.value.contactoEmpresa = ""
    formData.value.telefonoEmpresa = ""
  }
})

// ─── FullCalendar ─────────────────────────────────────────────────────────────
const calendarRef = ref(null)
const sesiones    = ref([])

// ─── Curso confirmado desde catálogo ──────────────────────────────────────────
watch(() => props.cursoConfirmado, (course) => {
  if (!course) return
  formData.value.catalogCourse     = course._id || ""
  formData.value.prfCodigo         = course.prfCodigo || ""
  formData.value.prfVersion        = course.prfVersion || ""
  formData.value.prfDuracionMaxima = course.prfDuracionMaxima || null
  formData.value.requisitosIngreso = course.prfDescripcionRequisito || ""
  sesiones.value = []
}, { immediate: true })

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: esLocale,
  initialView: "dayGridMonth",
  selectable: true,
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "",
  },
  events: eventosCalendario.value,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  aspectRatio: 2.5,
}))

const eventosCalendario = computed(() =>
  sesiones.value.map((s, i) => ({
    id: String(i),
    title: `${s.totalHoras}h`,
    start: s.fecha,
    backgroundColor: "#2e7d32",
    borderColor: "#1b5e20",
    textColor: "#ffffff",
    extendedProps: {
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      totalHoras: s.totalHoras,
    },
  }))
)

function handleDateClick(info) {
  sesionForm.value = { fecha: info.dateStr, horaInicio: "", horaFin: "" }
  editandoSesion.value = null
  dialogSesion.value = true
}

function handleEventClick(info) {
  if (props.loading) return
  const index = parseInt(info.event.id)
  if (isNaN(index) || index >= sesiones.value.length) return

  const s = sesiones.value[index]
  sesionForm.value = { fecha: s.fecha, horaInicio: s.horaInicio, horaFin: s.horaFin }
  editandoSesion.value = index
  dialogSesion.value = true
}

// ─── Programación general ─────────────────────────────────────────────────────
const DIAS_SEMANA = [
  { val: 1, label: "Lun" },
  { val: 2, label: "Mar" },
  { val: 3, label: "Mié" },
  { val: 4, label: "Jue" },
  { val: 5, label: "Vie" },
  { val: 6, label: "Sáb" },
  { val: 0, label: "Dom" },
]

const dialogProgGeneral = ref(false)
const progForm = ref({ fechaDesde: "", fechaHasta: "", dias: [], horaInicio: "", horaFin: "" })

function toggleDia(val) {
  const idx = progForm.value.dias.indexOf(val)
  if (idx === -1) progForm.value.dias.push(val)
  else progForm.value.dias.splice(idx, 1)
}

const sesionesAGenerar = computed(() => {
  const { fechaDesde, fechaHasta, dias } = progForm.value
  if (!fechaDesde || !fechaHasta || !dias.length) return 0
  let count = 0
  const cur = new Date(fechaDesde + "T00:00:00")
  const fin = new Date(fechaHasta + "T00:00:00")
  while (cur <= fin) {
    if (dias.includes(cur.getDay())) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
})

const progFormValido = computed(() => {
  const { fechaDesde, fechaHasta, dias, horaInicio, horaFin } = progForm.value
  return fechaDesde && fechaHasta && fechaHasta >= fechaDesde &&
    dias.length > 0 && horaInicio && horaFin && horaFin > horaInicio
})

function generarSesiones() {
  if (!progFormValido.value) return
  const { fechaDesde, fechaHasta, dias, horaInicio, horaFin } = progForm.value
  const totalHoras = calcularHoras(horaInicio, horaFin)
  const cur = new Date(fechaDesde + "T00:00:00")
  const fin = new Date(fechaHasta + "T00:00:00")
  while (cur <= fin) {
    if (dias.includes(cur.getDay())) {
      const fecha = cur.toISOString().slice(0, 10)
      const yaExiste = sesiones.value.some(s => s.fecha === fecha && s.horaInicio === horaInicio && s.horaFin === horaFin)
      if (!yaExiste) {
        sesiones.value.push({ fecha, horaInicio, horaFin, totalHoras })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  sesiones.value.sort((a, b) => a.fecha.localeCompare(b.fecha))
  cerrarProgGeneral()
}

function cerrarProgGeneral() {
  dialogProgGeneral.value = false
  progForm.value = { fechaDesde: "", fechaHasta: "", dias: [], horaInicio: "", horaFin: "" }
}

// ─── Dialog de sesión ─────────────────────────────────────────────────────────
const dialogSesion   = ref(false)
const editandoSesion = ref(null)
const sesionForm     = ref({ fecha: "", horaInicio: "", horaFin: "" })

function abrirDialogSesion(evento) {
  if (evento) {
    sesionForm.value  = { fecha: evento.fecha, horaInicio: evento.horaInicio, horaFin: evento.horaFin }
    editandoSesion.value = evento.index
  } else {
    sesionForm.value  = { fecha: "", horaInicio: "", horaFin: "" }
    editandoSesion.value = null
  }
  dialogSesion.value = true
}

function calcularHoras(hInicio, hFin) {
  if (!hInicio || !hFin) return 0
  const [h1, m1] = hInicio.split(":").map(Number)
  const [h2, m2] = hFin.split(":").map(Number)
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1)
  return mins > 0 ? parseFloat((mins / 60).toFixed(2)) : 0
}

function guardarSesion() {
  const f = sesionForm.value
  if (!f.fecha || !f.horaInicio || !f.horaFin) return
  if (f.horaFin <= f.horaInicio) return

  const total = calcularHoras(f.horaInicio, f.horaFin)
  const data  = { fecha: f.fecha, horaInicio: f.horaInicio, horaFin: f.horaFin, totalHoras: total }

  if (editandoSesion.value !== null) {
    sesiones.value[editandoSesion.value] = data
  } else {
    sesiones.value.push(data)
    sesiones.value.sort((a, b) => a.fecha.localeCompare(b.fecha))
  }

  dialogSesion.value   = false
  sesionForm.value     = { fecha: "", horaInicio: "", horaFin: "" }
  editandoSesion.value = null
}

// ─── Totalizadores ─────────────────────────────────────────────────────────────
const totalHorasProgramadas = computed(() =>
  sesiones.value.reduce((sum, s) => sum + (s.totalHoras || 0), 0)
)

const faltanHoras = computed(() =>
  (formData.value.prfDuracionMaxima || 0) - totalHorasProgramadas.value
)

// ─── Previsualizar PDF ────────────────────────────────────────────────────────
async function previsualizarPdf() {
  const data = {
    ...formData.value,
    sesiones: [...sesiones.value],
    cursoDenominacion: props.cursoConfirmado?.prfDenominacion || "",
  }
  await generateSolicitudPdf(data)
}

// ─── Enviar ────────────────────────────────────────────────────────────────────
function enviarFormulario() {
  formData.value.sesiones = [...sesiones.value]
  emit("submit", { ...formData.value })
}

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  const now = new Date()
  formData.value.fechaRegistro = now.toISOString().slice(0, 10)
  formData.value.horaRegistro  = now.toTimeString().slice(0, 5)

  if (props.prefill.correoInstructor)   formData.value.correoInstructor   = props.prefill.correoInstructor
  if (props.prefill.cedulaInstructor)   formData.value.cedulaInstructor   = props.prefill.cedulaInstructor
  if (props.prefill.nombreInstructor)   formData.value.nombreInstructor   = props.prefill.nombreInstructor
  if (props.prefill.telefonoInstructor) formData.value.telefonoInstructor = props.prefill.telefonoInstructor
  if (props.prefill.correoPersonalInstructor) formData.value.correoPersonalInstructor = props.prefill.correoPersonalInstructor
})
</script>

<style scoped>
.section-card {
  border-radius: 8px;
}
.section-header {
  background-color: #e8f5e9;
  transition: background 0.2s;
}
.section-header:hover {
  background-color: #c8e6c9;
}
.firma-area {
  height: 100px;
  border: 2px dashed #bdbdbd;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.save_as {
  font-size: 18px;
  background-color: var(--color_button);
  color: var(--color_text_button);
}
.calendar-wrapper {
  width: 100%;
  min-height: 500px;
}
.event-content {
  padding: 2px 4px;
  cursor: pointer;
}
.req-chip {
  display: flex;
  align-items: flex-start;
  background-color: #f1f8e9;
  border: 1px solid #c5e1a5;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  color: #212121;
  line-height: 1.4;
}
</style>
