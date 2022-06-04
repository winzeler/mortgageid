<template>
  <change-password v-if="hasToken" />
  <get-reset-token v-else />
</template>

<script>
import isUndefined from 'lodash/isUndefined';
import GetResetToken from './reset-password/GetResetToken';
import ChangePassword from './reset-password/ChangePassword';

export default {
  name: 'ResetPasswordPage',

  components: {
    GetResetToken,
    ChangePassword,
  },

  computed: {
    hasToken() {
      return ! isUndefined(this.$route.query.token);
    },
  },
};
</script>

<style scoped>
</style>
