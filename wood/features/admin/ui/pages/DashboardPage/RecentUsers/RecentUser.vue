<template>
  <div class="flex justify-between w-full">
    <div class="flex">
      <img
        :src="gravatarUrl"
        alt="Gravatar"
        class="w-12 h-12 rounded-full mr-4"
      >
      <div>
        <div class="text-lg font-bold mr-4">
          {{ name }}
        </div>
        <div
          v-if="hasMrrData"
          class="text-sm"
        >
          {{ plan }}
        </div>
      </div>
    </div>
    <div class="text-right">
      <div
        v-if="hasMrrData"
        class="text-xl font-bold text-themeBackground-500"
      >
        <span class="text-themeMoney-500">{{ mrr }}</span> MRR
      </div>
      <div class="text-sm text-themeBackground-500">
        Joined {{ joined }}
      </div>
    </div>
  </div>
</template>

<script>
import md5 from 'md5';

export default {
  name: 'RecentUser',

  props: {
    /**
     * @type {String} The user's name.
     */
    name: {
      type: String,
      required: true,
    },

    /**
     * @type {String} The user's email address.
     */
    email: {
      type: String,
      required: true,
    },

    /**
     * @type {String} The date the user signed up.
     */
    joined: {
      type: String,
      required: true,
    },

    /**
     * @type {String} The product/price plan the user is on.
     */
    plan: {
      type: String,
      default: undefined,
    },

    /**
     * @type {String} The MRR this user contributes.
     */
    mrr: {
      type: String,
      default: undefined,
    },
  },

  computed: {
    /**
     * The active user's gravatar URL.
     *
     * @return {String}
     */
    gravatarUrl() {
      return `https://www.gravatar.com/avatar/${md5(this.email.trim().toLowerCase())}?d=robohash`;
    },

    /**
     * Indicates if MRR data is included in the dashboard data.
     *
     * @return {Boolean}
     */
    hasMrrData() {
      return this.mrr !== undefined;
    },
  },
};
</script>

<style scoped>
</style>
