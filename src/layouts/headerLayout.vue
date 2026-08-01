

<template>
  <q-header
    class="header"
    elevated
    :class="{ 
      'hide-menu': $route.name === 'login' 
      || $route.name === 'registernew' 

      
      }"
  >
    <q-toolbar>
      <q-item
        v-if="
          [
            'PROGRAMADOR',
            'COORDINADOR',
            'EVALUADOR',
            'NOVEDADES',

          ].includes(userStore.getRole())
          
        "
        clickable
        v-ripple
        @click="toggleLeftDrawer"
        class="justify-center flex items-center"
      >
        <q-icon name="menu" class="text-white" size="24px" />
        <q-toolbar-title style="font-size: 18px">REPFORA</q-toolbar-title>
      </q-item>
      <q-item
        v-if="userStore.getRole() === 'USER'"
        clickable
        to="/consultor"
        class="justify-center flex items-center"
      >
        <q-avatar size="40px">
          <img src="/images/logo-blanco.png" />
        </q-avatar>
      </q-item>

      <q-space></q-space>
      <q-btn flat icon="logout" size="17px" @click="logout" />
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { ref, defineProps } from "vue";
import { storeUser } from "../store/users.js";
import { useRouter } from "vue-router";

const props = defineProps({
  logout: Function,
  toggleLeftDrawer: Function,
});



const userStore = storeUser();
const router = useRouter();
</script>

<style scoped>
.hide-menu {
  display: none;
}

.header {
  background-color: var(--color_header);
}

.btnSlider:hover {
  background-color: transparent !important;
}
</style>
