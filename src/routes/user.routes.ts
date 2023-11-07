import { FastifyInstance } from "fastify";
import { IUserDetails, ILeaderboardUser, User } from "../models/user.model";

interface IAuthToken {
    sub: string;
    username: string;
    exp: number;
    iat: number;
}

interface IProfileEditRequest {
    displayName: string;
    pronouns: string;
    bio: string;
}
interface IUserRequest {
    username: string;
}
async function routes(server: FastifyInstance, options: Object) {
    server.get("/", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const userInfo = await User.findOne({_id: authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            return reply.send({success: true, data: userInfo});
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    server.get<{ Params: IUserRequest}>("/:username", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            if (!await User.exists({_id: authedUser.sub})) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            const { username } = request.params;
            const fetchedUser = await User.findOne({username});
            if (!fetchedUser) {
                return reply.status(400).send({success: false, error: "This user does not exist."});
            }
            const userDetails: IUserDetails = {
                _id: fetchedUser._id,
                profilePicture: fetchedUser.profilePicture,
                username: fetchedUser.username,
                displayName: fetchedUser.displayName,
                pronouns: fetchedUser.pronouns,
                bio: fetchedUser.bio,
                score: fetchedUser.score,
                friends: fetchedUser.friends.length,
            }
            return reply.send({success: true, data: userDetails});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })
    server.patch<{ Body: IProfileEditRequest }>("/", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const { displayName, pronouns, bio } = request.body;
            const userInfo = await User.findOne({_id: authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            userInfo.displayName = displayName;
            userInfo.pronouns = pronouns;
            userInfo.bio = bio;
            await userInfo.save();
            userInfo.friends = userInfo.friends
            return reply.send({success: true, data: userInfo});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })
}
module.exports = routes;