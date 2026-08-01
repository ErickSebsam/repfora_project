<template>
  <div>
    <div class="row q-my-xl justify-center">
      <div class="col-8 text-center text-h5 text-weight-bold">
        REGISTRO Y PROGRAMACIÓN DE FORMACIÓN ACTUALIZADA
      </div>
    </div>

    <!-- Formaq 1 -->
    <div
      class="row justify-center"
      :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-md'"
    >
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="col-10 col-sm-6 col-md-4 col-lg-3 q-my-lg flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <Card
          :title="card.title"
          :image="card.image"
          :route="card.route"
          :roles="card.roles"
        />
      </div>
    </div>

    <div class="row justify-center">
      <div
        class="col-10 col-sm-6 col-md-4 col-lg-3 q-my-lg flex"
        :class="$q.screen.width < 500 ? 'q-px-none' : 'q-px-lg'"
      >
        <Card
          v-if="userStore.getSuper() === 1"
          title="Bitácora"
          image="/images/binnacle.png"
          route="/binnacle"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { storeUser } from "../store/users.js";
import { useQuasar } from "quasar";

import Card from "../layouts/Card.vue";

const $q = useQuasar();
const userStore = storeUser();
let show = ref(false);

const cards = ref([
  {
    title: "Instructores",
    route: "/instructors",
    image: "/images/instructor.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Programas",
    route: "/programs",
    image: "/images/programas.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Competencias",
    route: "/competences",
    image: "/images/competencia.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Ambientes",
    route: "/environments",
    image: "/images/ambiente.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Resultados",
    route: "/results",
    image: "/images/resultado.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Fichas",
    route: "/files",
    image: "/images/ficha.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Horarios",
    route: "/planning-schedules",
    image: "/images/calendar.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Reportes",
    route: "/reports",
    image: "/images/reports2.jpg",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Carga masiva",
    route: "/bulkload",
    image: "/images/cargamasiva.jpg",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Juicios evaluativos",
    route: "/judgment",
    image: "/images/judgment.png",
    roles: ["PROGRAMADOR", "COORDINADOR", "EVALUADOR","NOVEDADES"],
    super: false,
  },
  {
    title: "Novedades",
    route: "/news",
    image: "/images/news.jpg",
    roles: ["PROGRAMADOR", "COORDINADOR", "NOVEDADES"],
    super: false,
  },
  {
    title: "Auditoria Juicios",
    route: "/audit",
    image: "/images/audit.jpg",
    roles: ["PROGRAMADOR", "COORDINADOR", "NOVEDADES"],
    super: false,
  },
  {
    title: "Usuarios",
    route: "/users",
    image: "/images/users4.jpg",
    roles: ["COORDINADOR"],
    super: false,
  },
  {
    title: "Planeación",
    route: "/complementarias?redirect=planning",
    image: "/images/calendar.png",
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  {
    title: "Coordinación",
    route: "/coordination",
    image: "/images/coordination4.jpg",
    roles: ["COORDINADOR"],
    super: false,
  },
  {
    title: "Complementarias",
    route: "/complementarias",
    image: "/images/Sena.png", // TODO: Reemplazar con imagen definitiva
    roles: ["PROGRAMADOR", "COORDINADOR"],
    super: false,
  },
  // {
  //   title: "Usarios",
  //   route: "/users",
  //   image: "/images/users4.jpg",
  //   show: false,
  // },
]);
</script>

