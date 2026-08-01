<template>
  <q-card
    class="course-card shadow-2"
    :class="{ 'hover-active': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    flat
    bordered
  >
    <q-card-section class="q-pa-md">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="row items-center q-gutter-md">
            <div
              class="course-title"
              :class="{ 'text-white': isHovered }"
            >
              {{ course.prfDenominacion }}
            </div>
            <div
              class="modalidad-badge q-px-sm q-py-xs"
              :class="modalidadBadgeClass"
            >
              {{ course.modalidad }}
            </div>
          </div>
          <div class="row q-gutter-md q-mt-sm">
            <div
              class="meta-item"
              :class="{ 'text-white': isHovered }"
            >
              <q-icon name="school" size="14px" class="q-mr-xs" />{{ course.tipoFormacion }}
            </div>
            <div
              class="meta-item"
              :class="{ 'text-white': isHovered }"
            >
              <q-icon name="schedule" size="14px" class="q-mr-xs" />{{ course.prfDuracionMaxima }} horas
            </div>
            <div
              class="meta-item"
              :class="{ 'text-white': isHovered }"
            >
              <q-icon name="park" size="14px" class="q-mr-xs" />{{ course.redConocimiento }}
            </div>
          </div>
        </div>
        <q-btn
          round
          :class="isHovered ? 'bg-white text-green-9' : 'bg-green-9 text-white'"
          size="md"
          icon="arrow_forward"
          class="arrow-btn"
          @click.stop="$emit('select', course)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
})

defineEmits(['select'])

const isHovered = ref(false)

const modalidadBadgeClass = computed(() => {
  if (isHovered.value) return 'bg-green-2 text-white'
  return props.course?.modalidad === 'Presencial'
    ? 'bg-green-1 text-green-9'
    : 'bg-blue-1 text-blue-9'
})
</script>

<style scoped>
.course-card {
  border-radius: 8px;
  cursor: default;
  transition: background 0.18s ease;
  border: 1px solid #e0e0e0;
}

.course-card.hover-active {
  background-color: #66bb6a;
  border-color: #66bb6a;
}

.modalidad-badge {
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.course-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--color_card);
  line-height: 1.4;
}

.meta-item {
  font-size: 16px;
  color: #616161;
}

.arrow-btn {
  width: 40px;
  height: 40px;
}
</style>
