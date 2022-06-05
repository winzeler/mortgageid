module.exports = [
  {
    id: 'prod_simple',
    name: 'Simple',
    description: 'For simple companies.',
    active: true,
    metadata: {
      order: '3',
      bullets: '["100 credits/month.", "Access to simple stuff."]',
    },
    prices: [
      {
        id: 'price_simple_monthly',
        nickname: 'Simple Monthly',
        active: true,
        unit_amount: 1000,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        metadata: {
          order: '1',
        },
      },
      {
        id: 'price_simple_annual',
        nickname: 'Simple Annual',
        active: true,
        unit_amount: 10000,
        currency: 'usd',
        interval: 'year',
        interval_count: 1,
        metadata: {
          order: '2',
        },
      },
    ],
  },
  {
    id: 'prod_advanced',
    name: 'Advanced',
    description: 'For advanced companies.',
    active: true,
    metadata: {
      order: '1',
      bullets: '["500 credits/month.", "Access to advanced stuff."]',
    },
    prices: [
      {
        id: 'price_advanced_monthly',
        nickname: 'Advanced Monthly',
        active: true,
        unit_amount: 5000,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        metadata: {
          order: '1',
        },
      },
      {
        id: 'price_advanced_annual',
        nickname: 'Advanced Annual',
        active: true,
        unit_amount: 50000,
        currency: 'usd',
        interval: 'year',
        interval_count: 1,
        metadata: {
          order: '2',
        },
      },
      {
        id: 'price_advanced_monthly_canadian',
        nickname: 'Advanced Monthly Canadian',
        active: true,
        unit_amount: 6500,
        currency: 'cad',
        interval: 'month',
        interval_count: 1,
        metadata: {
          order: '1',
        },
      },
      {
        id: 'price_advanced_annual_canadian',
        nickname: 'Advanced Annual Canadian',
        active: true,
        unit_amount: 65000,
        currency: 'cad',
        interval: 'year',
        interval_count: 1,
        metadata: {
          order: '2',
        },
      },
    ],
  },
  {
    id: 'prod_canadian',
    name: 'Canadian',
    description: 'For Canadian companies.',
    active: true,
    metadata: {
      order: '3',
      bullets: '["100 credits/month.", "Access to Canadian stuff."]',
    },
    prices: [
      {
        id: 'price_canadian_monthly',
        nickname: 'Canadian Monthly',
        active: true,
        unit_amount: 1500,
        currency: 'cad',
        interval: 'month',
        interval_count: 1,
        metadata: {
          order: '1',
        },
      },
      {
        id: 'price_canadian_annual',
        nickname: 'Canadian Annual',
        active: true,
        unit_amount: 15000,
        currency: 'cad',
        interval: 'year',
        interval_count: 1,
        metadata: {
          order: '2',
        },
      },
    ],
  },
  {
    id: 'prod_memberlimit',
    name: 'Member limit',
    description: 'Limits members.',
    active: true,
    metadata: {
      order: '3',
      bullets: '["100 credits/month.", "Access to simple stuff."]',
      max_members: 2,
    },
    prices: [
      {
        id: 'price_memberlimit_monthly',
        nickname: 'Memberlimit Monthly',
        active: true,
        unit_amount: 1000,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
        metadata: {
          order: '1',
        },
      },
    ],
  },
];
