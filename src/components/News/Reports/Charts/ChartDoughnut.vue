<template>
  <DoughnutChart v-bind="doughnutChartProps" />
</template>
  
  <script setup>
import { computed, defineProps, ref } from "vue";
import { DoughnutChart, useDoughnutChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";
const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
});

Chart.register(...registerables);

let colors = ref([
  "#0069c0",
  "#97B0C4",
  "#0cb7f2",
  "#131c46",
  "#A5C8ED",
  "#ff9a3e",
  "#20f26f",
]);

const dataChart = computed(() => ({
  labels: props.chartData.map((item) => item.tpnew),
  datasets: [
    {
      data: props.chartData,
      backgroundColor: colors.value,
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  scales: {
    myScale: {
      type: "logarithmic", // "linear", "logarithmic", "category", "time", "radialLinear"
      position: "left", // "left", "right", "top", "bottom"
    },
  },
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: `Novedades ${props.form.fstart} - ${props.form.fend}`,
    },
    tooltip: {
      enabled: false,
      position: "nearest",
      external: externalTooltipHandler,
    },
  },
  parsing: {
    key: "count",
  },
}));

const { doughnutChartProps } = useDoughnutChart({
  chartData: dataChart,
  options,
});

const getOrCreateTooltip = (chart) => {
  let tooltipEl = chart.canvas.parentNode.querySelector("div");

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.style.background = "rgba(0, 0, 0, 0.7)";
    tooltipEl.style.borderRadius = "3px";
    tooltipEl.style.color = "white";
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = "none";
    tooltipEl.style.position = "absolute";
    tooltipEl.style.transform = "translate(-50%, 0)";
    tooltipEl.style.transition = "all .1s ease";

    const table = document.createElement("table");
    table.style.margin = "0px";

    tooltipEl.appendChild(table);
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const externalTooltipHandler = (context) => {
  // Tooltip Element
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  console.log(tooltip.dataPoints);
  const dataIndex = tooltip.dataPoints[0].dataIndex;
  const title = tooltip.dataPoints[0].label;
  let body = tooltip.dataPoints[0].dataset.data;
  delete body._chartjs;
  delete body.push;
  delete body.pop;
  delete body.shift;
  delete body.splice;
  delete body.unshift;
  body = body[dataIndex];

  const footer = tooltip.dataPoints[0].formattedValue;

  // Set Text
  if (tooltip.body) {
    const tableHead = document.createElement("thead");
    const tableBody = document.createElement("tbody");
    const colors = tooltip.labelColors[0];

    const html = `
  <tr 

  style=
  "background-color: inherit;
  border-width: 0;
  padding:0px;
  margin:0px;
  ">
      <td
      class="row justify-around"
      style="
      border-width: 0;
      font-size: 15px;
      "
      >
      <div class="col-2 ">
        <span
        style="
        height: 12px;
        width: 12px;
        display: inline-block;
        margin-right: 8px;
        border-width: 2px;
        border-color: ${colors.borderColor};
        background: ${colors.backgroundColor};
        "
        ></span>
        </div>
   
        <span
        class="col-7  flex"
        >
        ${title}
        </span>
     
  
      </td>
  </tr>
  <tr 

  style=
  "background-color: inherit;
  border-width: 0;
  padding:0px;
  margin:0px;
  ">
      <td
      class="rowd"
      style="
      border-width: 0;
      font-size: 12px;
      "
      >
      <div class="col-12 flex row justify-end">
        <div class="col-12 flex"
        style="font-size:10px;
        "
        >
          POR ESTADO: 
     
          </div>

         ${body.news
           .map(
             (item) => `
           <span class="col-10 flex"
           style="font-size:11px;
           padding:0px;
           ;"
           >
            ${item.state}: ${item.count}
            
            </span>`
           )
           .join("")}
      
        </div>

        <div class="col-12 flex row justify-end">
        <div class="col-12 flex"
        style="font-size:10px;
        "
        >
          POR COORDINACIÓN: 
     
          </div>

         ${body.coordinations
           .map(
             (item) => `
           <span class="col-10 flex"
           style="font-size:11px;
           padding:0px;
           ;"
           >
            ${item.name}: ${item.count}
            
            </span>`
           )
           .join("")}
      
        </div>

      </td>
  </tr>
  <tr 

style=
"background-color: inherit;
border-width: 0;
padding:0px;
margin:0px;
">
    <td
    class="row justify-around"
    style="
    border-width: 0;
    font-size: 15px;
    "
    >
    <div class="col-12 text-center q-pt-md"
    style="
    font-size:15px;
    font-width:bold;
    "
    >
     TOTAL : ${footer} 
    </td>
</tr>
    `;
    tableBody.innerHTML = html;

    const tableRoot = tooltipEl.querySelector("table");

    // Remove old children
    while (tableRoot.firstChild) {
      tableRoot.firstChild.remove();
    }

    // Add new children
    tableRoot.appendChild(tableHead);
    tableRoot.appendChild(tableBody);
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = positionX + tooltip.caretX + "px";
  tooltipEl.style.top = positionY + "0" + "px";
  tooltipEl.style.font = tooltip.options.bodyFont.string;
  tooltipEl.style.padding =
    tooltip.options.padding + "px " + tooltip.options.padding + "px";
};
</script>
  
  <style >

</style>
  