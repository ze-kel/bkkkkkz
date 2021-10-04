<template>
  <button @click="doShit">
    DO SHIT
  </button>
  {{ files }}
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useElectron } from '/@/use/electron';

export default defineComponent({
  name: 'HelloWorld',
  setup() {
    const elec = useElectron();

    const files = ref([]);

    const doShit = async () => {
      console.log('hello');
      const result = await elec.files.getFiles();
      console.log(result);

      files.value = result;
    };

    doShit();

    return { doShit, files };
  },
});
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
