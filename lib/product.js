async function readProducts(req, reply) {
  reply.statusCode = 200;
}

async function createProduct(req, reply) {
  reply.statusCode = 200;
}

async function readProduct(req, reply) {
  reply.statusCode = 200;
}

export default {
  readProducts: readProducts,
  createProduct: createProduct,
  readProduct: readProduct,
};
