<template>
  <div class="audit-container">
    <BtnBack route="/home" />
    <HeaderLayout title="Auditoría de Resultados" />

    <!-- Info banner con última actualización -->
    <div class="row justify-center q-pt-sm q-pb-md">
      <div class="col-12 col-md-10">
        <div class="update-banner">
          <div class="row items-center q-gutter-sm">
            <div class="banner-icon">
              <span class="material-symbols-outlined">sync</span>
            </div>
            <div class="banner-text">
              <span class="update-label">Última actualización:</span>
              <span class="update-time">{{ lastUpdateText }}</span>
            </div>
            <q-btn
              flat
              dense
              round
              color="blue"
              icon="settings"
              class="settings-btn"
              @click="openConfigModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Cron Control Panel -->
    <!-- <div class="row justify-center q-mb-md">
      <div class="col-12 col-md-10">
        <div class="cron-control-panel">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center q-gutter-md">
              <div class="cron-status">
                <span
                  class="status-indicator"
                  :class="{ active: cronStatus.enabled && cronStatus.active }"
                ></span>
                <span
                  class="status-text"
                  :class="{
                    enabled: cronStatus.enabled && cronStatus.active,
                    disabled: !cronStatus.enabled || !cronStatus.active
                  }"
                >
                  {{ cronStatus.enabled && cronStatus.active ? "Cron activo" : "Cron desactivado" }}
                </span>
              </div>
              <div class="cron-schedule">
                <span class="material-symbols-outlined schedule-icon">schedule</span>
                <span>Programado: 1 AM hora Colombia (diario)</span>
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                :disable="cronStatus.enabled && cronStatus.active"
                color="green-8"
                @click="toggleCronStatus(true)"
                :loading="loadingCron"
                class="cron-btn"
              >
                <template v-slot:default>
                  <span class="material-symbols-outlined q-mr-xs">check_circle</span>
                  <span>Activar</span>
                </template>
              </q-btn>
              <q-btn
                unelevated
                :disable="!cronStatus.enabled || !cronStatus.active"
                color="red-8"
                @click="toggleCronStatus(false)"
                :loading="loadingCron"
                class="cron-btn"
              >
                <template v-slot:default>
                  <span class="material-symbols-outlined q-mr-xs">cancel</span>
                  <span>Desactivar</span>
                </template>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <!-- Tabs de navegación -->
    <div class="row justify-center q-mb-md">
      <div class="col-12 col-md-10">
        <q-tabs
          v-model="activeTab"
          dense
          class="bg-white text-grey-7 shadow-1 rounded-borders audit-tabs"
          active-color="white"
          active-bg-color="green-7"
          indicator-color="transparent"
          align="justify"
          narrow-indicator
          no-caps
          inline-label
          breakpoint="0"
        >
          <q-tab
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
            :icon="tab.icon"
            :label="tab.label"
            class="audit-tab"
          >
            <q-tooltip class="bg-green-7" v-if="$q.screen.lt.md">{{ tab.label }}</q-tooltip>
          </q-tab>
        </q-tabs>
      </div>
    </div>

    <!-- Contenido de tabs -->
    <div class="row justify-center">
      <div class="col-12 col-md-10">
        <!-- Tab: Vencidos -->
        <div v-show="activeTab === 'vencidos'" class="tab-content">
          <!-- Stats Cards -->
          <div class="stats-grid q-mb-md">
            <div class="stat-item stat-total">
              <div class="stat-marker stat-marker-blue"></div>
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-desc">Resultados Vencidos</div>
            </div>
            <div class="stat-item stat-critical">
              <div class="stat-marker stat-marker-red"></div>
              <div class="stat-number">{{ stats.critical }}</div>
              <div class="stat-desc">Críticos (+20 días)</div>
            </div>
            <div class="stat-item stat-avg">
              <div class="stat-marker stat-marker-amber"></div>
              <div class="stat-number">{{ stats.avgDays }}</div>
              <div class="stat-desc">Días Promedio</div>
            </div>
            <div class="stat-item stat-missing">
              <div class="stat-marker stat-marker-green"></div>
              <div class="stat-number">{{ stats.totalSinNota }}</div>
              <div class="stat-desc">Aprendices Sin Nota</div>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters-panel q-mb-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-select
                  v-model="selectedCoordination"
                  :options="coordinations"
                  option-value="_id"
                  option-label="name"
                  emit-value
                  map-options
                  label="Coordinación"
                  dense
                  outlined
                  clearable
                  @update:model-value="filterByCoordination"
                  class="filter-select"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6"
                      >business</span
                    >
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="searchVencidos"
                  label="Buscar ficha, resultado o instructor..."
                  dense
                  outlined
                  @update:model-value="filterResults"
                  class="filter-input"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6"
                      >search</span
                    >
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="sortVencidos"
                  :options="sortOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  label="Ordenar por"
                  dense
                  outlined
                  @update:model-value="filterResults"
                  class="filter-select"
                >
                  <template v-slot:prepend>
                    <span class="material-symbols-outlined text-grey-6"
                      >sort</span
                    >
                  </template>
                </q-select>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="loadingVencidos" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">
              Cargando datos...
            </div>
          </div>
          <div v-else-if="filteredVencidos.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon"
              >check_circle</span
            >
            <div class="empty-title">Sin resultados vencidos</div>
            <div class="empty-desc">Todo está actualizado</div>
          </div>
          <div v-else class="results-list">
            <div
              v-for="fiche in filteredVencidos"
              :key="fiche.ficheNumber"
              class="fiche-item"
            >
              <div
                class="fiche-header-bar"
                @click="toggleFiche(fiche.ficheNumber)"
              >
                <div class="row items-center full-width no-wrap">
                  <div class="fiche-marker"></div>
                  <div class="fiche-header-content">
                    <div class="fiche-number">
                      Ficha {{ fiche.ficheNumber }}
                    </div>
                    <div class="fiche-meta">
                      {{ fiche.outcomes.length }} resultado{{
                        fiche.outcomes.length !== 1 ? "s" : ""
                      }}
                      ·
                      {{ fiche.instructorName || "Sin instructor" }}
                    </div>
                  </div>
                  <span
                    class="material-symbols-outlined expand-icon"
                    :class="{ expanded: ficheExpanded[fiche.ficheNumber] }"
                  >
                    expand_more
                  </span>
                </div>
              </div>
              <div v-show="ficheExpanded[fiche.ficheNumber]" class="fiche-body">
                <div
                  v-for="(outcome, idx) in fiche.outcomes"
                  :key="idx"
                  class="outcome-item"
                  :class="getSeverityClass(outcome.daysOverdue)"
                >
                  <div
                    class="outcome-header-bar"
                    @click="toggleOutcome(fiche.ficheNumber + '-' + idx)"
                  >
                    <div class="row items-center full-width no-wrap">
                      <div
                        class="outcome-severity "
                        :class="getSeverityIndicator(outcome.daysOverdue)"
                      ></div>
                      <div class="outcome-header-content">
                        <div class="outcome-text">
                          {{ outcome.outcomeText }}
                        </div>
                        <div class="outcome-tags">
                          <span
                            class="tag"
                            :class="getDaysTagClass(outcome.daysOverdue)"
                          >
                            {{ outcome.daysOverdue }}d
                          </span>
                          <span class="tag tag-grey"
                            >{{ outcome.missingCount }} pendientes</span
                          >
                        </div>
                      </div>
                      <span
                        class="material-symbols-outlined expand-icon-sm"
                        :class="{
                          expanded:
                            outcomeExpanded[fiche.ficheNumber + '-' + idx],
                        }"
                      >
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div
                    v-show="outcomeExpanded[fiche.ficheNumber + '-' + idx]"
                    class="outcome-body col-6"
                  >
                    <div class="outcome-meta-info q-mb-sm">
                      <span class="meta-item">
                        <span class="material-symbols-outlined meta-icon"
                          >calendar_month</span
                        >
                        {{ formatDate(outcome.fend) }}
                      </span>
                      <span class="meta-item">
                        <span class="material-symbols-outlined meta-icon"
                          >person</span
                        >
                        {{ outcome.instructorName || "Sin asignar" }}
                      </span>
                      <span v-if="outcome.instructorEmail" class="meta-item">
                        <span class="material-symbols-outlined meta-icon"
                          >email</span
                        >
                        {{ outcome.instructorEmail }}
                      </span>
                    </div>
                    <div
                      v-if="outcome.isTotalMissing"
                      class="total-missing-box"
                    >
                      <span class="material-symbols-outlined warning-icon"
                        >warning</span
                      >
                      Resultado sin evaluar ·
                      {{ outcome.totalLearners }} aprendices
                    </div>
                    <div v-else class="learners-box">
                      <div class="learners-header">
                        Aprendices pendientes ({{
                          outcome.missingLearners?.length || 0
                        }})
                      </div>
                      <div class="learners-items row">
                        <div
                          v-for="learner in outcome.missingLearners"
                          :key="learner.document"
                          class="learner-row col-6"
                        >
                          <div class="learner-info">
                            <span class="learner-name">{{
                              learner.name || "Sin nombre"
                            }}</span>
                            <span class="learner-doc"
                              >{{ learner.documentType || "CC" }}
                              {{ learner.document }}</span
                            >
                          </div>
                          <q-btn
                            outline
                            dense

                            size="sm"
                            color="orange-6"
                            label="Omitir"
                            @click.stop="
                              openOmissionModal(
                                outcome.scheduleId,
                                learner.document,
                                learner.name,
                                fiche.ficheNumber,
                                outcome.outcomeText
                              )
                            "
                            class="omit-btn q-pa-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Omisiones -->
        <div v-show="activeTab === 'omisiones'" class="tab-content">
          <!-- Search -->
          <div class="filters-panel q-mb-md">
            <q-input
              v-model="searchOmissions"
              label="Buscar por ficha, documento o nombre..."
              dense
              outlined
              @update:model-value="filterOmissionsList"
              class="filter-input"
            >
              <template v-slot:prepend>
                <span class="material-symbols-outlined text-grey-6"
                  >search</span
                >
              </template>
            </q-input>
          </div>

          <!-- Omissions Results -->
          <div v-if="loadingOmissions" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">
              Cargando omisiones...
            </div>
          </div>
          <div v-else-if="filteredOmissions.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon"
              >person_remove</span
            >
            <div class="empty-title">Sin omisiones</div>
            <div class="empty-desc">No hay aprendices omitidos</div>
          </div>
          <div v-else class="results-list">
            <div
              v-for="fiche in filteredOmissions"
              :key="fiche.ficheNumber"
              class="fiche-item"
            >
              <div
                class="fiche-header-bar"
                @click="toggleFicheOmission(fiche.ficheNumber)"
              >
                <div class="row items-center full-width no-wrap">
                  <div class="fiche-marker fiche-marker-purple"></div>
                  <div class="fiche-header-content">
                    <div class="fiche-number">
                      Ficha {{ fiche.ficheNumber }}
                    </div>
                    <div class="fiche-meta">
                      {{ fiche.outcomes.length }} resultado{{
                        fiche.outcomes.length !== 1 ? "s" : ""
                      }}
                      · {{ fiche.totalOmissions }} omitido{{
                        fiche.totalOmissions !== 1 ? "s" : ""
                      }}
                    </div>
                  </div>
                  <span
                    class="material-symbols-outlined expand-icon"
                    :class="{
                      expanded: ficheOmissionExpanded[fiche.ficheNumber],
                    }"
                  >
                    expand_more
                  </span>
                </div>
              </div>
              <div
                v-show="ficheOmissionExpanded[fiche.ficheNumber]"
                class="fiche-body"
              >
                <div
                  v-for="outcome in fiche.outcomes"
                  :key="outcome.outcomeText"
                  class="omission-outcome-item"
                >
                  <div class="omission-outcome-header">
                    <span
                      class="material-symbols-outlined outcome-omission-icon"
                      >rule</span
                    >
                    <span class="omission-outcome-text">{{
                      outcome.outcomeText
                    }}</span>
                    <span class="omission-count">{{
                      outcome.omissions.length
                    }}</span>
                  </div>
                  <div class="omission-list">
                    <div
                      v-for="o in outcome.omissions"
                      :key="o.schedule + o.documentNumber"
                      class="omission-row"
                    >
                      <div class="omission-info">
                        <span class="omission-name">{{
                          o.learnerName || "Sin nombre"
                        }}</span>
                        <span class="omission-doc">{{ o.documentNumber }}</span>
                      </div>
                      <div class="omission-justification-box">
                        <div class="justification-text">
                          {{ o.justification || "Sin justificación" }}
                        </div>
                        <div class="justification-meta">
                          {{ formatDateTime(o.createdAt)
                          }}{{ o.createdBy ? ` · ${o.createdBy}` : "" }}
                        </div>
                      </div>
                      <q-btn
                        class="btn_incorporar"
                        outline
                        dense
                        size="sm"
                        color="green-7"
                        label="Incorporar"
                        @click="
                          confirmRemoveOmission(o.schedule, o.documentNumber)
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Fichas Excluidas -->
        <div v-show="activeTab === 'excluidas'" class="tab-content">
          <!-- Fichas Fallidas -->
          <div class="warning-panel q-mb-md">
            <div class="warning-panel-header">
              <span class="material-symbols-outlined warning-icon">warning</span>
              <span class="warning-title">Fichas que Fallaron al Descargar</span>
            </div>
            <div class="warning-panel-body">
              <p class="warning-desc">Estas fichas generaron errores durante la última ejecución del cron. Puedes omitirlas individualmente.</p>
              <div v-if="loadingFailedFiches" class="loading-state">
                <q-spinner color="amber-8" size="2em" />
              </div>
              <div v-else-if="failedFiches.length === 0" class="empty-state-small">
                <span class="material-symbols-outlined">check_circle</span>
                <span>No hay fichas fallidas</span>
              </div>
              <q-table
                v-else
                :rows="failedFiches"
                :columns="failedFichesColumns"
                row-key="ficheNumber"
                flat
                bordered
                dense
                class="failed-fiches-table"
              >
                <template v-slot:body-cell-action="props">
                  <q-td :props="props">
                    <q-btn
                      flat
                      dense
                      color="red-8"
                      label="Omitir"
                      size="sm"
                      @click="omitFailedFiche(props.row.ficheNumber)"
                    />
                  </q-td>
                </template>
              </q-table>
            </div>
          </div>

          <!-- Botón para excluir ficha -->
          <!-- <div class="warning-panel q-mb-md">
            <div class="warning-panel-header">
              <span class="material-symbols-outlined warning-icon">warning</span>
              <span class="warning-title">Excluir Múltiples Fichas</span>
            </div>
            <div class="warning-panel-body">
              <p class="warning-desc">Usa esta sección cuando el cron reporte fichas que fallaron. Pega los números separados por coma, espacio o salto de línea.</p>
              <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-12">
                  <q-input
                    v-model="excludeMultipleForm.fiches"
                    label="Fichas (una por línea o separadas por coma)"
                    type="textarea"
                    outlined
                    rows="4"
                    dense
                    class="form-input"
                  />
                </div>
                <div class="col-12 col-md-8">
                  <q-input
                    v-model="excludeMultipleForm.reason"
                    label="Razón para todas"
                    dense
                    outlined
                    class="form-input"
                  >
                    <template v-slot:prepend>
                      <span class="material-symbols-outlined text-grey-6">description</span>
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-btn
                    unelevated
                    color="red-8"
                    label="Excluir Todas"
                    @click="excludeMultipleFiches"
                    class="full-width"
                    dense
                  />
                </div>
              </div>
            </div>
          </div> -->

          <!-- Lista de Fichas Excluidas -->
          <div class="row q-mb-md justify-end">
            <q-btn
              unelevated
              color="red-8"
              label="Excluir Ficha"
              icon="folder_off"
              @click="showExcludeModal = true"
              no-caps
              dense
            />
          </div>
          <div v-if="loadingExcludedFiches" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">Cargando fichas excluidas...</div>
          </div>
          <div v-else-if="excludedFiches.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">folder_off</span>
            <div class="empty-title">Sin fichas excluidas</div>
            <div class="empty-desc">No hay fichas en la lista de exclusión</div>
          </div>
          <q-table
            v-else
            :rows="excludedFiches"
            :columns="excludedFichesColumns"
            row-key="ficheNumber"
            flat
            bordered
            dense
            class="excluded-fiches-table"
          >
            <template v-slot:body-cell-createdAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.createdAt) }}
              </q-td>
            </template>
            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <q-btn
                  flat
                  dense
                  color="green-8"
                  label="Incluir"
                  size="sm"
                  @click="includeFiche(props.row.ficheNumber)"
                />
              </q-td>
            </template>
          </q-table>
        </div>

        <!-- Tab: Inconsistencias -->
        <div v-show="activeTab === 'inconsistencias'" class="tab-content">
          <div class="warning-panel q-mb-md">
            <div class="warning-panel-header">
              <span class="material-symbols-outlined warning-icon">error_outline</span>
              <span class="warning-title">Resultados No Encontrados en Excel</span>
            </div>
            <div class="warning-panel-body">
              <p class="warning-desc">Estos resultados existen en la base de datos pero no se encontraron en el Excel de Sofía Plus.</p>
            </div>
          </div>

          <div v-if="loadingInconsistencies" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">Cargando inconsistencias...</div>
          </div>
          <div v-else-if="inconsistencies.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">check_circle</span>
            <div class="empty-title">Sin inconsistencias</div>
            <div class="empty-desc">No se encontraron problemas</div>
          </div>
          <div v-else class="results-list">
            <div
              v-for="fiche in inconsistencies"
              :key="fiche.ficheNumber"
              class="fiche-item"
            >
              <div class="fiche-header-bar">
                <div class="row items-center full-width no-wrap">
                  <div class="fiche-marker fiche-marker-red"></div>
                  <div class="fiche-header-content">
                    <div class="fiche-number">Ficha {{ fiche.ficheNumber }}</div>
                    <div class="fiche-meta">
                      {{ fiche.inconsistencias.length }} inconsistencia{{ fiche.inconsistencias.length !== 1 ? 's' : '' }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="fiche-body">
                <div
                  v-for="inc in fiche.inconsistencias"
                  :key="inc._id"
                  class="inconsistency-item"
                >
                  <div class="inconsistency-outcome">{{ inc.outcomeText }}</div>
                  <div class="inconsistency-details">
                    <span class="inconsistency-detail">
                      <span class="material-symbols-outlined inconsistency-icon">person</span>
                      {{ inc.instructorName || 'Sin instructor' }}
                    </span>
                    <span v-if="inc.instructorEmail" class="inconsistency-detail">
                      <span class="material-symbols-outlined inconsistency-icon">email</span>
                      {{ inc.instructorEmail }}
                    </span>
                    <span class="inconsistency-detail inconsistency-reason">
                      <span class="material-symbols-outlined inconsistency-icon">help</span>
                      {{ inc.reason || 'No encontrado en Excel' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Plantilla Email -->
        <div v-show="activeTab === 'plantilla'" class="tab-content">
          <div class="email-template-container">
            <!-- Header -->
            <div class="email-template-header">
              <div class="header-left">
                <span class="material-symbols-outlined header-icon">email</span>
                <div>
                  <h3 class="header-title">Plantilla de Correo</h3>
                  <p class="header-subtitle">Configura el correo que se enviará a los instructores</p>
                </div>
              </div>
              <div class="header-actions">
                <q-chip size="sm" color="green-1" text-color="green-8" icon="info">
                  Variable disponible: <code>{fichaNumero}</code>
                </q-chip>
              </div>
            </div>

            <!-- Editor & Preview Split View -->
            <div class="email-template-split">
              <!-- Editor Panel -->
              <div class="editor-panel">
                <div class="panel-header">
                  <span class="material-symbols-outlined panel-icon">edit</span>
                  <span class="panel-title">Editor</span>
                </div>

                <div class="editor-body">
                  <!-- Asunto -->
                  <div class="field-group">
                    <div class="field-label-row">
                      <label class="field-label">Asunto del correo</label>
                      <span class="char-count">{{ emailTemplate.subject?.length || 0 }} caracteres</span>
                    </div>
                    <q-input
                      v-model="emailTemplate.subject"
                      outlined
                      dense
                      placeholder="Ej: Resultados pendientes - Ficha {fichaNumero}"
                      class="email-subject-input"
                    >
                      <template v-slot:prepend>
                        <span class="material-symbols-outlined text-grey-6">subject</span>
                      </template>
                    </q-input>
                  </div>

                  <!-- Contenido -->
                  <div class="field-group">
                    <div class="field-label-row">
                      <label class="field-label">Contenido del correo</label>
                      <span class="char-count">{{ emailTemplate.content?.length || 0 }} caracteres</span>
                    </div>
                    <q-input
                      v-model="emailTemplate.content"
                      type="textarea"
                      outlined
                      rows="18"
                      placeholder="Escribe el contenido del correo aquí..."
                      class="email-content-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Preview Panel -->
              <div class="preview-panel">
                <div class="panel-header">
                  <span class="material-symbols-outlined panel-icon">preview</span>
                  <span class="panel-title">Vista Previa</span>
                  <q-space />
                  <q-chip size="sm" color="blue-1" text-color="blue-8">
                    Ejemplo: Ficha 1234567
                  </q-chip>
                </div>

                <div class="preview-body">
                  <!-- Email Preview Card -->
                  <div class="email-preview-card">
                    <div class="email-preview-header">
                      <div class="preview-from">
                        <span class="preview-label">De:</span>
                        <span class="preview-value">SENA Auditoría</span>
                      </div>
                      <div class="preview-to">
                        <span class="preview-label">Para:</span>
                        <span class="preview-value">instructor@sena.edu.co</span>
                      </div>
                    </div>

                    <div class="email-preview-subject">
                      <span class="material-symbols-outlined">mail</span>
                      <span class="subject-text">
                        {{ emailTemplate.subject || 'Sin asunto' }}
                      </span>
                    </div>

                    <div class="email-preview-content">
                      <div class="content-body" v-if="emailTemplate.content">
                        {{ previewContent }}
                      </div>
                      <div class="content-placeholder" v-else>
                        <span class="material-symbols-outlined">draft</span>
                        <p>El contenido del correo aparecerá aquí...</p>
                      </div>
                    </div>

                    <div class="email-preview-footer">
                      <span class="footer-note">Este es un ejemplo de cómo se verá el correo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions Footer -->
            <div class="email-template-actions">
              <div class="actions-left">
                <q-btn
                  outline
                  color="grey-7"
                  label="Restaurar valores por defecto"
                  @click="resetEmailTemplate"
                  icon="restore"
                  no-caps
                >
                  <q-tooltip>Restaurar la plantilla original</q-tooltip>
                </q-btn>
              </div>
              <div class="actions-right">
                <q-btn
                  flat
                  color="grey-6"
                  label="Cancelar"
                  @click="activeTab = 'vencidos'"
                  no-caps
                  v-close-popup
                />
                <q-btn
                  unelevated
                  color="green-7"
                  label="Guardar plantilla"
                  :loading="loadingEmailTemplate"
                  @click="saveEmailTemplate"
                  icon="save"
                  no-caps
                  class="save-btn"
                >
                  <q-tooltip v-if="!emailTemplate.subject || !emailTemplate.content">
                    Completa todos los campos
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Historial -->
        <div v-show="activeTab === 'historial'" class="tab-content">
          <div v-if="loadingHistory" class="loading-state">
            <q-spinner color="green-7" size="2.5em" />
            <div class="q-mt-sm text-grey-6 text-caption">
              Cargando historial...
            </div>
          </div>
          <div v-else-if="historyLogs.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">history</span>
            <div class="empty-title">Sin historial</div>
            <div class="empty-desc">No hay auditorías registradas</div>
          </div>
          <div v-else class="history-list">
            <div
              v-for="(log, index) in historyLogs"
              :key="log._id"
              class="history-item"
            >
           
              <div class="history-header" @click="toggleHistoryDetail(index)">
                <div class="row items-center full-width no-wrap">
                  <div class="history-marker"></div>
                  <div class="history-header-content">
                    <div class="history-date">
                      {{ formatDateTime(log.executionDate) }}
                    </div>
                    <div class="history-badges">
                      <span
                        class="history-badge"
                        :class="getHistoryBadgeClass(log.totalVencidosOutcomes)"
                      >
                        {{ log.totalFichesWithIssues || 0 }} fichas
                      </span>
                      <span
                        class="history-badge"
                        :class="getHistoryBadgeClass(log.totalVencidosOutcomes)"
                      >
                        {{ log.totalOutcomesPending || 0 }} pendientes
                      </span>
                      <span
                        v-if="log.totalVencidosOutcomes"
                        class="history-badge history-badge-danger"
                      >
                        ⚠️ {{ log.totalVencidosOutcomes }} vencidos
                      </span>
                      <span
                        v-if="log.summary?.totalMissingLearners"
                        class="history-badge"
                      >
                        {{ log.summary.totalMissingLearners }} aprendices
                      </span>
                    </div>
                  </div>
                  <span
                    class="material-symbols-outlined expand-icon"
                    :class="{ expanded: historyDetailOpen[index] }"
                  >
                    expand_more
                  </span>
                </div>
              </div>
              <div v-show="historyDetailOpen[index]" class="history-body">
                <div
                  v-if="(log.totalFichesWithIssues || 0) === 0"
                  class="history-clean"
                >
                  <span class="material-symbols-outlined check-icon"
                    >check_circle</span
                  >
                  <span>No se detectaron problemas en esta auditoría</span>
                </div>
                <div v-else>
                  <!-- Summary Cards -->
                  <div class="history-summary">
                    <div class="summary-item">
                      <div class="summary-value">
                        {{ log.totalFichesWithIssues || 0 }}
                      </div>
                      <div class="summary-label">Fichas</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value">
                        {{ log.summary?.outcomesRated || 0 }}
                      </div>
                      <div class="summary-label">Calificados</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-value summary-amber">
                        {{ log.totalOutcomesPending || 0 }}
                      </div>
                      <div class="summary-label">Pendientes</div>
                    </div>
                  </div>

                  <!-- Fiches with issues -->
                  <div
                    v-if="log.details && log.details.length > 0"
                    class="history-fiches"
                  >
                    <div class="history-section-title">
                      Fichas con problemas
                    </div>
                    <div
                      v-for="(fiche, ficheIdx) in log.details"
                      :key="ficheIdx"
                      class="history-fiche-item"
                    >
                      <div
                        class="history-fiche-header"
                        @click="toggleHistoryFiche(ficheIdx)"
                      >
                        <span class="material-symbols-outlined fiche-icon-sm"
                          >folder_open</span
                        >
                        <span>Ficha {{ fiche.ficheNumber }}</span>
                        <span class="fiche-pending"
                          >{{
                            fiche.pendingOutcomes?.length || 0
                          }}
                          pendientes</span
                        >
                        <span
                          class="material-symbols-outlined expand-icon-sm"
                          :class="{ expanded: historyFicheOpen[ficheIdx] }"
                        >
                          expand_more
                        </span>
                      </div>
                      <div
                        v-show="historyFicheOpen[ficheIdx]"
                        class="history-fiche-body"
                      >
                        <div
                          v-for="outcome in fiche.pendingOutcomes"
                          :key="outcome.scheduleId"
                          class="history-outcome-row"
                        >
                          <span class="outcome-name">{{
                            outcome.outcomeText
                          }}</span>
                          <span class="outcome-meta"
                            >{{ formatDate(outcome.fend) }} ·
                            {{ outcome.totalLearners }} aprendices</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Vencidos warning -->
                  <div
                    v-if="
                      log.vencidosOutcomes && log.vencidosOutcomes.length > 0
                    "
                    class="history-warning"
                  >
                    <div class="warning-header">
                      <span class="material-symbols-outlined warning-icon-sm"
                        >warning</span
                      >
                      {{ log.vencidosOutcomes.length }} Resultados Vencidos
                    </div>
                    <div class="warning-list">
                      <div
                        v-for="v in log.vencidosOutcomes.slice(0, 5)"
                        :key="v.scheduleId"
                        class="warning-item"
                      >
                        {{ v.instructorName || "Sin instructor" }}:
                        {{ truncateText(v.outcomeText, 35) }}... ({{
                          v.daysOverdue
                        }}d)
                      </div>
                      <div
                        v-if="log.vencidosOutcomes.length > 5"
                        class="warning-more"
                      >
                        ... y {{ log.vencidosOutcomes.length - 5 }} más
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para omitir aprendiz -->
    <q-dialog v-model="omissionModal" persistent>
      <q-card class="omission-modal">
        <q-card-section class="omission-modal-header">
          <div class="row items-center justify-center q-gutter-sm">
            <span class="material-symbols-outlined">person_remove</span>
            <span class="text-subtitle1">Omitir Aprendiz</span>
          </div>
        </q-card-section>

        <q-card-section class="omission-modal-body">
          <div class="modal-learner-info">
            <div class="modal-info-row">
              <span class="modal-info-label">Nombre:</span>
              <span class="modal-info-value">{{
                pendingOmission?.learnerName
              }}</span>
            </div>
            <div class="modal-info-row">
              <span class="modal-info-label">Documento:</span>
              <span class="modal-info-value">{{
                pendingOmission?.learnerDocument
              }}</span>
            </div>
            <div class="modal-info-row">
              <span class="modal-info-label">Ficha:</span>
              <span class="modal-info-value">{{
                pendingOmission?.ficheNumber
              }}</span>
            </div>
            <div class="modal-info-row">
              <span class="modal-info-label">Resultado:</span>
              <span class="modal-info-value"
                >{{
                  truncateText(pendingOmission?.outcomeText || "", 45)
                }}...</span
              >
            </div>
          </div>

          <q-input
            v-model="modalJustification"
            label="Justificación *"
            type="textarea"
            outlined
            rows="3"
            dense
            class="modal-input"
          />

          <q-checkbox
            v-model="omitEverywhere"
            label="Omitir en TODOS los resultados de aprendizaje"
            class="modal-checkbox"
            size="sm"
            color="green-8"
          >
            <q-tooltip>
              Si marcas esta opción, el aprendiz se omitirá en todos los
              resultados donde aparezca.
            </q-tooltip>
          </q-checkbox>
        </q-card-section>

        <q-card-actions class="omission-modal-actions" align="right">
          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            v-close-popup
            no-caps
            dense
          />
          <q-btn
            unelevated
            label="Omitir"
            color="green-8"
            :loading="loadingOmission"
            @click="confirmOmission"
            no-caps
            dense
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal de Configuración -->
    <q-dialog
      v-model="configModal"
      persistent
      :backdrop-filter="'blur(4px)'"
    >
      <q-card class="config-modal">
        <!-- Header -->
        <q-card-section class="config-modal-header">
          <div class="row items-center justify-center q-gutter-sm">
            <span class="config-modal-title">Configuración del Sistema</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="config-modal-close"
            @click="configModal = false"
          />
        </q-card-section>

        <!-- Opciones de Configuración -->
        <q-card-section class="config-modal-body">
          <div class="config-option" @click="configForm.cronEnabled = !configForm.cronEnabled">
            <div class="config-option-content">
              <div class="config-option-title">Reporte Automático</div>
              <div class="config-option-desc">Ejecutar auditoría automáticamente a la 1 AM hora Colombia (diario)</div>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: configForm.cronEnabled }"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>

          <div class="config-option" @click="configForm.emailEnabled = !configForm.emailEnabled">
            <div class="config-option-content">
              <div class="config-option-title">Envío de Correos Automáticos</div>
              <div class="config-option-desc">Enviar notificaciones por email cuando se detecten resultados vencidos</div>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: configForm.emailEnabled }"
            >
              <div class="toggle-slider"></div>
            </div>
          </div>

          <!-- <div class="config-option config-option-action" @click="runAuditNow">
            <div class="config-option-content">
              <div class="config-option-title">Ejecutar Auditoría Ahora</div>
              <div class="config-option-desc">Iniciar el proceso de auditoría manualmente</div>
            </div>
            <q-btn
              unelevated
              color="green-8"
              :loading="runningAudit"
              icon="play_arrow"
              size="sm"
              rounded
            />
          </div> -->
        </q-card-section>

        <!-- Footer -->
        <q-card-actions class="config-modal-footer" align="right">
          <q-btn
            flat
            label="Cancelar"
            class="config-btn-cancel"
            @click="closeConfigModal"
            no-caps
          />
          <q-btn
            unelevated
            label="Guardar Cambios"
            class="config-btn-save"
            :loading="loadingConfig"
            @click="saveConfigChanges"
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal para Excluir Ficha -->
    <q-dialog v-model="showExcludeModal" persistent>
      <q-card class="omission-modal" style="min-width: 500px;">
        <q-card-section class="omission-modal-header">
          <div class="row items-center justify-center q-gutter-sm">
            <span class="material-symbols-outlined">folder_off</span>
            <span class="text-subtitle1">Excluir Ficha de Auditoría</span>
          </div>
        </q-card-section>

        <q-card-section class="omission-modal-body">
          <p class="form-panel-desc q-mb-md">Las fichas excluidas no serán procesadas por el cron de auditoría.</p>

          <q-input
            v-model="excludeForm.ficheNumber"
            label="Número de Ficha"
            dense
            outlined
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined text-grey-6">tag</span>
            </template>
          </q-input>

          <q-input
            v-model="excludeForm.reason"
            label="Razón"
            dense
            outlined
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <span class="material-symbols-outlined text-grey-6">description</span>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions class="omission-modal-actions" align="right">
          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            v-close-popup
            no-caps
            dense
          />
          <q-btn
            unelevated
            label="Excluir"
            color="red-8"
            @click="excludeFiche"
            no-caps
            dense
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useQuasar } from "quasar";
import { get, post, put, del } from "../services/api.js";
import { notifySuccessRequest } from "../common/notify";
import BtnBack from "../layouts/btnBackLayout.vue";
import HeaderLayout from "../layouts/headerViewsLayout.vue";

const $q = useQuasar();

const activeTab = ref("vencidos");
const lastUpdateText = ref("Cargando...");

const tabs = [
  { name: "vencidos", label: "Resultados Vencidos", icon: "warning" },
  { name: "omisiones", label: "Aprendices Omitidos", icon: "person_remove" },
  { name: "excluidas", label: "Fichas Excluidas", icon: "folder_off" },
  { name: "inconsistencias", label: "Inconsistencias", icon: "error_outline" },
  { name: "historial", label: "Historial", icon: "history" },
  { name: "plantilla", label: "Plantilla Email", icon: "email" },
];

// Cron status
const cronStatus = ref({
  enabled: false,
  active: false
});
const loadingCron = ref(false);

// Email status
const emailStatus = ref({
  enabled: false
});
const loadingEmail = ref(false);

// Config modal
const configModal = ref(false);
const loadingConfig = ref(false);
const configForm = ref({
  cronEnabled: false,
  emailEnabled: false
});

// Load cron status
async function loadCronStatus() {
  loadingCron.value = true;
  const res = await get("/auditoria/cron/status");
  console.log(res);

  cronStatus.value = res || { enabled: false, active: false };
  loadingCron.value = false;
}

// Load email status
async function loadEmailStatus() {
  loadingEmail.value = true;
  const res = await get("/auditoria/email/status");
  console.log(res);

  emailStatus.value = res || { enabled: false };
  loadingEmail.value = false;
}

// Toggle cron status
async function toggleCronStatus(enabled) {
  loadingCron.value = true;
  await post("/auditoria/cron/toggle", { enabled });
  notifySuccessRequest(enabled ? "Cron activado correctamente" : "Cron desactivado correctamente");
  await loadCronStatus();
}

// Toggle cron from menu
async function toggleCronFromMenu() {
  const newState = !(cronStatus.value.enabled && cronStatus.value.active);
  await toggleCronStatus(newState);
}

// Toggle email from menu
async function toggleEmailFromMenu() {
  const newState = !emailStatus.value.enabled;
  loadingEmail.value = true;
  await post("/auditoria/email/toggle", { enabled: newState });
  notifySuccessRequest(newState ? "Envío de correos activado correctamente" : "Envío de correos desactivado correctamente");
  await loadEmailStatus();
}

// Config modal functions
function openConfigModal() {
  configForm.value.cronEnabled = cronStatus.value.enabled && cronStatus.value.active;
  configForm.value.emailEnabled = emailStatus.value.enabled;
  configModal.value = true;
}

function closeConfigModal() {
  configModal.value = false;
  // Reset form values
  configForm.value.cronEnabled = cronStatus.value.enabled && cronStatus.value.active;
  configForm.value.emailEnabled = emailStatus.value.enabled;
}

async function saveConfigChanges() {
  loadingConfig.value = true;

  // Toggle cron if changed
  const newCronState = configForm.value.cronEnabled;
  const currentCronState = cronStatus.value.enabled && cronStatus.value.active;
  if (newCronState !== currentCronState) {
    await post("/auditoria/cron/toggle", { enabled: newCronState });
  }

  // Toggle email if changed
  if (configForm.value.emailEnabled !== emailStatus.value.enabled) {
    await post("/auditoria/email/toggle", { enabled: configForm.value.emailEnabled });
  }

  // Reload statuses
  await loadCronStatus();
  await loadEmailStatus();

  loadingConfig.value = false;
  configModal.value = false;
}


// Expansion states
const ficheExpanded = ref({});
const outcomeExpanded = ref({});
const ficheOmissionExpanded = ref({});
const historyFicheOpen = ref({});

// Stats
const stats = ref({
  total: 0,
  critical: 0,
  avgDays: 0,
  totalSinNota: 0,
});

// Coordinations
const coordinations = ref([]);
const selectedCoordination = ref(null);

// Vencidos
const allVencidos = ref([]);
const filteredVencidos = ref([]);
const searchVencidos = ref("");
const sortVencidos = ref("daysDesc");
const sortOptions = [
  { label: "Más vencidos primero", value: "daysDesc" },
  { label: "Menos vencidos primero", value: "daysAsc" },
  { label: "Por ficha", value: "fiche" },
];

// Table columns for failed fiches
const failedFichesColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left", style: "font-weight: 500;" },
  { name: "error", label: "Error", field: "error", align: "left", style: "font-size: 12px;" },
  { name: "lastAttemptAt", label: "Último Intento", field: "lastAttemptAt", format: val => formatDateTime(val), align: "center", style: "font-size: 11px;" },
  { name: "action", label: "Acción", field: "", align: "center" },
];

// Table columns for excluded fiches
const excludedFichesColumns = [
  { name: "ficheNumber", label: "Ficha", field: "ficheNumber", align: "left", style: "font-weight: 500;" },
  { name: "reason", label: "Razón", field: row => row.reason || "Sin justificación", align: "left", style: "font-size: 12px;" },
  { name: "createdAt", label: "Fecha", field: "createdAt", align: "center", style: "font-size: 11px;" },
  { name: "action", label: "Acción", field: "", align: "center" },
];

// Omisiones
const allOmissions = ref([]);
const filteredOmissions = ref([]);
const searchOmissions = ref("");
const omissionForm = ref({
  scheduleId: "",
  learnerDocument: "",
  learnerName: "",
  ficheNumber: "",
  justification: "",
});

// History
const historyLogs = ref([]);
const historyDetailOpen = ref({});

// Loading states
const loadingVencidos = ref(false);
const loadingOmissions = ref(false);
const loadingHistory = ref(false);
const loadingOmission = ref(false);

// Failed fiches
const failedFiches = ref([]);
const loadingFailedFiches = ref(false);

// Excluded fiches
const excludedFiches = ref([]);
const loadingExcludedFiches = ref(false);
const excludeForm = ref({
  ficheNumber: "",
  reason: "",
});
const excludeMultipleForm = ref({
  fiches: "",
  reason: "Ficha no encontrada en Sofía Plus",
});

// Inconsistencies
const inconsistencies = ref([]);
const loadingInconsistencies = ref(false);

// Email template
const emailTemplate = ref({
  subject: "",
  content: "",
});
const emailTemplateDefaults = ref({
  subject: "",
  content: "",
});
const loadingEmailTemplate = ref(false);

// Running audit
const runningAudit = ref(false);

// Modal
const omissionModal = ref(false);
const pendingOmission = ref(null);
const modalJustification = ref("");
const omitEverywhere = ref(false);

// Modal para excluir ficha
const showExcludeModal = ref(false);

// Load coordinations
async function loadCoordinations() {
  const res = await get("/auditoria/coordinaciones");
  console.log(res);

  coordinations.value = res.data || [];
}

// Load vencidos
async function loadVencidos() {
  loadingVencidos.value = true;
  const res = await get("/auditoria/vencidos/agrupados");
  let data = res;
  if (data && typeof data === "object" && !Array.isArray(data) && data.data) {
    allVencidos.value = data.data || [];
    if (data.ultimaActualizacion) {
      lastUpdateText.value = `Última actualización: ${formatDateTime(
        data.ultimaActualizacion
      )}`;
    }
  } else {
    allVencidos.value = Array.isArray(data) ? data : [];
    if (res.ultimaActualizacion) {
      lastUpdateText.value = `Última actualización: ${formatDateTime(
        res.ultimaActualizacion
      )}`;
    }
  }
  calculateStats();
  filterResults();
  loadingVencidos.value = false;
}

// Calculate stats
function calculateStats() {
  if (!Array.isArray(allVencidos.value)) {
    console.warn("allVencidos.value no es un array:", allVencidos.value);
    allVencidos.value = [];
  }

  const allOutcomes = allVencidos.value.flatMap((f) => f.outcomes || []);

  stats.value.total = allOutcomes.length;
  stats.value.critical = allOutcomes.filter((d) => d.daysOverdue > 20).length;
  stats.value.avgDays =
    stats.value.total > 0
      ? Math.round(
          allOutcomes.reduce((sum, d) => sum + d.daysOverdue, 0) /
            stats.value.total
        )
      : 0;
  stats.value.totalSinNota = allOutcomes.reduce(
    (sum, d) => sum + (d.missingCount || 0),
    0
  );
}

// Filter by coordination
async function filterByCoordination() {
  if (!selectedCoordination.value) {
    await loadVencidos();
    return;
  }
  loadingVencidos.value = true;
  const res = await get(`/auditoria/vencidos/coordinacion/${selectedCoordination.value}`);
  let data = res;
  if (data && typeof data === "object" && !Array.isArray(data) && data.data) {
    allVencidos.value = data.data || [];
  } else {
    allVencidos.value = Array.isArray(data) ? data : [];
  }
  calculateStats();
  filterResults();
  loadingVencidos.value = false;
}

// Filter results
function filterResults() {
  const search = searchVencidos.value.toLowerCase();
  const sort = sortVencidos.value;

  let filtered = allVencidos.value
    .map((fiche) => ({
      ...fiche,
      outcomes: (fiche.outcomes || []).filter(
        (d) =>
          d.ficheNumber?.includes(search) ||
          d.outcomeText?.toLowerCase().includes(search) ||
          (d.instructorName || "").toLowerCase().includes(search)
      ),
    }))
    .filter((f) => f.outcomes.length > 0);

  // Sort outcomes
  filtered = filtered.map((fiche) => ({
    ...fiche,
    outcomes: [...(fiche.outcomes || [])].sort((a, b) => {
      if (sort === "daysDesc") return b.daysOverdue - a.daysOverdue;
      if (sort === "daysAsc") return a.daysOverdue - b.daysOverdue;
      return 0;
    }),
  }));

  // Sort fiches
  filtered.sort((a, b) => {
    if (sort === "fiche") return a.ficheNumber.localeCompare(b.ficheNumber);
    return b.outcomes.length - a.outcomes.length;
  });

  filteredVencidos.value = filtered;
}

// Load omissions
async function loadOmissions() {
  loadingOmissions.value = true;
  const res = await get("/auditoria/omisiones/agrupadas");
  console.log(res);

  let data = res.data;
  if (data && typeof data === "object" && !Array.isArray(data) && data.data) {
    allOmissions.value = data.data || [];
  } else {
    allOmissions.value = Array.isArray(data) ? data : [];
  }
  filterOmissionsList();
  loadingOmissions.value = false;
}

// Filter omissions
function filterOmissionsList() {
  const search = searchOmissions.value.toLowerCase();

  const reorganized = allOmissions.value.map((fiche) => {
    const outcomesGrouped = {};
    (fiche.omissions || []).forEach((o) => {
      const key = o.outcomeText || "Sin resultado";
      if (!outcomesGrouped[key]) {
        outcomesGrouped[key] = {
          outcomeText: key,
          omissions: [],
        };
      }
      outcomesGrouped[key].omissions.push(o);
    });

    return {
      ...fiche,
      outcomes: Object.values(outcomesGrouped),
      totalOmissions: fiche.omissions?.length || 0,
    };
  });

  filteredOmissions.value = reorganized
    .map((fiche) => ({
      ...fiche,
      outcomes: fiche.outcomes
        .map((outcome) => ({
          ...outcome,
          omissions: outcome.omissions.filter(
            (o) =>
              fiche.ficheNumber?.includes(search) ||
              o.documentNumber?.includes(search) ||
              (o.learnerName || "").toLowerCase().includes(search) ||
              (o.outcomeText || "").toLowerCase().includes(search)
          ),
        }))
        .filter((o) => o.omissions.length > 0),
    }))
    .filter((f) => f.outcomes.length > 0);
}

// Add omission
async function addOmission() {
  if (!omissionForm.value.scheduleId || !omissionForm.value.learnerDocument) {
    $q.notify({
      type: "negative",
      message: "Por favor complete los campos obligatorios",
      position: "top",
    });
    return;
  }
  if (!omissionForm.value.justification) {
    $q.notify({
      type: "negative",
      message: "Por favor ingrese una justificación",
      position: "top",
    });
    return;
  }

  loadingOmission.value = true;
  await post("/auditoria/omisiones", {
    ...omissionForm.value,
    outcomeText: "",
  });
  notifySuccessRequest("Aprendiz omitido correctamente");
  loadingOmission.value = false;

  omissionForm.value = {
    scheduleId: "",
    learnerDocument: "",
    learnerName: "",
    ficheNumber: "",
    justification: "",
  };

  await loadOmissions();
  await loadVencidos();
}

// Remove omission
async function confirmRemoveOmission(scheduleId, learnerDocument) {
  $q.dialog({
    title: "Confirmar",
    message: "¿Está seguro de Incorporar este aprendiz?",
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Incorporar",
      color: "green-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    await del(`/auditoria/omisiones/${scheduleId}/${learnerDocument}`);
    notifySuccessRequest("Aprendiz desomitido correctamente");
    await loadOmissions();
    await loadVencidos();
  });
}

// Open omission modal
function openOmissionModal(
  scheduleId,
  learnerDocument,
  learnerName,
  ficheNumber,
  outcomeText
) {
  pendingOmission.value = {
    scheduleId,
    learnerDocument,
    learnerName,
    ficheNumber,
    outcomeText,
  };
  modalJustification.value = "";
  omitEverywhere.value = false;
  omissionModal.value = true;
}

// Confirm omission from modal
async function confirmOmission() {
  if (!modalJustification.value.trim()) {
    $q.notify({
      type: "negative",
      message: "Por favor ingrese una justificación",
      position: "top",
    });
    return;
  }

  loadingOmission.value = true;
  await post("/auditoria/omisiones", {
    scheduleId: pendingOmission.value.scheduleId,
    learnerDocument: pendingOmission.value.learnerDocument,
    learnerName: pendingOmission.value.learnerName,
    ficheNumber: pendingOmission.value.ficheNumber,
    outcomeText: pendingOmission.value.outcomeText,
    justification: modalJustification.value,
    omitEverywhere: omitEverywhere.value,
  });
  notifySuccessRequest("Aprendiz omitido correctamente");
  loadingOmission.value = false;

  omissionModal.value = false;
  pendingOmission.value = null;

  await loadOmissions();
  await loadVencidos();
}

// Load history
async function loadHistory() {
  loadingHistory.value = true;
  const res = await get("/auditoria/historial", { limit: 50 });
  let data = res;
  if (data && typeof data === "object" && !Array.isArray(data) && data.data) {
    historyLogs.value = data.data || [];
  } else {
    historyLogs.value = Array.isArray(data) ? data : [];
  }
  loadingHistory.value = false;
}

// Toggle history detail
function toggleHistoryDetail(index) {
  historyDetailOpen.value[index] = !historyDetailOpen.value[index];
}

// Watch tab changes
watch(activeTab, async (newTab) => {
  if (newTab === "vencidos" && allVencidos.value.length === 0) {
    await loadVencidos();
  } else if (newTab === "omisiones" && allOmissions.value.length === 0) {
    await loadOmissions();
  } else if (newTab === "excluidas") {
    await loadFailedFiches();
    await loadExcludedFiches();
  } else if (newTab === "inconsistencias" && inconsistencies.value.length === 0) {
    await loadInconsistencies();
  } else if (newTab === "historial" && historyLogs.value.length === 0) {
    await loadHistory();
  } else if (newTab === "plantilla" && !emailTemplate.value.subject) {
    await loadEmailTemplate();
  }
});

// Toggle functions
function toggleFiche(ficheNumber) {
  ficheExpanded.value[ficheNumber] = !ficheExpanded.value[ficheNumber];
}

function toggleOutcome(key) {
  outcomeExpanded.value[key] = !outcomeExpanded.value[key];
}

function toggleFicheOmission(ficheNumber) {
  ficheOmissionExpanded.value[ficheNumber] =
    !ficheOmissionExpanded.value[ficheNumber];
}

function toggleHistoryFiche(index) {
  historyFicheOpen.value[index] = !historyFicheOpen.value[index];
}

// ========== FAILED FICHES ==========
async function loadFailedFiches() {
  loadingFailedFiches.value = true;
  const res = await get("/auditoria/fiches/failed");
  failedFiches.value = res.data || [];
  loadingFailedFiches.value = false;
}

async function omitFailedFiche(ficheNumber) {
  $q.dialog({
    title: "Confirmar",
    message: `¿Omitir la ficha ${ficheNumber}? Se agregará a la lista de fichas excluidas.`,
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Omitir",
      color: "red-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    await del(`/auditoria/fiches/failed/${ficheNumber}`);
    notifySuccessRequest("Ficha omitida correctamente");
    await loadFailedFiches();
    await loadExcludedFiches();
  });
}

// ========== EXCLUDED FICHES ==========
async function loadExcludedFiches() {
  loadingExcludedFiches.value = true;
  const res = await get("/auditoria/fiches/excluded");
  excludedFiches.value = res.data || [];
  loadingExcludedFiches.value = false;
}

async function excludeFiche() {
  if (!excludeForm.value.ficheNumber.trim()) {
    $q.notify({
      type: "warning",
      message: "Ingrese un número de ficha",
      position: "top",
    });
    return;
  }

  $q.dialog({
    title: "Confirmar",
    message: `¿Excluir la ficha ${excludeForm.value.ficheNumber} de la auditoría?`,
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Excluir",
      color: "red-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    await post("/auditoria/fiches/exclude", { ficheNumber: excludeForm.value.ficheNumber, reason: excludeForm.value.reason });
    notifySuccessRequest("Ficha excluida correctamente");
    excludeForm.value = { ficheNumber: "", reason: "" };
    showExcludeModal.value = false;
    await loadExcludedFiches();
  });
}

async function excludeMultipleFiches() {
  const input = excludeMultipleForm.value.fiches.trim();
  if (!input) {
    $q.notify({
      type: "warning",
      message: "Por favor ingrese al menos un número de ficha",
      position: "top",
    });
    return;
  }

  const fichas = input.split(/[,\s\n]+/).filter(f => f.trim()).map(f => f.trim());
  if (fichas.length === 0) {
    $q.notify({
      type: "warning",
      message: "No se encontraron números de ficha válidos",
      position: "top",
    });
    return;
  }

  $q.dialog({
    title: "Confirmar",
    message: `¿Excluir ${fichas.length} fichas de la auditoría?\n\n${fichas.join(", ")}`,
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Excluir Todas",
      color: "red-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    for (const ficheNumber of fichas) {
      await post("/auditoria/fiches/exclude", { ficheNumber, reason: excludeMultipleForm.value.reason });
      notifySuccessRequest("Ficha excluida correctamente");
    }
    excludeMultipleForm.value.fiches = "";
    await loadExcludedFiches();
  });
}

async function includeFiche(ficheNumber) {
  $q.dialog({
    title: "Confirmar",
    message: `¿Reincluir la ficha ${ficheNumber} en la auditoría?`,
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Reincluir",
      color: "green-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    await post("/auditoria/fiches/include", { ficheNumber });
    notifySuccessRequest("Ficha reincluida correctamente");
    await loadExcludedFiches();
  });
}

// ========== INCONSISTENCIES ==========
async function loadInconsistencies() {
  loadingInconsistencies.value = true;
  const res = await get("/auditoria/historial", { limit: 1 });
  const logs = res.data || [];
  const allInconsistencies = [];
  for (const log of logs) {
    if (log.inconsistencias && log.inconsistencias.length > 0) {
      allInconsistencies.push(...log.inconsistencias);
    }
  }
  // Group by fiche
  const grouped = {};
  allInconsistencies.forEach(inc => {
    const key = inc.ficheNumber || "Sin ficha";
    if (!grouped[key]) {
      grouped[key] = {
        ficheNumber: key,
        ficheId: inc.ficheId,
        inconsistencias: []
      };
    }
    grouped[key].inconsistencias.push(inc);
  });
  inconsistencies.value = Object.values(grouped);
  loadingInconsistencies.value = false;
}

// ========== EMAIL TEMPLATE ==========
async function loadEmailTemplate() {
  loadingEmailTemplate.value = true;
  const res = await get("/auditoria/email/template");
  emailTemplate.value = res.data || { subject: "", content: "" };
  emailTemplateDefaults.value = res.defaults || { subject: "", content: "" };
  loadingEmailTemplate.value = false;
}

async function saveEmailTemplate() {
  await put("/auditoria/email/template", emailTemplate.value);
  notifySuccessRequest("Plantilla guardada correctamente");
}

async function resetEmailTemplate() {
  $q.dialog({
    title: "Confirmar",
    message: "¿Restaurar todos los campos a los valores por defecto?",
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Restaurar",
      color: "orange-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    emailTemplate.value = { ...emailTemplateDefaults.value };
    await put("/auditoria/email/template", emailTemplate.value);
    notifySuccessRequest("Plantilla guardada correctamente");
  });
}

// Computed: Preview content with variable replaced
const previewContent = computed(() => {
  if (!emailTemplate.value.content) return '';
  return emailTemplate.value.content.replace(/\{fichaNumero\}/gi, '1234567');
});

// ========== RUN AUDIT NOW ==========
async function runAuditNow() {
  $q.dialog({
    title: "Confirmar",
    message: "¿Ejecutar la auditoría ahora? El proceso puede tardar varios minutos.",
    cancel: {
      label: "Cancelar",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Ejecutar",
      color: "green-8",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    runningAudit.value = true;
    await post("/auditoria/cron/run");
    notifySuccessRequest("Auditoría iniciada correctamente");
    runningAudit.value = false;
    await loadVencidos();
  });
}

// Utility functions
function getSeverityClass(days) {
  if (days > 20) return "outcome-critical";
  if (days >= 8) return "outcome-warning";
  return "";
}

function getSeverityIndicator(days) {
  if (days > 20) return "severity-critical";
  if (days >= 8) return "severity-warning";
  return "severity-normal";
}

function getDaysTagClass(days) {
  if (days > 20) return "tag-red";
  if (days >= 8) return "tag-amber";
  return "tag-blue";
}

function getHistoryBadgeClass(vencidos) {
  if (!vencidos) return "history-badge-grey";
  if (vencidos > 10) return "history-badge-danger";
  if (vencidos > 0) return "history-badge-warning";
  return "history-badge-success";
}

function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  return new Date(dateStr).toLocaleDateString("es-CO");
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("es-CO");
}

// Auto reload every 5 minutes
let reloadInterval;
onMounted(async () => {
  await loadCoordinations();
  await loadVencidos();
  await loadCronStatus();
  await loadEmailStatus();
  reloadInterval = setInterval(() => {
    if (activeTab.value === "vencidos") loadVencidos();
    else if (activeTab.value === "omisiones") loadOmissions();
  }, 300000);
});

onBeforeUnmount(() => {
  if (reloadInterval) clearInterval(reloadInterval);
});
</script>

<style scoped>
/* ============================================
   AUDIT VIEW - ENHANCED UI/UX STYLES
   ============================================ */

/* Container */
.audit-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding-bottom: 32px;
}

/* ============================================
   UPDATE BANNER - Enhanced Design
   ============================================ */
.update-banner {
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 4px solid #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.update-banner:hover {
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.banner-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4caf50;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
}

.banner-icon .material-symbols-outlined {
  font-size: 20px;
}

.banner-text {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.update-label {
  font-size: 13px;
  color: #78909c;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.update-time {
  font-size: 13px;
  color: #37474f;
  font-weight: 600;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 2px 10px;
  border-radius: 12px;
}

.settings-btn {
  margin-left: auto;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: #f5f5f5 !important;
  transform: rotate(45deg);
}

.settings-menu {
  min-width: 240px;
  border-radius: 12px;
  overflow: hidden;
}

.settings-item {
  padding: 10px 16px;
  transition: all 0.2s ease;
}

.settings-item:hover {
  background: #f0f4f1;
}

.settings-item .q-item__label {
  font-size: 14px;
  color: #424242;
  font-weight: 500;
}

/* ============================================
   AUDIT TABS - Modern Design
   ============================================ */
.audit-tabs {
  border: none;
  border-radius: 16px !important;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
}

.audit-tab {
  min-height: 52px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-weight: 500;
}

.audit-tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
  border-radius: 3px 3px 0 0;
  transition: width 0.3s ease;
}

.audit-tab:hover::before {
  width: 60%;
}

.audit-tab:hover {
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
}

.audit-tab.q-tab--active {
  background: linear-gradient(135deg, #4caf50 0%, #43a047 100%) !important;
  color: white !important;
}

.audit-tab.q-tab--active::before {
  width: 80%;
}

/* Responsive adjustments for tabs */
@media (max-width: 1024px) {
  .audit-tab {
    padding: 0 14px;
  }
}

@media (max-width: 700px) {
  .audit-tab {
    padding: 0 10px;
    min-height: 48px;
  }
  .audit-tab :deep(.q-tab__label) {
    font-size: 11px;
    margin-left: 4px;
  }
}

@media (max-width: 400px) {
  .audit-tab :deep(.q-tab__label) {
    display: none;
  }
  .audit-tab {
    min-width: 48px;
    padding: 0;
    min-height: 48px;
  }
  .audit-tab :deep(.q-tab__icon) {
    font-size: 24px;
  }
}

/* ============================================
   TAB CONTENT - Enhanced Animation
   ============================================ */
.tab-content {
  animation: slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   STATS GRID - Modern Card Design
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.stat-item {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
  transition: height 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-item:hover::before {
  height: 100%;
  opacity: 0.05;
}

.stat-total::before {
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
}

.stat-critical::before {
  background: linear-gradient(90deg, #d32f2f 0%, #ef5350 100%);
}

.stat-avg::before {
  background: linear-gradient(90deg, #f57c00 0%, #ff9800 100%);
}

.stat-missing::before {
  background: linear-gradient(90deg, #388e3c 0%, #66bb6a 100%);
}

.stat-marker {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  opacity: 0.12;
  transition: all 0.3s ease;
}

.stat-item:hover .stat-marker {
  opacity: 0.2;
  transform: scale(1.1);
}

.stat-marker-blue {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
}

.stat-marker-red {
  background: linear-gradient(135deg, #d32f2f 0%, #ef5350 100%);
}

.stat-marker-amber {
  background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%);
}

.stat-marker-green {
  background: linear-gradient(135deg, #388e3c 0%, #66bb6a 100%);
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 6px;
  background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
  -webkit-background-clip: text;
  background-clip: text;
  transition: transform 0.3s ease;
}

.stat-item:hover .stat-number {
  transform: scale(1.05);
}

.stat-total .stat-number {
  color: #1976d2;
}

.stat-critical .stat-number {
  color: #d32f2f;
}

.stat-avg .stat-number {
  color: #f57c00;
}

.stat-missing .stat-number {
  color: #388e3c;
}

.stat-desc {
  font-size: 12px;
  color: #78909c;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* ============================================
   FILTERS PANEL - Enhanced Design
   ============================================ */
.filters-panel {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-input :deep(.q-field__control),
.filter-select :deep(.q-field__control) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-input :deep(.q-field__control:hover),
.filter-select :deep(.q-field__control:hover) {
  border-color: #4caf50;
}

.filter-input :deep(.q-field--focused .q-field__control),
.filter-select :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

/* ============================================
   RESULTS LIST - Enhanced Design
   ============================================ */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============================================
   FICHE ITEM - Modern Card Style
   ============================================ */
.fiche-item {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fiche-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.fiche-header-bar {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.fiche-header-bar:hover {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
}

.fiche-marker {
  width: 5px;
  height: 36px;
  background: linear-gradient(180deg, #4caf50 0%, #66bb6a 100%);
  border-radius: 3px;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}

.fiche-marker-purple {
  background: linear-gradient(180deg, #7b1fa2 0%, #ab47bc 100%);
  box-shadow: 0 2px 6px rgba(123, 31, 162, 0.3);
}

.fiche-marker-red {
  background: linear-gradient(180deg, #d32f2f 0%, #ef5350 100%);
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.3);
}

.history-marker {
  width: 5px;
  height: 32px;
  background: linear-gradient(180deg, #607d8b 0%, #78909c 100%);
  border-radius: 3px;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(96, 125, 139, 0.3);
}

.fiche-header-content {
  flex: 1;
  min-width: 0;
}

.fiche-number {
  font-size: 15px;
  font-weight: 700;
  color: #263238;
  letter-spacing: 0.3px;
}

.fiche-meta {
  font-size: 12px;
  color: #78909c;
  margin-top: 3px;
  font-weight: 500;
}

.expand-icon {
  font-size: 24px;
  color: #b0bec5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon.expanded {
  transform: rotate(180deg);
  color: #4caf50;
}

.fiche-header-bar:hover .expand-icon {
  color: #78909c;
}

.expand-icon-sm {
  font-size: 20px;
  color: #b0bec5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon-sm.expanded {
  transform: rotate(180deg);
  color: #4caf50;
}

.fiche-body {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
}

/* ============================================
   OUTCOME ITEM - Enhanced Design
   ============================================ */
.outcome-item {
  background: #ffffff;
  margin: 8px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.outcome-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.outcome-item.outcome-critical {
  border-left: 4px solid #d32f2f;
  box-shadow: -4px 0 12px rgba(211, 47, 47, 0.15);
}

.outcome-item.outcome-warning {
  border-left: 4px solid #f57c00;
  box-shadow: -4px 0 12px rgba(245, 124, 0, 0.15);
}

.outcome-header-bar {
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.outcome-header-bar:hover {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
}

.outcome-severity {
  width: 5px;
  height: 24px;
  border-radius: 3px;
  margin-right: 10px;
}

.severity-critical {
  background: linear-gradient(180deg, #d32f2f 0%, #ef5350 100%);
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.3);
}

.severity-warning {
  background: linear-gradient(180deg, #f57c00 0%, #ff9800 100%);
  box-shadow: 0 2px 6px rgba(245, 124, 0, 0.3);
}

.severity-normal {
  background: linear-gradient(180deg, #1976d2 0%, #42a5f5 100%);
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
}

.outcome-header-content {
  flex: 1;
  min-width: 0;
}

.outcome-text {
  font-size: 13px;
  font-weight: 600;
  color: #37474f;
  line-height: 1.4;
}

.outcome-tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 16px;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tag-red {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #c62828;
}

.tag-amber {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
}

.tag-blue {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
}

.tag-grey {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #424242;
}

.outcome-body {
  padding: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

/* ============================================
   OUTCOME META INFO
   ============================================ */
.outcome-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #78909c;
  padding: 10px 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.meta-icon {
  font-size: 16px;
  color: #90a4ae;
}

/* ============================================
   TOTAL MISSING BOX
   ============================================ */
.total-missing-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 10px;
  font-size: 13px;
  color: #8d6e63;
  font-weight: 600;
  border: 1px solid rgba(255, 193, 7, 0.3);
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.15);
}

.warning-icon {
  font-size: 20px;
}

/* ============================================
   LEARNERS BOX
   ============================================ */
.learners-box {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.learners-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  font-size: 12px;
  font-weight: 600;
  color: #455a64;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  letter-spacing: 0.3px;
}

.learners-items {
  background: #ffffff;
}

.learner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.learner-row:hover {
  background: #fafbfc;
}

.learner-row:last-child {
  border-bottom: none;
}

.learner-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.learner-name {
  font-size: 13px;
  font-weight: 600;
  color: #37474f;
}

.learner-doc {
  font-size: 11px;
  color: #78909c;
  font-weight: 500;
}

.omit-btn {
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.omit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

/* ============================================
   OMISSION FORM PANEL
   ============================================ */
.omission-form-panel {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 14px;
  font-weight: 700;
  color: #37474f;
  letter-spacing: 0.3px;
}

.form-header-icon {
  font-size: 20px;
  color: #78909c;
}

.form-body {
  padding: 16px;
}

.form-input :deep(.q-field__control) {
  border-radius: 8px;
}

.form-submit-btn {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  transition: all 0.2s ease;
}

.form-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* ============================================
   OMISSION OUTCOME ITEM
   ============================================ */
.omission-outcome-item {
  margin: 8px;
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.omission-outcome-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
}

.outcome-omission-icon {
  font-size: 18px;
  color: #7b1fa2;
}

.omission-outcome-text {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #37474f;
}

.omission-count {
  font-size: 12px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  color: #7b1fa2;
  border-radius: 16px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(123, 31, 162, 0.2);
}

.omission-list {
  padding: 10px;
  background: #ffffff;
}

.omission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.omission-row:hover {
  background: #fafbfc;
}

.omission-row:last-child {
  border-bottom: none;
}

.omission-info {
  display: flex;
  width: 22%;
  flex-direction: column;
  gap: 3px;
}

.omission-name {
  font-size: 13px;
  font-weight: 600;
  color: #37474f;
}

.omission-doc {
  font-size: 11px;
  color: #78909c;
  font-weight: 500;
}

.btn_incorporar {
  padding: 6px 14px !important;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn_incorporar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.omission-justification-box {
  padding: 12px 14px;
  width: 68%;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.justification-text {
  font-size: 12px;
  color: #616161;
  font-weight: 500;
  line-height: 1.5;
}

.justification-meta {
  font-size: 11px;
  color: #90a4ae;
  margin-top: 4px;
  font-style: italic;
}

/* ============================================
   HISTORY LIST
   ============================================ */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.history-header {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-header:hover {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
}

.history-header-content {
  flex: 1;
}

.history-date {
  font-size: 14px;
  font-weight: 700;
  color: #263238;
  letter-spacing: 0.3px;
}

.history-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.history-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 16px;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-badge-success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
}

.history-badge-warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
}

.history-badge-danger {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #c62828;
}

.history-badge-grey {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #424242;
}

.history-body {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
}

.history-clean {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #78909c;
  font-size: 14px;
  font-weight: 500;
}

.check-icon {
  font-size: 32px;
  color: #4caf50;
}

/* ============================================
   HISTORY SUMMARY
   ============================================ */
.history-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.summary-item {
  background: #ffffff;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-value {
  font-size: 28px;
  font-weight: 800;
  color: #4caf50;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.summary-amber {
  background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.summary-label {
  font-size: 11px;
  color: #78909c;
  margin-top: 4px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ============================================
   HISTORY FICHES
   ============================================ */
.history-fiches {
  margin-top: 16px;
}

.history-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #37474f;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.history-fiche-item {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.history-fiche-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-fiche-header:hover {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
}

.fiche-icon-sm {
  font-size: 18px;
  color: #78909c;
}

.fiche-pending {
  margin-left: auto;
  font-size: 11px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
  border-radius: 12px;
  font-weight: 700;
}

.history-fiche-body {
  padding: 12px;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.history-outcome-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 6px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.outcome-name {
  font-size: 12px;
  font-weight: 600;
  color: #37474f;
}

.outcome-meta {
  font-size: 11px;
  color: #78909c;
  font-weight: 500;
}

/* ============================================
   HISTORY WARNING
   ============================================ */
.history-warning {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 10px;
  border-left: 4px solid #ffa000;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(255, 160, 0, 0.2);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #8d6e63;
}

.warning-icon-sm {
  font-size: 18px;
}

.warning-list {
  padding: 10px 14px 14px;
}

.warning-item {
  font-size: 11px;
  color: #8d6e63;
  padding: 4px 0;
  font-weight: 500;
}

.warning-more {
  font-size: 11px;
  color: #a1887f;
  font-style: italic;
  padding-top: 6px;
  font-weight: 500;
}

/* ============================================
   LOADING STATE - Enhanced Design
   ============================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* ============================================
   EMPTY STATE - Enhanced Design
   ============================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 72px;
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #455a64;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.empty-desc {
  font-size: 14px;
  color: #90a4ae;
  font-weight: 500;
}

/* ============================================
   MODAL - Enhanced Design
   ============================================ */
.omission-modal {
  border-radius: 16px;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.omission-modal-header {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  color: white;
  padding: 20px 24px;
}

.omission-modal-body {
  padding: 24px;
}

.modal-learner-info {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
  padding: 16px 18px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.modal-info-row {
  display: flex;
  font-size: 13px;
  padding: 5px 0;
}

.modal-info-label {
  color: #78909c;
  min-width: 70px;
  font-weight: 600;
}

.modal-info-value {
  color: #37474f;
  font-weight: 600;
}

.modal-input :deep(.q-field__control) {
  border-radius: 8px;
}

.modal-checkbox {
  font-size: 13px;
  font-weight: 500;
}

.omission-modal-actions {
  padding: 16px 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* ============================================
   CONFIG MODAL - Modern Design
   ============================================ */
.config-modal {
  max-width: 520px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.config-modal-header {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  color: white;
  padding: 28px 28px 28px;
  position: relative;
}

.config-modal-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.config-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.config-modal-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.config-modal-body {
  padding: 24px 28px;
  background: #ffffff;
}

.config-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-radius: 14px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.config-option:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #e0e2e5 100%);
  border-color: rgba(74, 124, 89, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.config-option:last-child {
  margin-bottom: 0;
}

.config-option-content {
  flex: 1;
  padding-right: 20px;
}

.config-option-title {
  font-size: 16px;
  font-weight: 700;
  color: #263238;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}

.config-option-desc {
  font-size: 13px;
  color: #78909c;
  font-weight: 500;
  line-height: 1.4;
}

/* ============================================
   TOGGLE SWITCH - Enhanced Design
   ============================================ */
.toggle-switch {
  width: 56px;
  height: 30px;
  background: linear-gradient(135deg, #cfd8dc 0%, #b0bec5 100%);
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.toggle-switch.active {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

.toggle-slider {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border-radius: 50%;
  position: absolute;
  top: 4px;
  left: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(26px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.config-modal-footer {
  padding: 20px 28px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  gap: 12px;
}

.config-btn-cancel {
  background: linear-gradient(135deg, #78909c 0%, #607d8b 100%);
  color: white;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.config-btn-cancel:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(120, 144, 156, 0.4);
}

.config-btn-save {
  background: linear-gradient(135deg, #4a7c59 0%, #5d8a6a 100%);
  color: white;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.config-btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 124, 89, 0.4);
}

/* ============================================
   WARNING PANEL - Enhanced Design
   ============================================ */
.warning-panel {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.4);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
}

.warning-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffecb3 0%, #ffe082 100%);
  border-bottom: 1px solid rgba(255, 193, 7, 0.3);
}

.warning-icon {
  font-size: 24px;
  color: #8d6e63;
}

.warning-title {
  font-size: 15px;
  font-weight: 700;
  color: #8d6e63;
  letter-spacing: 0.3px;
}

.warning-panel-body {
  padding: 20px;
}

.warning-desc {
  font-size: 14px;
  color: #8d6e63;
  margin: 0 0 16px 0;
  line-height: 1.5;
  font-weight: 500;
}

.empty-state-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #8d6e63;
  font-size: 14px;
  font-weight: 500;
}

.empty-state-small .material-symbols-outlined {
  font-size: 24px;
  opacity: 0.6;
}

/* ============================================
   FORM PANEL - Enhanced Design
   ============================================ */
.form-panel {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.form-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.form-panel-icon {
  font-size: 22px;
  color: #78909c;
}

.form-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #37474f;
  letter-spacing: 0.3px;
}

.form-panel-body {
  padding: 20px;
}

.form-panel-desc {
  font-size: 14px;
  color: #78909c;
  margin: 0 0 20px 0;
  line-height: 1.5;
  font-weight: 500;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #37474f;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.form-input :deep(.q-field__control) {
  border-radius: 8px;
}

.email-content-input :deep(textarea) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* ============================================
   TABLES - Enhanced Design
   ============================================ */
.failed-fiches-table,
.excluded-fiches-table {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.failed-fiches-table :deep(.q-table th),
.excluded-fiches-table :deep(.q-table th) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  font-weight: 700;
  font-size: 13px;
  color: #37474f;
  letter-spacing: 0.3px;
  padding: 12px 16px;
}

.failed-fiches-table :deep(.q-table td),
.excluded-fiches-table :deep(.q-table td) {
  font-size: 13px;
  padding: 12px 16px;
  color: #455a64;
  font-weight: 500;
}

.failed-fiches-table :deep(.q-table tr:hover td),
.excluded-fiches-table :deep(.q-table tr:hover td) {
  background: #fafbfc;
}

/* ============================================
   INCONSISTENCY ITEM - Enhanced Design
   ============================================ */
.inconsistency-item {
  background: #ffffff;
  border-radius: 10px;
  padding: 16px;
  margin: 8px;
  border-left: 4px solid #d32f2f;
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.15);
}

.inconsistency-outcome {
  font-size: 14px;
  font-weight: 600;
  color: #37474f;
  margin-bottom: 10px;
  line-height: 1.4;
}

.inconsistency-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.inconsistency-detail {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #78909c;
  font-weight: 500;
}

.inconsistency-icon {
  font-size: 16px;
  color: #90a4ae;
}

.inconsistency-reason {
  color: #d32f2f;
  font-weight: 600;
}

/* ============================================
   CONFIG OPTION ACTION
   ============================================ */
.config-option-action {
  cursor: pointer;
}

.config-option-action:hover .config-option-title {
  color: #4a7c59;
}

/* ============================================
   ACCESSIBILITY - Focus States
   ============================================ */
*:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.q-btn:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ============================================
   REDUCED MOTION
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ============================================
   EMAIL TEMPLATE COMPONENT - ENHANCED DESIGN
   ============================================ */
.email-template-container {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.email-template-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  font-size: 32px;
  color: #4caf50;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 10px;
  border-radius: 12px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #263238;
  margin: 0;
  letter-spacing: 0.3px;
}

.header-subtitle {
  font-size: 13px;
  color: #78909c;
  margin: 4px 0 0 0;
  font-weight: 500;
}

.header-actions :deep(.q-chip) {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
}

.header-actions code {
  background: rgba(76, 175, 80, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  color: #2e7d32;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* ============================================
   EMAIL TEMPLATE SPLIT VIEW
   ============================================ */
.email-template-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

@media (max-width: 1024px) {
  .email-template-split {
    grid-template-columns: 1fr;
  }
}

.editor-panel,
.preview-panel {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.panel-icon {
  font-size: 20px;
  color: #78909c;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #37474f;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* ============================================
   EDITOR PANEL
   ============================================ */
.editor-panel {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

@media (max-width: 1024px) {
  .editor-panel {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.editor-body {
  padding: 20px;
  flex: 1;
  background: #ffffff;
}

.field-group {
  margin-bottom: 20px;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #37474f;
  letter-spacing: 0.2px;
}

.char-count {
  font-size: 11px;
  color: #90a4ae;
  font-weight: 500;
  background: #f5f5f5;
  padding: 3px 10px;
  border-radius: 12px;
}

.email-subject-input :deep(.q-field__control),
.email-content-input :deep(.q-field__control) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.email-subject-input :deep(.q-field__control:hover),
.email-content-input :deep(.q-field__control:hover) {
  border-color: #4caf50;
}

.email-subject-input :deep(.q-field--focused .q-field__control),
.email-content-input :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.email-content-input :deep(textarea) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
}

/* ============================================
   PREVIEW PANEL
   ============================================ */
.preview-panel {
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
}

.preview-body {
  padding: 20px;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* Email Preview Card */
.email-preview-card {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.email-preview-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-from,
.preview-to {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.preview-label {
  font-size: 11px;
  color: #90a4ae;
  font-weight: 600;
  min-width: 35px;
  text-transform: uppercase;
}

.preview-value {
  font-size: 13px;
  color: #455a64;
  font-weight: 500;
}

.email-preview-subject {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: #fff8e1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.email-preview-subject .material-symbols-outlined {
  font-size: 18px;
  color: #8d6e63;
}

.subject-text {
  font-size: 14px;
  font-weight: 600;
  color: #37474f;
  word-break: break-word;
}

.email-preview-content {
  padding: 18px;
  min-height: 200px;
  background: #ffffff;
}

.content-body {
  font-size: 13px;
  color: #455a64;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #cfd8dc;
}

.content-placeholder .material-symbols-outlined {
  font-size: 48px;
  margin-bottom: 12px;
}

.content-placeholder p {
  font-size: 13px;
  margin: 0;
  color: #90a4ae;
  font-weight: 500;
}

.email-preview-footer {
  padding: 12px 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f4f8 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.footer-note {
  font-size: 11px;
  color: #90a4ae;
  font-style: italic;
  text-align: center;
  display: block;
}

/* ============================================
   EMAIL TEMPLATE ACTIONS
   ============================================ */
.email-template-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 12px;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 10px;
}

.save-btn {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.save-btn:hover:not([disabled]) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* ============================================
   RESPONSIVE ADJUSTMENTS FOR EMAIL TEMPLATE
   ============================================ */
@media (max-width: 768px) {
  .email-template-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .email-template-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-left,
  .actions-right {
    width: 100%;
  }

  .actions-left :deep(.q-btn),
  .actions-right :deep(.q-btn) {
    flex: 1;
  }

  .panel-header {
    flex-wrap: wrap;
  }

  .field-label-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
