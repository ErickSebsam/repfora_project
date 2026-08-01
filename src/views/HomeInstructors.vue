
<template>
    <div>
      <BtnBack route="/consultor" />
      <div class="row q-my-xl justify-center row-tittle">
        <div class="col-12 text-center text-h5 text-weight-bold">
          NOVEDADES Y REPORTES
        </div>
      </div>
  
      <div class="row justify-center my-row">
        <div
          class="col-8 col-sm-4 col-md-3 q-mx-xl q-my-xl flex"
          v-for="(card, index) in cards"
          :key="index"
        >
          <Card :title="card.title" :route="card.route" :image="card.image" />
        </div>
      </div>
    </div>
  </template>
  <script setup>
  import { ref } from "vue";
  import BtnBack from "../layouts/btnBackLayout.vue";
  import Card from "../layouts/Card.vue";
  
  const cards = ref([

    {
      title: "Novedades",
      route: "/new/instructor",
      image: "/images/horarios.jpg",
    },
    {
      title: "Consultar Programación",
      route: "/tipoConsulta/instructor",
      image: "/images/otros_horarios3.jpg",
    },
    {
      title: "Complementarias",
      route: "/complementarias",
      image: "/images/Sena.png",// TODO: Reemplazar con imagen definitiva
    },
    {
      title: "Planeación",
      route: "/complementarias?redirect=planning",
      image: "/images/calendar.png",
    },
  ]);
  </script>
  
  <style scoped>
  .card_style {
    background-color: var(--color_card) !important;
    color: var(--color_text_card);
  }
  
  .img-card {
    display: flex;
    width: 50% !important;
    max-width: 50% !important;
    border: 0;
  }
  
  .button_style {
    background-color: var(--color_button);
    color: var(--color_text_button);
  }
  
  .my-row {
    margin-top: 50px;
  }
  .row-tittle {
    margin-top: 50px;
  }
  </style>
  