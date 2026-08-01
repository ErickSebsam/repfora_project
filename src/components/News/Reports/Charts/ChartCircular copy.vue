<template>
    <div>
      <div class="row" style="margin-top: 40px">
        <div class="col-2"></div>
        <div class="col-8 text-center text-h4 text-weight-bold style-text">
          Estadisticas
        </div>
        <div class="col-2"></div>
      </div>
      <hr class="style-btn q-mb-xl" style="width: 83%; height: 2px" />
  
      <!-- TABLE INFO -->
      <div class="row q-mt-md justify-center">
        <div class="col-11 q-mb-lg justify-center flex">
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <DoughnutChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <BarChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <LineChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <PieChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <PolarAreaChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <RadarChart v-bind="doughnutChartProps" />
          </div>
          <div style="width: 400px">
            <div style="display: flex; justify-content: center">
              <button type="button" @click="switchLegend">
                Cambiar posición
              </button>
            </div>
            <ScatterChart v-bind="doughnutChartProps" />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, defineComponent, ref } from "vue";
  import {
    DoughnutChart,
    useDoughnutChart,
    BarChart,
    useBarChart,
    LineChart,
    useLineChart,
    PieChart,
    usePieChart,
    PolarAreaChart,
    usePolarAreaChart,
    RadarChart,
    useRadarChart,
    ScatterChart,
    useScatterChart,
    BubbleChart,
    useBubbleChart,
  } from "vue-chart-3";
  import { Chart, registerables } from "chart.js";
  
  Chart.register(...registerables);
  
  //valores de la grafica, en este caso cantidad de personas por ciudad
  const dataValues = ref([1000000, 200000, 300000, 400000, 500000]);
  //labels de la grafica, en este caso nombre de las ciudades
  const dataLabels = ref([
    "Colombia",
    "Ecuador",
    "Argentina",
    "Chile",
    "Venezuela",
  ]);
  //variable para cambiar la posicion de la leyenda
  const toggleLegend = ref(true);
  
  const testData = computed(() => ({
    labels: dataLabels.value,
    datasets: [
      {
        data: dataValues.value,
        backgroundColor: ["#77CEFF", "#0079AF", "#123E6B", "#97B0C4", "#A5C8ED"],
      },
    ],
  }));
  
  const options = computed(() => ({
    responsive: true,
    scales: {
      myScale: {
        type: "logarithmic", // "linear", "logarithmic", "category", "time", "radialLinear"
        position: toggleLegend.value ? "left" : "right", // "left", "right", "top", "bottom"
      },
    },
    plugins: {
      legend: {
        position: toggleLegend.value ? "top" : "bottom",
      },
      title: {
        display: true,
        text: "Población por país",
      },
    },
  }));
  
  const { doughnutChartProps } = useDoughnutChart({
    chartData: testData,
    options,
  });
  
  function switchLegend() {
    toggleLegend.value = !toggleLegend.value;
  }
  </script>
  
  <style scoped></style>
  