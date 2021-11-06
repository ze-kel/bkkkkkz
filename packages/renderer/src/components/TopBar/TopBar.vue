<template>
  <div class="topBar"></div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.topBar {
  height: var(--top-bar-size);
  width: 100%;
  position: sticky;
  -webkit-user-select: none;
  user-select: none;
  -webkit-app-region: drag;
  background-color: var(--bg-secondary);
}
</style>
