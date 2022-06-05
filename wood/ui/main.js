import { createApp } from 'vue';
import { setupPlugins, setupFeatures } from '#ui/configure';
import App from '#ui/App';

const app = createApp(App);

setupPlugins(app);
setupFeatures(app);

app.mount('#app');

export default app;
