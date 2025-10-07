import { SnowflakeId } from "@akashrajpurohit/snowflake-id";
import fastify from "fastify";
import fs from "fs/promises";
import endpoints from "./lib/endpoints.js";
import { APIError } from "./lib/error.js";
import httpStatus from "http-status-codes";
import is from "is";
import { MongoClient } from "mongodb";

async function setupMongo() {
  const client = new MongoClient("mongodb://localhost:27017?timeoutMS=10000");
  await client.connect();
  return client;
}

function createServer(cfg) {
  const snowflakeId = SnowflakeId();
  const opts = {
    config: { snowflakeId: snowflakeId, mongo: cfg.mongo },
  };

  const server = fastify({
    logger: {
      level: cfg.log.level ?? "info",
      transport: {
        target: "pino/file",
        options: { destination: 1 },
      },
    },
  });

  server.removeContentTypeParser(["text/plain"]);
  server.setErrorHandler((err, req, reply) => {
    if (is.instance(err, APIError)) {
      reply.statusCode = err.status;
      reply.send(err.toJSON());
    } else {
      reply.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      reply.send({
        code: "0",
        message: err.message,
      });
    }
  });

  server.get("/", endpoints.home);
  server.get("/users", opts, endpoints.readUsers);
  server.post("/user", opts, endpoints.createUser);
  server.get("/user/:rid", opts, endpoints.readUser);
  server.get("/products", opts, endpoints.readProducts);
  server.post("/product", opts, endpoints.createProduct);
  server.get("/product/:rid", opts, endpoints.readProduct);

  return server;
}

async function main() {
  const cfg = JSON.parse(await fs.readFile("etc/config.json"));
  try {
    cfg.mongo = await setupMongo();
  } catch (err) {
    server.log.error(err);
    return;
  }
  const server = createServer(cfg);

  try {
    await server.listen({ port: cfg.server.port ?? 8080 });
    server.log.info(`listening at ${cfg.server.port}`);
  } catch (err) {
    server.log.error(err);
    return;
  }
}

await main();
