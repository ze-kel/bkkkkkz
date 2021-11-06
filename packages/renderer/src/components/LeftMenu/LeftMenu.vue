<template>
  <div class="menu">
    <div class="icon">
      <font-awesome-icon class="fa-xl" icon="plus" />
    </div>
    <div class="icon">
      <font-awesome-icon class="fa-xl" icon="book" />
    </div>
    <div class="icon">
      <font-awesome-icon class="fa-xl" icon="chart-bar" />
    </div>
    <div class="icon">
      <font-awesome-icon class="fa-xl" icon="gears" />
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  width: 50px;
  background-color: var(--bg-secondary);
}

.icon {
  color: var(--text-main);
  cursor: pointer;
  transition: 0.5s all;

  :hover {
    color: var(--text-main-hover);
  }

  &:not(:first-of-type) {
    margin-top: 15px;
  }
}
</style>
