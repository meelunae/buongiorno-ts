import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
//const userController = require("../controllers/user.controller");
async function routes(server: FastifyInstance, options: Object) {
    server.get("/",async (request: FastifyRequest, reply: FastifyReply) => {
        reply.send({ hello: 'world' });
    });
}
module.exports = routes;