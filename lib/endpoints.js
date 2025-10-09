import home from "./home.js";
import user from "./user.js";
import product from "./product.js";
import order from "./order.js";

export default {
  home: home.home,
  readUsers: user.readUsers,
  createUser: user.createUser,
  readUser: user.readUser,
  readProducts: product.readProducts,
  createProducts: product.createProducts,
  readProduct: product.readProduct,
  readOrders: order.readOrders,
  createOrders: order.createOrders,
  readOrder: order.readOrder,
};
