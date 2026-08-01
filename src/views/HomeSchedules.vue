
<template>
  <div>
    <BtnBack route="/home" />
    <div class="row q-my-xl justify-center row-tittle">
      <div class="col-12 text-center text-h5 text-weight-bold">
        REGISTRO Y PROGRAMACIÓN DE FORMACIÓN ACTUALIZADA
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
    title: "Registrar Horarios",
    route: "/schedules",
    image: "/images/horarios.jpg",
  },
  {
    title: "Registrar otros",
    route: "otherSchedule",
    image: "/images/otros_horarios3.jpg",
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
