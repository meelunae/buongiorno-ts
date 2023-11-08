import dotenv from "dotenv";
import { fastify } from "fastify";
import fastifyJwt, { FastifyJWTOptions } from '@fastify/jwt'
import * as mongoose from "mongoose";
import pino from "pino";
import { checkRequiredEnvVariables } from "./config/environment.conf";
dotenv.config();

const requiredVariables = ["MONGO_URI", "PORT", "JWT_SECRET"];
checkRequiredEnvVariables(requiredVariables);
const databaseURI = `${process.env.MONGO_URI}`;
const port = parseInt(process.env.PORT ?? "1337");
const server = fastify({
    logger: pino({level : "info"})
});
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const buongiornoRoutes = require("./routes/buongiorno.routes");
const friendRoutes = require("./routes/friends.routes");

server.listen({ port })
    .then((address) => console.log(`server listening on ${address}`))
    .catch(err => {
        server.log.error(`Error starting server: ${err}`);
        process.exit(1);
    });
server.register(fastifyJwt, {
    secret: `${process.env.JWT_SECRET}`
})
server.register(userRoutes, {prefix: "/api/user"});
server.register(authRoutes, {prefix: "/api/auth"});
server.register(buongiornoRoutes, {prefix: "/api/buongiorno"});
server.register(friendRoutes, {prefix: "/api/friends"});



mongoose.connect(databaseURI)
    .then(() => server.log.info({actor: "MongoDB"}, "Connected."))
    .catch((err) => {
        server.log.error({actor: "MongoDB"},`Error during connection: ${err}`);
        process.exit(1);
    });