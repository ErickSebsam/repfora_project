<template>
    <div>
      <q-page-sticky position="top-left" :offset="[20, 20]">
        <q-btn
          icon="arrow_back"
          color="green-10"
          size="12px"
          round
          :to="props.route"
        />
      </q-page-sticky>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from "vue";
  
  const props = defineProps({
    route: {
      type: String,
      default: "/home",
    },
  });
  </script>