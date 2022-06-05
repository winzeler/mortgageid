module.exports = {
  countries: {
    CA: [
      {
        id: 'txr_canada',
        display_name: 'GST',
        description: 'General Sales Tax',
        active: true,
        inclusive: false,
        percentage: 10,
        metadata: {},
      },
    ],
  },
  states: {
    CA: {
      Ontario: [
        {
          id: 'txr_ontario',
          display_name: 'HST',
          description: 'Ontario Harmonized Sales Tax',
          active: true,
          inclusive: false,
          percentage: 25,
          metadata: {
            override: true,
          },
        },
      ],
      Quebec: [
        {
          id: 'txr_quebec',
          display_name: 'QST',
          description: 'Quebec Sales Tax',
          active: true,
          inclusive: false,
          percentage: 40,
          metadata: {},
        },
      ],
    },
  },
};
