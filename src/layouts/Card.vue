<template>
  <q-card
    class="my-card-1 text-center shadow-5 full-width"
    v-if="props.roles.length>0 ? props.roles.includes(userStore.getRole()) : true"
  >
    <q-card-section class="card_style q-py-sm">
      <div class="row items-center justify-center">
        <div class="text-h6 style-text">
          {{ props.title }}
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <div class="justify-center flex q-my-sm">
      <img :src="props.image" class="img-card" :alt="props.title" />
    </div>
    <q-separator />
    <router-link :to="props.route" style="text-decoration: none; color: black">
      <q-card-actions class="column items-center q-mt-sm q-pb-md">
        <q-btn class="button_style" style="width: 50%"> VER </q-btn>
      </q-card-actions>
    </router-link>
  </q-card>
</template>

<script setup>
import { ref, defineProps } from "vue";
import { storeUser } from "../store/users.js";

const userStore = storeUser();

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  route: {
    type: String,
    default: "",
  },
  roles: {
    type: Array,
    default: [],
  },
});
</script>

<style scoped>
.card_style {
  background-color: var(--color_card) !important;
  color: var(--color_text_card);
}

.img-card {
  display: flex;
  width: 50% !important;
  aspect-ratio: 4/3 !important;
  object-fit: cover;
  max-width: 50% !important;
  border: 0;
}

.button_style {
  background-color: var(--color_button);
  color: var(--color_text_button);
}
</style>
