import {FastifyInstance, } from "fastify";
import { User } from "../models/user.model";

interface IAuthToken {
    sub: string,
    username: string,
    exp: number,
    iat: number,
}
async function routes(server: FastifyInstance, options: Object) {
    server.get("/",async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            console.log(authedUser.sub);
            const userInfo = await User.findOne({"_id": authedUser.sub});
            return reply.send({userInfo});
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });
}
module.exports = routes;