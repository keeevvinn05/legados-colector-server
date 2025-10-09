import httpStatus from "http-status-codes";
import { APIError, codes } from "./error.js";
import is from "is";
function validateProducts(snowflakeId, body) {
  if (is.undefined(body)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_PRODUCT,
      "body is mandatory"
    );
  }
  if (!is.array(body)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "body must be an array"
    );
  }
  var products = [];
  for (var i = 0; i < body.length; i++) {
    if (is.undefined(body[i].name)) {
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_PRODUCT,
        "name is mandatory"
      );
    }
    if (is.undefined(body[i].description)) {
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_PRODUCT,
        "description is mandatory"
      );
    }
    if (is.undefined(body[i].price)) {
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_PRODUCT,
        "price is mandatory"
      );
    }
    products.push({
      _id: snowflakeId.generate(),
      name: body[i].name,
      description: body[i].description,
      price: body[i].price,
    });
  }
  return products;
}

async function readProducts(req, reply) {
  const mongo = reply.routeOptions.config.mongo; //necesito el producto de mongo
  const products = await mongo
    .db("legados-collector") //entro e la db
    .collection("products") // a la seccion productos
    .find({}) //si lo encuentro
    .toArray(); //me manda array en cada producto
  return products.map((p) => {
    p.rid = p._id;
    delete p._id;
    return p;
  });
}

async function createProducts(req, reply) {
  const snowflakeId = reply.routeOptions.config.snowflakeId;
  const mongo = reply.routeOptions.config.mongo;
  const products = validateProducts(snowflakeId, req.body);
  try {
    await mongo
      .db("legados-collector")
      .collection("products")
      .insertMany(products);
  } catch (err) {
    if (err.errmsg.includes("duplicate")) {
      for (const [_, id] of Object.entries(err.result.insertedIds)) {
        await mongo
          .db("legados-collector")
          .collection("products")
          .deleteOne({ _id: id });
      }
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_PRODUCT,
        err.errmsg
      );
    } else {
      req.log.error(err);
      throw new APIError(
        httpStatus.INTERNAL_SERVER_ERROR,
        codes.INTERNAL_ERROR,
        `something awful happened`
      );
    }
  }
  reply.statusCode = httpStatus.CREATED;
  return products.map((p) => {
    return { rid: p._id };
  });
}

async function readProduct(req, reply) {
  const mongo = reply.routeOptions.config.mongo;
  const rid = req.params.rid;
  const products = await mongo
    .db("legados-collector")
    .collection("products")
    .find({ _id: rid })
    .toArray();
  if (products.length == 0) {
    throw new APIError(
      httpStatus.NOT_FOUND,
      codes.INVALID_products,
      `products ${rid} not found`
    );
  }
  reply.statusCode = httpStatus.OK;
  products[0].rid = products[0]._id;
  delete products[0]._id;
  return products[0];
}

export default {
  readProducts: readProducts,
  createProducts: createProducts,
  readProduct: readProduct,
};
