<template>
  <q-drawer
    v-model="props.leftDrawerOpen"
    side="left"
    bordered
    :class="{ 'hide-menu':  $route.name === 'login' }"
  >
    <q-scroll-area
      style="
        height: calc(100% - 150px);
        margin-top: 150px;
        border-right: 1px solid #ddd;
      "
    >
      <q-list class="column items-center" style="padding-top: 40px">
        <router-link
          v-for="(item, index) in menu"
          :key="index"
          :to="item.route"
          style="text-decoration: none"
        >
          <q-item
            v-if="item.roles.includes(userStore.getRole())"
            @click="toggleLeftDrawer"
            clickable
            class="bg-green-9 text-white q-mb-md"
            style="border-radius: 12px; width: 230px"
          >
            <q-item-section avatar style="min-width: 1px">
              <q-icon :name="item.icon" style="font-size: 23px"></q-icon>
            </q-item-section>
            <q-item-section style="font-size: medium" class="style-text">
              {{ item.name }}
            </q-item-section>
          </q-item>
        </router-link>
      </q-list>
    </q-scroll-area>

    <q-img class="absolute-top bg-grey-2 text-center" style="height: 150px">
      <div class="absolute-bottom bg-transparent text-black">
        <q-avatar size="80px" class="q-pt-sm">
          <img src="/images/LOGO-SENA.png" />
        </q-avatar>
        <div class="text-weight-bolder text-h6 text-uppercase">
          {{ userStore.getRole() }}
        </div>
        <div class="text-subtitle2">
          {{ userStore.email }}
        </div>
      </div>
    </q-img>
  </q-drawer>
</template>

<script setup>
import { ref, defineProps, watch } from "vue";
import { storeUser } from "../store/users.js";
import { useRouter } from "vue-router";

const props = defineProps({
  toggleLeftDrawer: Function,
  leftDrawerOpen: Boolean,
});


const userStore = storeUser();
const router = useRouter();

const menu = ref([
  {
    name: "inicio",
    icon: "home",
    route: "/home",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "instructores",
    icon: "groups",
    route: "/instructors",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "programas",
    icon: "today",
    route: "/programs",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "competencias",
    icon: "sticky_note_2",
    route: "/competences",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "ambientes",
    icon: "safety_divider",
    route: "/environments",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "resultados",
    icon: "insert_chart",
    route: "/results",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "fichas",
    icon: "view_module",
    route: "/files",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "horarios",
    icon: "schedule",
    route: "/homeSchedules",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "reportes",
    icon: "task",
    route: "/reports",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "carga masiva",
    icon: "upload",
    route: "/bulkload",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
  {
    name: "Juicios evaluativos",
    icon: "balance",
    route: "/judgment",
    roles: ["PROGRAMADOR", "COORDINADOR", "EVALUADOR","NOVEDADES"],
  },
  {
    name: "Novedades",
    icon: "report_problem",
    route: "/news",
    roles: ["PROGRAMADOR", "COORDINADOR", "NOVEDADES"],
  },
  {
    name: "coordinación",
    icon: "school",
    route: "/coordination",
    roles: ["COORDINADOR"],
  },
  {
    name: "usuarios",
    icon: "group",
    route: "/users",
    roles: ["COORDINADOR"],
  },
  {
    name: "Complementarias",
    icon: "add_circle", // TODO: Reemplazar con icono definitivo
    route: "/complementarias",
    roles: ["PROGRAMADOR", "COORDINADOR"],
  },
]);
</script>

