import fastifyCors from "@fastify/cors";
import dotenv from "dotenv";
import {fastify, FastifyReply, FastifyRequest} from "fastify";
import fastifyJwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import * as mongoose from "mongoose";
import pino from "pino";
import { checkRequiredEnvVariables } from "./config/environment.conf";
import {IAccessToken } from "./routes/auth.routes";
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

server.listen({ port, host: "0.0.0.0" })
    .then((address) => console.log(`server listening on ${address}`))
    .catch(err => {
        server.log.error(`Error starting server: ${err}`);
        process.exit(1);
    });
server.register(fastifyJwt, {
    secret: `${process.env.JWT_SECRET}`
});
server.register(fastifyCors);
server.register(helmet);
server.register(userRoutes, {prefix: "/api/user"});
server.register(authRoutes, {prefix: "/api/auth"});
server.register(buongiornoRoutes, {prefix: "/api/buongiorno"});
server.register(friendRoutes, {prefix: "/api/friends"});
server.addHook("onRequest", async function auth(request: FastifyRequest, reply: FastifyReply) {
    try {
        if (request.url === "/api/auth/login" || request.url === "/api/auth/signup") return;
        await request.jwtVerify({ignoreExpiration: true});
        const refreshToken = request.headers["bg-refresh-token"] as string;
        if (!refreshToken) {
            return reply.status(401).send({success: false, error: "Refresh token not valid."});
        }
        server.jwt.verify(refreshToken);
        const tokenPayload = request.user as IAccessToken;
        const expirationDate = new Date(tokenPayload.exp * 1000); // converting to milliseconds
        const currentDate = new Date();
        // Check if token has expired to issue a new one
        if (currentDate > expirationDate && refreshToken) {
            tokenPayload.exp = Math.floor(Date.now() / 1000) + (60 * 10);
            const accessToken = server.jwt.sign(tokenPayload, {
                expiresIn: '10m',
            });
            return reply.send({accessToken});
        }
    } catch (err) {
        return reply.status(401).send({success: false, error: err});
    }
});



mongoose.connect(databaseURI)
    .then(() => server.log.info({actor: "MongoDB"}, "Connected."))
    .catch((err) => {
        server.log.error({actor: "MongoDB"},`Error during connection: ${err}`);
        process.exit(1);
    });