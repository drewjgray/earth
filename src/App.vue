<template>
  <h1 class="title">Expedition Labs</h1>
  <Earth />
</template>

<script setup>
import Earth from './components/Earth.vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: black;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: black;
  background-color: black;
}

.title {
  color: white;
  font-size: 3rem;
  margin: 1rem 0;
  position: relative;
  z-index: 1;
  margin-top: 40px;
  margin-bottom: -140px;
}
</style>
