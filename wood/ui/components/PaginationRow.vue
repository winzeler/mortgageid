<template>
  <div class="flex flex-col sm:flex-row mt-4">
    <div class="side-slot">
      <text-input
        v-if="searchEnabled"
        class="text-input-small"
        input-id="search-input"
        :label="searchLabel"
        :error-text="''"
        :disabled="false"
        @update:modelValue="searchChanged"
      />
    </div>

    <div class="pages">
      <component
        :is="page === 1 ? 'span' : 'a'"
        @click="changePage(1)"
      >
        First
      </component>
      <span v-if="isFirstEllipsis">...</span>

      <a
        v-for="number in previousNumbers"
        :key="number"
        @click="changePage(number)"
      >
        {{ number }}
      </a>

      <span>{{ page }}</span>

      <a
        v-for="number in nextNumbers"
        :key="number"
        @click="changePage(number)"
      >
        {{ number }}
      </a>

      <span v-if="isLastEllipsis">...</span>
      <component
        :is="page === pages ? 'span' : 'a'"
        @click="changePage(pages)"
      >
        Last
      </component>
    </div>
    <div class="side-slot text-right">
      <select
        v-model="selectedPerPage"
        @change="$emit('changePer', selectedPerPage)"
      >
        <option
          v-for="option in perPageOptions"
          :key="option"
          :value="option"
        >
          {{ option }} per page
        </option>
      </select>
    </div>
  </div>
</template>

<script>
import range from 'lodash/range';
import TextInput from '#ui/components/TextInput';

const SEARCH_TYPING_DELAY = 1000;

let searchTypeTimeout;

export default {
  name: 'PaginationRow',

  components: {
    TextInput,
  },

  props: {
    /**
     * @type {Number} The current page.
     */
    page: {
      type: Number,
      required: true,
    },

    /**
     * @type {Number} The total number of pages.
     */
    pages: {
      type: Number,
      required: true,
    },

    /**
     * @type {Number} The number of entries per page.
     */
    per: {
      type: Number,
      required: true,
    },

    /**
     * @type {Boolean} If search bar is enabled.
     */
    searchEnabled: {
      type: Boolean,
      default: false,
    },

    /**
     * @type {String} The label for the search text input.
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
  },

  emits: [
    'changePer',
    'changePage',
    'searchFor',
  ],

  data() {
    return {
      selectedPerPage: this.per,
    };
  },

  computed: {
    /**
     * Gets the range of of 0-3 numbers to display "previous to" the current page.
     *
     * @return {Array<Number>}
     */
    previousNumbers() {
      return this.page > 1
        ? range(Math.max(this.page - 3, 1), this.page)
        : [];
    },

    /**
     * Should display an ellipsis if there are numbers between First and the leftmost numbered page.
     *
     * @return {String}
     */
    isFirstEllipsis() {
      return this.page - 3 > 1;
    },

    /**
     * Gets the range of 0-3 numbers to display "next to" the current page.
     *
     * @return {Array<Number>}
     */
    nextNumbers() {
      return this.page < this.pages
        ? range(this.page + 1, Math.min(this.pages + 1, this.page + 4))
        : [];
    },

    /**
     * Should display an ellipsis if there are numbers between the rightmost numbered page and Last.
     *
     * @return {String}
     */
    isLastEllipsis() {
      return this.page + 3 < this.pages;
    },
  },

  methods: {
    /**
     * Fired when user clicks on a new page to change to.
     *
     * @param {Number} number - The page number to change to.
     */
    changePage(number) {
      // If user is click on "First" and we're on the first page
      if (number === 1 && this.page === 1) {
        return;
      }

      // If user is clicking on "Last" and we're on the last page
      if (number === this.pages && this.page === this.pages) {
        return;
      }

      this.$emit('changePage', number);
    },

    /**
     * Fired when search text has been changed.
     * Wait for user to finish typing, then emit search event.
     *
     * @param {String} searchText - The value of the text to search for.
     */
    searchChanged(searchText) {
      clearTimeout(searchTypeTimeout);

      searchTypeTimeout = setTimeout(() => {
        this.$emit('searchFor', searchText);
      }, SEARCH_TYPING_DELAY);
    },
  },
};
</script>

<style scoped>
.pages {
  @apply w-full sm:w-1/3 text-center;
}

.pages a {
  @apply p-2 inline-block;
}

.pages span {
  @apply p-2 inline-block;
}

.side-slot {
  @apply w-full sm:w-1/3;
  min-width: 160px;
}
</style>
