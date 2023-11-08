import { FastifyInstance } from "fastify";
import { IAuthToken, IFriend, User } from "../models/user.model";
import mongoose from "mongoose";


interface IFriendRequestParams {
    id : string;
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
            const friendIndex = initiatingUser.friends.findIndex((friend) => friend.friendId.toString() === id);
            if (friendIndex !== -1) {
                initiatingUser.friends.splice(friendIndex, 1);
                await initiatingUser.save();
                return reply.send({success: true, message: `Friend successfully removed.`});
            }
            const newFriend : IFriend = { friendId: new mongoose.Types.ObjectId(id), friendsSince: new Date(), lastBuongiornoTime: new Date(0)};
            initiatingUser.friends.push(newFriend);
            await initiatingUser.save();
            return reply.send({success: true, message: `Friend successfully added.`});
        } catch (err) {
            return reply.status(401).send({success: false, error: "Unauthorized."});
        }
    })
}

module.exports = routes;