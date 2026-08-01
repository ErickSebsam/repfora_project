<template>
  <div>
    <div class="row" style="margin-top: 20px">
      <div class="col-2"></div>
      <div class="col-8 text-center text-h4 text-weight-bold style-text">
        {{ props.title }}
      </div>
      <div class="col-2"></div>
    </div>
    <hr class="bg-green-9 q-mb-lg" style="width: 83%; height: 2px" />
  </div>
</template>
  
  <script setup>
import { defineProps } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Título",
  },
});
</script>