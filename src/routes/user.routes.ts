import { FastifyInstance } from "fastify";
import { IUserDetails, User } from "../models/user.model";
import mongoose from "mongoose";
import {IAccessToken} from "./auth.routes";

interface IProfileEditRequest {
    displayName: string;
    pronouns: string;
    bio: string;
}
interface IUserRequest {
    username: string;
}
async function routes(server: FastifyInstance, options: Object) {
    // Get logged in user info
    server.get("/", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAccessToken;
            const userInfo = await User.findOne({_id: authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            return reply.send({success: true, data: userInfo});
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Get user profile details for a specific user
    server.get<{ Params: IUserRequest}>("/:username", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAccessToken;
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
                friendRequestPending: fetchedUser.friendRequests.includes(new mongoose.Types.ObjectId(authedUser.sub)),
            }
            return reply.send({success: true, data: userDetails});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })

    // Patch profile info for logged-in user (display name, bio, pronouns)
    server.patch<{ Body: IProfileEditRequest }>("/", async (request, reply) => {
        try {
            await request.jwtVerify();
            const authedUser = request.user as IAccessToken;
            const { displayName, pronouns, bio } = request.body;
            const userInfo = await User.findOne({_id: authedUser.sub});
            if (!userInfo) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            userInfo.displayName = displayName;
            userInfo.pronouns = pronouns;
            userInfo.bio = bio;
            await userInfo.save();
            return reply.send({success: true, data: userInfo});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })
}
module.exports = routes;