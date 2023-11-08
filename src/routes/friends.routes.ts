import { FastifyInstance } from "fastify";
import { IAuthToken, IFriend, User } from "../models/user.model";
import mongoose from "mongoose";


interface IFriendRequestParams {
    id : string;
}

enum FriendRequestAction {
    Reject = 0,
    Accept = 1
}
interface IFriendRequestResponseBody {
    action: FriendRequestAction
}

async function routes(server: FastifyInstance, options: Object) {
    server.get<{Params: IFriendRequestParams}>("/:id", async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {

        }
    })
    server.post<{Params: IFriendRequestParams}>("/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const initiatingUser = await User.findOne({_id: authedUser.sub})
            if (!initiatingUser) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            if (id === authedUser.sub) {
                return reply.status(400).send({success: false, error: "You cannot add yourself as a friend."});
            }
            const targetUser = await User.findOne({_id: id});
            if (!targetUser) {
                return reply.status(400).send({success: false, error: "The user you are trying to add as friend does not exist."});
            }
            const friendIndex = initiatingUser.friendRequests.findIndex((friend) => friend.toString() === id);
            if (friendIndex !== -1) {
                initiatingUser.friendRequests.splice(friendIndex, 1);
                await targetUser.save();
                return reply.send({success: true, message: `Friend request has been cancelled.`});
            }
            targetUser.friendRequests.push(new mongoose.Types.ObjectId(authedUser.sub));
            await targetUser.save();
            return reply.send({success: true, message: `Friend request sent.`});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })

    server.post<{Params: IFriendRequestParams, Body: IFriendRequestResponseBody}>("/response/:id", async (request, reply) => {
        try {
            const { id } = request.params;
            const { action } = request.body;
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            const initiatingUser = await User.findOne({_id: authedUser.sub})
            if (!initiatingUser) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            if (id === authedUser.sub) {
                return reply.status(400).send({success: false, error: "You cannot add yourself as a friend."});
            }
            const targetUser = await User.findOne({_id: id});
            if (!targetUser) {
                return reply.code(400).send({success: false, message: `This user does not exist.`});
            }
            const requestIndex = initiatingUser.friendRequests.findIndex((request) => request.toString() === id);
            // If this returns -1, the user is trying to add someone who does not have an active friend request to them.
            if (requestIndex === -1) {
                return reply.code(400).send({success: false, message: `This user has not sent you a friend request.`});
            }
            // Found the friend request, we proceed on deleting the friend request and adding to friends array mutually if accepted.
            initiatingUser.friendRequests.splice(requestIndex, 1);

            if (action === FriendRequestAction.Accept) {
                initiatingUser.friends.push({friendId: new mongoose.Types.ObjectId(id), lastBuongiornoTime: new Date(0), friendsSince: new Date()})
                targetUser.friends.push({friendId: new mongoose.Types.ObjectId(authedUser.sub), lastBuongiornoTime: new Date(0), friendsSince: new Date()})
                await initiatingUser.save();
                await targetUser.save();
                return reply.send({success: true, message: "The friend request has been accepted."});
            }
            return reply.send({success: true, message: "The friend request has been declined."});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })
}

module.exports = routes;