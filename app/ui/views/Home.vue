<template>
  <app-header @onVeridaContextSet="onVeridaContextSet" />
  <div style="text-align: center">
    <h1>{{ contextName }}: Home Page</h1>

    <div>
      This
      <a href="https://developers.verida.io/docs/concepts/application-contexts"
        >application context</a
      >
      is called: <i>{{ contextName }}</i
      >. Change this by editing the value of VUE_APP_CONTEXT_NAME in the .env
      file included in this project.
    </div>

    <div>You logged in with DID {{ did }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Context } from "@verida/client-ts";
import { Account } from "@verida/account";
import AppHeader from "@/components/Header.vue";
import { mapState } from "vuex";

interface IData {
  did: string;
  contextName: string | undefined;
}

export default defineComponent({
  name: "Home",
  components: {
    AppHeader,
  },
  mounted() {
    // veridaContext and veridaAccount cannot be set in data.
    // The JSON schema compiler used inside them does not like running inside a Vue proxy object
    this.$options.veridaContext = null as null | Context;
    this.$options.veridaAccount = null as null | Account;

    this.onVeridaContextSet(this.context);
  },
  computed: mapState(["context"]),
  data(): IData {
    return {
      did: "",
      contextName: "",
    };
  },
  methods: {
    setDid(did: string) {
      this.did = did;
    },

    async onVeridaContextSet(vContext: Context) {
      if (vContext) {
        // console.log("enter", vContext);
        // You are free to delete this logging
        // we have the veridaContext.
        // console.log(vContext);
        this.$options.veridaContext = vContext;

        this.contextName = this.$options.veridaContext.getContextName();

        // console.log(this.$options.veridaContext);

        // this is a Verida Account object
        this.$options.veridaAccount = this.$options.veridaContext.getAccount();

        // and this is how we get the DID
        this.did = await this.$options.veridaAccount.did();
      }
    },
  },
});
</script>
