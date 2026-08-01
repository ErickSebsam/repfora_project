<template>
  <div>
    <q-layout view="hHh lpR fff">
      <HeaderLayout :logout="logout" :toggleLeftDrawer="toggleLeftDrawer" />
      <DrawerLayout
        :toggleLeftDrawer="toggleLeftDrawer"
        :leftDrawerOpen="leftDrawerOpen"
      />

      <q-page-container style="padding-left: 0">
        <router-view />
      </q-page-container>

      <FooterLayout />
    </q-layout>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { storeUser } from "./store/users.js";
import { useRouter } from "vue-router";

import FooterLayout from "./layouts/footerLayout.vue";
import HeaderLayout from "./layouts/headerLayout.vue";
import DrawerLayout from "./layouts/drawerLayout.vue";

const userStore = storeUser();
const router = useRouter();

const currentDate = new Date();
const dateLogin = new Date(userStore.dateLogin);

const leftDrawerOpen = ref(false);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const logout = () => {
  userStore.logoutUser();
  leftDrawerOpen.value = false;
  router.replace({ name: "login" });
};

//si la fecha actual es mayor a la fecha de inicio de sesion + 1 dia
if (currentDate > dateLogin.setDate(dateLogin.getDate() + 1)) {
  logout();
}

//set title to page
document.title = import.meta.env.VITE_APP_TITLE;

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
