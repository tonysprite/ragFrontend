<script setup>
import RoleList from './components/RoleList.vue'
</script>

<template>
  <div class="container">
    <h1>QA系统</h1>
    <RoleList />
  </div>
</template>

<style scoped>
.container {
  width: 80%;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
}

@media (prefers-color-scheme: dark) {
  h1 {
    color: #fff;
  }
}
</style>
