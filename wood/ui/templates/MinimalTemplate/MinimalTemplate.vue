<template>
  <div class="relative flex flex-col h-screen bg-themeBackground-200">
    <div class="page-header">
      <nav class="page-header-text">
        {{ $route.meta.header || defaultPageHeader }}
      </nav>
    </div>

    <div class="flex justify-center items-center w-full h-full">
      <router-view />
    </div>
  </div>
</template>

<script>
import { getConfig } from '#lib/Config';

export default {
  name: 'MinimalTemplate',

  data: () => ({
    defaultPageHeader: getConfig('app', 'name'),
  }),
};
</script>

<style scoped>
.page-header {
  @apply h-40 w-full flex flex-wrap;
}

.page-header-text {
  @apply pl-8 flex-1 border-b-2 border-themeBackground-200 flex items-center font-bold text-3xl;
}

@screen lg {
  .page-header {
    @apply h-20;
  }
}
</style>
