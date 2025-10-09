import httpStatus from "http-status-codes";
import { APIError, codes } from "./error.js";
import is from "is";

function validateUser(snowflakeId, body) {
  if (is.undefined(body)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "body is mandatory"
    );
  }
  if (!is.object(body)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "body must be an object"
    );
  }
  if (is.undefined(body.firstName)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "first name is mandatory"
    );
  }
  if (is.undefined(body.lastName)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "last name is mandatory"
    );
  }
  if (is.undefined(body.email)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      codes.INVALID_USER,
      "email is mandatory"
    );
  }
  if (is.undefined(body.address)) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      ccodes.INVALID_USER,
      "address is mandatory"
    );
  }
  return {
    _id: snowflakeId.generate(),
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    address: body.address,
  };
}

async function readUsers(req, reply) {
  const mongo = reply.routeOptions.config.mongo;
  const users = await mongo
    .db("legados-collector")
    .collection("users")
    .find({})
    .toArray();
  return users.map((u) => {
    delete u._id;
    return u;
  });
}

async function createUser(req, reply) {
  const snowflakeId = reply.routeOptions.config.snowflakeId;
  const mongo = reply.routeOptions.config.mongo;

  const user = validateUser(snowflakeId, req.body); //crear usuario
  try {
    await mongo.db("legados-collector").collection("users").insertOne(user); // si va entrar en base de datos entrar en la coleccion usuarios
  } catch (err) {
    //si no, ha pasado validacion
    if (err.errmsg.includes("duplicate")) {
      throw new APIError(
        httpStatus.BAD_REQUEST,
        codes.INVALID_USER,
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
  return { rid: user._id };
}

async function readUser(req, reply) {
  const mongo = reply.routeOptions.config.mongo;
  const rid = req.params.rid;
  const users = await mongo
    .db("legados-collector")
    .collection("users")
    .find({ _id: rid })
    .toArray();
  if (users.length == 0) {
    throw new APIError(
      httpStatus.NOT_FOUND,
      codes.INVALID_USER,
      `user ${rid} not found`
    );
  }
  users[0].rid = users[0]._id;
  delete users[0]._id;
  return users[0];
}

export default {
  readUsers: readUsers,
  createUser: createUser,
  readUser: readUser,
};
