import dotenv from "dotenv";
import { fastify } from "fastify";
import * as mongoose from "mongoose";
import pino from "pino";

dotenv.config();
const databaseURI = `${process.env.MONGO_URI}`;
const port = parseInt(process.env.PORT || "1337");
const server = fastify({
    logger: pino({level : "info"})
});
const userRoutes = require("./routes/user.routes");

server.listen({ port })
    .then((address) => console.log(`server listening on ${address}`))
    .catch(err => {
        server.log.error(`Error starting server: ${err}`);
        process.exit(1);
    });
server.register(userRoutes, {prefix: "/api/user"});

mongoose.connect(databaseURI)
    .then(() => server.log.info({actor: "MongoDB"}, "Connected."))
    .catch((err) => {
        server.log.error({actor: "MongoDB"},`Error during connection: ${err}`);
        process.exit(1);
    });