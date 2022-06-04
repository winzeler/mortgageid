<template>
  <div class="card">
    <h2 class="card-header">
      Last 30 Days
    </h2>
    <div class="card-body flex flex-col space-y-4">
      <LineChart
        :chart-data="chartData"
        :options="options"
        :height="150"
      />
    </div>
  </div>
</template>

<script setup>
import clone from 'lodash/clone';
import { ref, computed, toRefs } from 'vue';
import { LineChart } from 'vue-chart-3';
import { isFeatureEnabled } from '#lib/Config';

const props = defineProps({
  /**
   * @type {Array} The days to display in the chart.
   */
  days: {
    type: Array,
    default: () => [],
  },
});

const { days } = toRefs(props);
const reverseDays = computed(() => clone(days.value).reverse());

const chartData = computed(() => ({
  labels: reverseDays.value.map((day) => day.day.format('MMM D')),
  datasets: [
    {
      label: 'Users',
      borderColor: '#e53e3e',
      data: reverseDays.value.map((day) => day.usersCount),
      cubicInterpolationMode: 'monotone',
      yAxisID: 'yLeft',
    },
  ],
}));

if (isFeatureEnabled('teams')) {
  chartData.value.datasets.push({
    label: 'Teams',
    borderColor: '#3182ce',
    data: reverseDays.value.map((day) => day.teamsCount),
    cubicInterpolationMode: 'monotone',
    yAxisID: 'yLeft',
  });
}

if (isFeatureEnabled('subscriptions')) {
  chartData.value.datasets.push({
    label: 'MRR ($)',
    borderColor: '#22c55e',
    data: reverseDays.value.map((day) => day.mrrAmount),
    cubicInterpolationMode: 'monotone',
    yAxisID: 'yRight',
  });
}

const options = ref({
  scales: {
    yLeft: {
      type: 'linear',
      position: 'left',
      ticks: { precision: 0 },
    },
  },
});

if (isFeatureEnabled('subscriptions')) {
  options.value.scales.yRight = {
    type: 'linear',
    position: 'right',
    ticks: { callback: (value, index, ticks) => `$${value}` },
  };
}
</script>
