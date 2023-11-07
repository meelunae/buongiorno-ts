import { FastifyInstance } from "fastify";
import { IUserDetails, ILeaderboardUser, User } from "../models/user.model";

interface IAuthToken {
    sub: string,
    username: string,
    exp: number,
    iat: number,
}

interface IUserRequest {
    username: string;
}
async function routes(server: FastifyInstance, options: Object) {
    server.get("/", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const userInfo = await User.findOne({"_id": authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({"error": "This authentication token does not belong to an existing user."});
            }
            return reply.send({userInfo});
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });
    server.get<{ Params: IUserRequest}>("/:username", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const userInfo = await User.findOne({"_id": authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({"error": "This authentication token does not belong to an existing user."});
            }
            const { username } = request.params;
            const fetchedUser = await User.findOne({username});
            if (!fetchedUser) {
                return reply.status(400).send({"error": "This user does not exist."});
            }
            const userDetails: IUserDetails = {
                id: fetchedUser._id,
                profilePicture: fetchedUser.profilePicture,
                username: fetchedUser.username,
                displayName: fetchedUser.displayName,
                pronouns: fetchedUser.pronouns,
                bio: fetchedUser.bio,
                score: fetchedUser.score,
                friends: 0,
            }
            return reply.send({userDetails});
        } catch (err) {
            return reply.status(401).send({err});
        }
    })
}
module.exports = routes;