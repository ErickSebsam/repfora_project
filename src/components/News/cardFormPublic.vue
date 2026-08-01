<template>
  <q-card class="q-mt-md my-card col-12 col-sm-10 col-md-7">
    <q-card-section class="row justify-start flex">
      <div class="col-12 col-sm-10 col-md-7 q-px-md items-center flex">
        <span>{{ props.title }}</span>
      </div>
      <div class="col-12 col-sm-10 col-md-7 q-px-md items-center flex">
        <slot></slot>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
  title: String,
});
</script>