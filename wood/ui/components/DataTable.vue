<template>
  <div>
    <table class="wood-table-full hidden sm:table">
      <thead>
        <tr>
          <template
            v-for="(field, key) in fields"
            :key="key"
          >
            <th :class="field.labelClass({ desktop: true })">
              <span :class="field.labelInnerClass({ desktop: true })">
                {{ field.label() }}
              </span>
            </th>
          </template>
          <th v-if="isActions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
        >
          <template
            v-for="key in keys"
            :key="key"
          >
            <td :class="row.valueClass(key, { desktop: true })">
              <!-- eslint-disable -->
              <span
                v-if="row.isHtml(key)"
                :class="row.valueInnerClass(key, { desktop: true })"
                v-html="row.value(key)"
              />
              <!-- eslint-enable -->
              <span
                v-else
                :class="row.valueInnerClass(key, { desktop: true })"
              >
                {{ row.value(key) }}
              </span>
            </td>
          </template>
          <td
            v-if="isActions"
            class="actions text-center"
          >
            <dropdown-menu
              v-if="getActions(row)"
              menu-wrapper-classes="card-xs"
              menu-button-classes="card-body"
              :menu-dropdown-classes="'right-0'"
            >
              <template #menu-text>
                Actions
              </template>
              <dropdown-menu-item
                v-for="(action, idx) in getActions(row)"
                :key="idx"
                class="whitespace-nowrap"
                :click="() => action.fn(row)"
              >
                {{ action.name }}
              </dropdown-menu-item>
            </dropdown-menu>
          </td>
        </tr>

        <tr v-if="isLoading && rows.length === 0">
          <td
            :colspan="fieldCount"
            class="text-center"
          >
            <loading-spinner
              size-class="fa-lg"
              class="inline-flex"
            />
            Loading...
          </td>
        </tr>
        <div
          v-if="isLoading"
          class="loading-overlay"
        />
        <tr v-else-if="rows.length === 0">
          <td
            :colspan="fieldCount"
            class="text-center"
          >
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
    </table>

    <table class="wood-table-mobile table-fixed sm:hidden">
      <tbody>
        <template
          v-for="(row, rowIdx) in rows"
          :key="row.id"
        >
          <tr
            v-for="(field, key) in fields"
            :key="key"
            :class="{ even: rowIdx % 2, odd: !(rowIdx % 2) }"
          >
            <td :class="field.labelClass({ mobile: true })">
              <span
                class="font-semibold"
                :class="field.labelInnerClass({ mobile: true })"
              >
                {{ field.label() }}
              </span>
            </td>
            <td :class="row.valueClass(key, { mobile: true })">
              <!-- eslint-disable -->
              <span
                v-if="row.isHtml(key)"
                :class="row.valueInnerClass(key, { mobile: true })"
                v-html="row.value(key)"
              />
              <!-- eslint-enable -->
              <span
                v-else
                :class="row.valueInnerClass(key, { mobile: true })"
              >
                {{ row.value(key) }}
              </span>
            </td>
          </tr>
          <tr
            v-if="isActions"
            class="actions"
            :class="{
              even: rowIdx % 2,
              odd: !(rowIdx % 2),
              'border-b-2 border-themeBackground-500': rowIdx < rows.length - 1,
            }"
          >
            <td class="font-semibold">
              Actions
            </td>
            <td>
              <dropdown-menu
                v-if="getActions(row)"
                menu-wrapper-classes="card-xs"
                menu-button-classes="card-body"
                :menu-dropdown-classes="'right-0'"
              >
                <template #menu-text>
                  Actions
                </template>
                <dropdown-menu-item
                  v-for="(action, actionIdx) in getActions(row)"
                  :key="actionIdx"
                  class="whitespace-nowrap"
                  :click="() => action.fn(row)"
                >
                  {{ action.name }}
                </dropdown-menu-item>
              </dropdown-menu>
            </td>
          </tr>
        </template>

        <tr v-if="isLoading && rows.length === 0">
          <td
            colspan="2"
            class="text-center"
          >
            <loading-spinner
              size-class="fa-lg"
              class="inline-flex"
            />
            Loading...
          </td>
        </tr>
        <div
          v-if="isLoading"
          class="loading-overlay"
        />
        <tr v-else-if="rows.length === 0">
          <td
            colspan="2"
            class="text-center"
          >
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
    </table>

    <pagination-row
      v-if="showPagination && loadList"
      :page="page"
      :pages="totalPages"
      :per="per"
      :search-enabled="searchEnabled"
      :search-label="searchLabel"
      :per-page-options="perPageOptions"
      @changePage="changePage"
      @changePer="changePer"
      @searchFor="searchFor"
    />
  </div>
</template>

<script setup>
import { computed, toRefs, onMounted, ref } from 'vue';
import { deepUnref } from 'vue-deepunref';
import { getErrorMessage } from '#lib/Errors';
import { errorToast } from '#ui/lib/toast';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import DropdownMenu from '#ui/components/DropdownMenu';
import DropdownMenuItem from '#ui/components/DropdownMenuItem';
import PaginationRow from '#ui/components/PaginationRow';

const props = defineProps({
  /**
   * @type {Object} The fields to display in the table header.
   */
  fields: {
    type: Object,
    required: true,
  },

  /**
   * @type {Array} The rows of data to display.
   */
  rows: {
    type: Array,
    required: true,
  },

  /**
   * @type {Function} A function that can be used to manage the population and pagination of
   * the list.  If omitted, no search or pagination controls will be displayed.
   */
  loadList: {
    type: Function,
    default: null,
  },

  /**
   * @type {Number} The number of total pages for pagination.
   */
  totalPages: {
    type: Number,
    default: 0,
  },

  /**
   * @type {Boolean} If the search bar is enabled.
   */
  searchEnabled: {
    type: Boolean,
    default: false,
  },

  /**
   * @type {String} What label text to display for the search bar.
   */
  searchLabel: {
    type: String,
    default: 'Search',
  },

  /**
   * @type {Array<Number>} A list of choice for items to display per page.
   */
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50],
  },

  /**
   * @type {Boolean} Controls if the loading overlay is displayed.
   */
  isLoading: {
    type: Boolean,
    default: false,
  },

  /**
   * @type {Array<Object>} A list of actions that can be performed on each entry.
   *
   * Each object should have the following properties:
   * - name: The name displayed in the dropdown menu item.
   * - fn: The function to execute when the menu item is clicked.
   */
  actions: {
    type: Array,
    default: null,
  },

  /**
   * @type {Function} A function that can be used to programmatically determine the actions that can
   * be performed on each entry.  The function is passed the current row as a parameter.
   *
   * This function takes precedence over any specified `actions` prop.
   *
   * Each action object returned by the function should have the same properties as `actions`.
   */
  actionsFn: {
    type: Function,
    default: null,
  },

  /**
   * @type {String} The message to display when the table is empty.
   */
  emptyMessage: {
    type: String,
    default: 'No data',
  },

  /**
   * @type {Boolean} If we should show the pagination row.
   */
  showPagination: {
    type: Boolean,
    default: true,
  },
});

const {
  fields,
  rows,
  loadList,
  totalPages,
  isLoading,
  actions,
  actionsFn,
  perPageOptions,
} = toRefs(props);

const keys = computed(() => Object.keys(fields.value));
const fieldCount = computed(
  () => keys.value.length + (actions.value ? actions.value.length : 0),
);
const getActions = (row) => (actionsFn.value ? actionsFn.value(row) : actions.value);
const isActions = computed(() => actionsFn.value || actions.value);

/**
 * Pagination
 */
const page = ref(1);
const per = ref(perPageOptions.value[0]);
const search = ref('');

const getPage = async () => {
  try {
    await loadList.value({
      page: Number(page.value),
      per: Number(per.value),
      search: search.value,
    });
  }
  catch (error) {
    errorToast(getErrorMessage(error));
  }
};

const changePage = async (newPage) => {
  page.value = Number(newPage);
  await getPage(deepUnref({ page, per, search }));
};

const changePer = async (newPer) => {
  per.value = Number(newPer);
  await getPage(deepUnref({ page, per, search }));

  // Ensure we're not past the new total pages, if we've increased the per-page
  if (page.value > totalPages.value) {
    page.value = totalPages.value;
  }
};

onMounted(async () => {
  if (loadList.value) {
    await getPage(deepUnref({ page, per }));
  }
});

/**
 * Search for text.
 *
 * @param {String} newSearch - The text to search for.
 */
const searchFor = async (newSearch) => {
  search.value = newSearch;
  await getPage(deepUnref({ page, per, search }));
};
</script>

<style scoped>
.wood-table-full {
  @apply border border-themeBackground-400 shadow-lg relative w-full;
}

.wood-table-full thead {
  @apply bg-themeBackground-200 text-themeBackground-800;
}
.wood-table-full th {
  @apply p-3;
}

.wood-table-full td {
  @apply p-2 border border-themeBackground-400 bg-white;
}
/* The Tailwind :even and :hover properties conflict, where :even is displayed, but the :hover
   effect is not.  Manually defining the rules, however, works as intended */
.wood-table-full tbody tr:nth-child(even) td {
  @apply bg-themeBackground-100;
}
.wood-table-full tbody tr:hover td {
  @apply bg-themePrimary-200;
}

.wood-table-mobile {
  @apply border border-themeBackground-400 shadow-lg relative w-full;
}

.wood-table-mobile td {
  @apply p-2 border-b border-themeBackground-400 bg-white;
}
.wood-table-mobile .even td {
  @apply bg-themeBackground-100;
}

.loading-overlay {
  @apply absolute top-0 right-0 bottom-0 left-0;
  @apply flex justify-center items-center;
  background-color:rgba(255, 255, 255, 0.75);
}
</style>
