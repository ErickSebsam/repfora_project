<template>
  <q-card flat bordered rounded-borders>
    <q-card-section class="q-pa-sm">

      <div class="text-subtitle2 text-green-9 text-weight-bold q-mb-sm text-uppercase">
        Filtros de Búsqueda
      </div>

      <!-- Filtros dinámicos -->
      <div v-for="filter in config" :key="filter.field" class="q-mb-md">

        <!-- Título — fijo si es modalidad, colapsable si no -->
        <div
          class="row items-center no-wrap q-mb-xs"
          :class="{ 'cursor-pointer': filter.field !== 'modalidad' }"
          @click="filter.field !== 'modalidad' && toggleSection(filter.field)"
        >
          <div class="text-caption text-green-9 text-weight-bold text-uppercase col">
            {{ filter.label }}
          </div>
          <q-icon
            v-if="filter.field !== 'modalidad'"
            :name="collapsed[filter.field] ? 'chevron_right' : 'expand_more'"
            color="green-9"
            size="18px"
          />
        </div>

        <template v-if="filter.field === 'modalidad' || !collapsed[filter.field]">

          <!-- Checkbox -->
          <div v-if="filter.type === 'checkbox'" class="q-gutter-y-xs">
            <div
              v-for="option in getUniqueOptions(filter.field)"
              :key="option"
              class="row items-center no-wrap"
            >
              <q-checkbox
                :model-value="(modelValue[filter.field] || []).includes(option)"
                @update:model-value="toggleCheckbox(filter.field, option)"
                :label="option"
                dense
                color="green-9"
                size="sm"
              />
              <q-badge
                v-if="counts[filter.field]?.[option]"
                color="green-2"
                text-color="green-9"
                :label="counts[filter.field][option]"
                class="q-ml-xs"
              />
            </div>
          </div>

          <!-- Rango de horas -->
          <div v-else-if="filter.type === 'hours-range'">
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model.number="hoursMin"
                type="number"
                label="Mín (h)"
                dense
                outlined
                color="green-9"
                class="col"
              />
              <q-input
                v-model.number="hoursMax"
                type="number"
                label="Máx (h)"
                dense
                outlined
                color="green-9"
                class="col"
              />
              <q-btn
                @click="applyHours(filter)"
                icon="arrow_forward"
                color="green-9"
                dense
                round
                size="sm"
                unelevated
              />
            </div>
          </div>

        </template>

        <q-separator color="green-3" class="q-mt-sm" />
      </div>

      <!-- Limpiar -->
      <q-btn
        @click="clearFilters"
        label="Limpiar filtros"
        color="green-9"
        outline
        dense
        class="full-width q-mt-xs"
        size="sm"
      />

    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const hoursMin = ref(0)
const hoursMax = ref(2200)

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  config:     { type: Array,  required: true },
  courses:    { type: Array,  required: true },
  counts:     { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const collapsed = ref(
  Object.fromEntries(props.config.map(f => [f.field, f.field !== 'modalidad']))
)

function toggleSection(field) {
  collapsed.value = { ...collapsed.value, [field]: !collapsed.value[field] }
}

function getUniqueOptions(field) {
  return [...new Set(props.courses.map(c => c[field]).filter(Boolean))].sort()
}

function applyHours(filter) {
  emit('update:modelValue', {
    ...props.modelValue,
    [filter.field + 'Min']: hoursMin.value,
    [filter.field + 'Max']: hoursMax.value
  })
}

function toggleCheckbox(field, value) {
  const current = props.modelValue[field] || []
  const updated = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value]
  emit('update:modelValue', { ...props.modelValue, [field]: updated })
}

function clearFilters() {
  const cleared = {}
  props.config.forEach(f => {
    if (f.type === 'checkbox') cleared[f.field] = []
    else if (f.type === 'hours-range') {
      cleared[f.field + 'Min'] = f.min
      cleared[f.field + 'Max'] = f.max
    }
  })
  emit('update:modelValue', cleared)
}
</script>

