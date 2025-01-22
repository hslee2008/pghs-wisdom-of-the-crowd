<template>
  <div class="mx-10 mt-10">
    <img src="/cow.png" alt="Cow" style="width: 100%" />

    <br /><br /><br /><br />

    <!-- Textarea for unique values -->
    <v-textarea
      label="Unique Values"
      v-model="input"
      outlined
      dense
      rows="5"
      placeholder="Enter values between 500 and 5000"
    ></v-textarea>

    <!-- Statistics Table -->
    <v-card class="mt-5">
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Statistic</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Total Data Points</strong></td>
              <td>{{ totalDataPoints }}</td>
            </tr>
            <tr>
              <td><strong>Median</strong></td>
              <td>{{ median }}</td>
            </tr>
            <tr>
              <td><strong>Standard Deviation</strong></td>
              <td>{{ standardDeviation.toFixed(2) }}</td>
            </tr>
            <tr>
              <td><strong>Middle Value</strong></td>
              <td>{{ middleValue }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Update Button -->
    <v-btn
      class="mt-5"
      :loading="isUpdating"
      @click="updateChart"
      color="primary"
      outlined
    >
      Update Chart (1593)
    </v-btn>

    <!-- Bar Chart -->
    <v-card class="mt-5">
      <canvas id="bar-chart"></canvas>
    </v-card>

    <br />
    <br />
    <br />
    <br />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import Chart from "chart.js/auto";
import { getDatabase, ref as dbRef, set, get, update } from "firebase/database";

// Firebase setup
const db = getDatabase();
const chartDataRef = dbRef(db, "chartData");
const uniqueValuesRef = dbRef(db, "uniqueValues");

// Reactive states
const input = ref("");
const ranges = Array.from(
  { length: 450 },
  (_, i) => `${500 + i * 10}-${509 + i * 10}`
);
const rangeData = reactive(Array(450).fill(0));
const uniqueValues = reactive({});
const isUpdating = ref(false);

let chartInstance: Chart | null = null;

// Computed statistics
const totalDataPoints = computed(() =>
  Object.values(uniqueValues).reduce((sum, value) => sum + value, 0)
);
const median = computed(() => {
  const sorted = [];
  Object.entries(uniqueValues).forEach(([value, count]) => {
    sorted.push(...Array(count).fill(Number(value)));
  });
  sorted.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
});
const standardDeviation = computed(() => {
  const mean = totalDataPoints.value / Math.max(1, totalDataPoints.value);
  const variance = Object.entries(uniqueValues).reduce(
    (sum, [value, count]) => sum + count * Math.pow(Number(value) - mean, 2),
    0
  );
  return Math.sqrt(variance / Math.max(1, totalDataPoints.value));
});
const middleValue = computed(() => {
  const sortedKeys = Object.keys(uniqueValues).sort(
    (a, b) => Number(a) - Number(b)
  );
  return sortedKeys[Math.floor(sortedKeys.length / 2)];
});

// Initialize Chart.js Bar Chart
function createChart() {
  const ctx = document.getElementById("bar-chart") as HTMLCanvasElement;
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ranges,
      datasets: [
        {
          label: "Range Data",
          backgroundColor: "#42A5F5",
          data: rangeData,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Ranges",
          },
        },
        y: {
          title: {
            display: true,
            text: "Count",
          },
        },
      },
    },
  });
}

// Update Chart.js with new data
function updateChartData() {
  if (chartInstance) {
    chartInstance.data.datasets[0].data = [...rangeData];
    chartInstance.update();
  }
}

// Load data from Firebase
async function loadData() {
  isUpdating.value = true;
  try {
    const chartSnapshot = await get(chartDataRef);
    const uniqueSnapshot = await get(uniqueValuesRef);

    if (chartSnapshot.exists()) {
      const firebaseData = chartSnapshot.val();
      ranges.forEach((range, index) => {
        rangeData[index] = firebaseData[range] || 0;
      });
    } else {
      const initialChartData = ranges.reduce((obj, range) => {
        obj[range] = 0;
        return obj;
      }, {});
      await set(chartDataRef, initialChartData);
    }

    if (uniqueSnapshot.exists()) {
      Object.assign(uniqueValues, uniqueSnapshot.val());
      input.value = Object.entries(uniqueValues)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .flatMap(([key, count]) => Array(count).fill(key))
        .join(", ");
    } else {
      await set(uniqueValuesRef, {});
    }

    updateChartData(); // Update chart with fetched data
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isUpdating.value = false;
  }
}

// Update chart data (replace mode)
async function updateChart() {
  isUpdating.value = true;

  const indices = input.value
    .split(/[\s,]+/)
    .map((num) => parseInt(num, 10))
    .filter((num) => !isNaN(num) && num >= 500 && num <= 5000);

  try {
    // Reset rangeData and uniqueValues
    rangeData.fill(0);
    for (const key in uniqueValues) {
      delete uniqueValues[key];
    }

    const rangeUpdates = {};

    indices.forEach((value) => {
      uniqueValues[value] = (uniqueValues[value] || 0) + 1;
      const rangeIndex = Math.floor((value - 500) / 10);
      if (rangeIndex >= 0 && rangeIndex < rangeData.length) {
        rangeData[rangeIndex] += 1;
      }
    });

    ranges.forEach((range, index) => {
      rangeUpdates[range] = rangeData[index];
    });

    await update(chartDataRef, rangeUpdates);
    await update(uniqueValuesRef, uniqueValues);

    updateChartData(); // Update chart with new data

    input.value = Object.entries(uniqueValues)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .flatMap(([key, count]) => Array(count).fill(key))
      .join(", ");
  } catch (error) {
    console.error("Error updating chart:", error);
  } finally {
    isUpdating.value = false;
  }
}

// On Mounted
onMounted(async () => {
  createChart();
  await loadData();
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
</style>
