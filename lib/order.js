import httpStatus from "http-status-codes";
import is from "is";
import { APIError, codes } from "./error.js";

function validateOrders(snowflake, body) {
  //requisitos para validar
  if (is.undefined(body)) {
    //si no tiene el body definido te saltara
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_ORDER,
      "body is mandatory" //este mensaje
    );
  }
  if (!is.array(body)) {
    //si el body no es un array te saltara
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_ORDER,
      "body must be an array" //este mensaje
    );
  }
  var orders = []; //si la orden no lleva nombre te saldra
  for (var i = 0; i < body.length; i++) {
    if (is.undefined(body[i].name)) {
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_ORDER,
        "name is mandatory" //este mensaje
      );
    }
    if (is.undefined(body[i].address)) {
      //si no pones una direccion te saldra
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_ORDER,
        "address is mandatory" //este mensaje
      );
    }
    if (is.undefined(body[i].payMethod)) {
      //si no pones un metodo de pago te saldra
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_ORDER,
        "pay Method is mandatory"
      );
    }
    orders.push({
      _id: snowflake.generate(),
      name: body[i].name,
      address: body[i].address,
      payMethod: body[i].payMethod,
    });
  }
  return orders; //manda la orden y empieza el createOrder
}

async function readOrders(req, reply) {
  const mongo = reply.routeOptions.config.mongo; //necesito el producto de mongo
  const orders = await mongo
    .db("legados-collector") //entro e la db
    .collection("orders") // a la seccion productos
    .find({}) //si lo encuentro
    .toArray(); //me manda array en cada producto
  return orders.map((o) => {
    o.rid = o._id;
    delete o._id;
    return o;
  });
}

async function createOrders(req, reply) {
  const snowflakeId = reply.routeOptions.config.snowflakeId;
  const mongo = reply.routeOptions.config.mongo;
  const orders = validateOrders(snowflakeId, req.body); //con esto la validas la compra
  try {
    await mongo //con estos tres de abajo accedes
      .db("legados-collector") // accedes a la base de datos
      .collection("orders") // accedes a la coleccion
      .insertMany(orders); //con esto puedes crear varios a la vez
  } catch (err) {
    //errores
    if (err.msg.includes("duplicate")) {
      //si la orden esta duplicada
      for (const [_, id] of objects.entries(err.result.insertIds)) {
        //verificada por el id
        await mongo
          .db("legados-collector")
          .collection("createOrder")
          .deleteOne({ _id: id }); //si esta repetido no se refleja en la DB y te hace un
      }
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_ORDER,
        err.errmsg
      );
    } else {
      // si es un fallo de la base de datos
      req.log.error(err);
      throw new APIError(
        httpStatus.INTERNAL_SERVER_ERROR,
        codes.INTERNAL_ERROR,
        `some awfull happened` //te pondra este error
      );
    }
  }
  reply.statusCode = httpStatus.CREATED;
  return orders.map((p) => {
    return { rid: p._id };
  });
}
async function readOrder(req, reply) {
  const mongo = reply.routeOptions.config.mongo;
  const rid = req.params.rid;
  // aqui leemos la oden de compra
  const orders = await mongo
    .db("legados-collector") // si sigue estos pasos
    .collection("orders")
    .find({ _id: rid })
    .toArray();

  if (orders.length == 0) {
    // pero es == 0 te saldra
    throw new APIError(
      httpStatus.NOT_FOUND,
      codes.INVALID_ORDER,
      `order ${rid} not found`
    );
  }
  reply.statusCode = httpStatus.OK;
  orders[0].rid = orders[0]._id;
  delete orders[0]._id;
  return orders[0];
}
export default {
  readOrders: readOrders,
  createOrders: createOrders,
  readOrder: readOrder,
};
