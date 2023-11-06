import {FastifyReply, FastifyRequest} from "fastify";

// const User = require("../models/user.model");

module.exports = {
   // create: async (req, res) => { return "Hello world!" },
    get: async (request: FastifyRequest, reply: FastifyReply) => {
        reply.send({ hello: 'world' });
    }
};