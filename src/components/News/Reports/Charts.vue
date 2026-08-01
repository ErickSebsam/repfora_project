<template>
  <div class="col-12 row">
    <div class="col-12 justify-end flex items-center">
      <q-btn
        icon="visibility"
        label="CAMBIAR VISTA"
        type="button"
        class="text-white bg-green-9"
        @click="handleChart = !handleChart"
      />
    </div>
    <div class="col-12" v-if="handleChart">
      <DoughnutChart :chartData="props.dataReport.circularBasic" :form="props.form"/>
    </div>
    <div class="col-12" v-else>
      <LinearChart :chartData="props.dataReport.linearBasic" :form="props.form" />
    </div>
  </div>
</template>
<script setup>
import { ref, defineProps } from "vue";
import DoughnutChart from "./Charts/ChartDoughnut.vue";
import LinearChart from "./Charts/LinearChart.vue";

const props = defineProps({
  dataReport: {
    type: Object,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
});

let handleChart = ref(false);
</script>