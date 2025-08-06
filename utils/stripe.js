// src/utils/stripe.js

// 伪造一个空对象，避免报错
const stripe = {
  // 你可以定义一些空函数，防止调用时报错
  charges: {
    create: async () => { /* do nothing */ },
  },
  customers: {
    create: async () => { /* do nothing */ },
  },
  // 其他用到的方法也可以加
};

export default stripe;
