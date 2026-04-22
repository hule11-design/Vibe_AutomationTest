declare const process: {
  env: Record<string, string | undefined>;
};

export const users = {
  admin: {
    username: 'Admin_h4',
    password: '44444444',
  },
  shopper: {
    username: 'test1',
    password: '11111111',
  },
  shopperPool: [
    {
      username: process.env.SHOPPER_1_USERNAME ?? 'test1',
      password: process.env.SHOPPER_1_PASSWORD ?? '11111111',
    },
    {
      username: process.env.SHOPPER_2_USERNAME ?? 'test2',
      password: process.env.SHOPPER_2_PASSWORD ?? '11111111',
    },
    {
      username: process.env.SHOPPER_3_USERNAME ?? 'test3',
      password: process.env.SHOPPER_3_PASSWORD ?? '11111111',
    },
    {
      username: process.env.SHOPPER_4_USERNAME ?? 'test4',
      password: process.env.SHOPPER_4_PASSWORD ?? '11111111',
    },
  ],
};

export const appUrl = 'http://192.168.237.15:5173';
