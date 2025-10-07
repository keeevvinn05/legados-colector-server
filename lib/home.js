import httpStatus from "http-status-codes";
import fs from "fs/promises";

async function home(req, reply) {
  const pkg = JSON.parse(await fs.readFile("./package.json"));
  reply.statusCode = httpStatus.OK;
  reply.send({
    name: pkg.name,
    version: pkg.version,
  });
}

export default {
  home: home,
};
