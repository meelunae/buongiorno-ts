import { FastifyInstance } from "fastify";
import { IAuthToken, ILeaderboardUser, User } from "../models/user.model";

interface IBuongiornoRequestParams {
    id : string;
}
async function routes(server: FastifyInstance, options: Object) {
    server.get("/leaderboard", async (request, reply) => {
        try {
            var rankings: ILeaderboardUser[] = [];
            await request.jwtVerify();
            const authedUser = request.user as IAuthToken;
            if (!await User.exists({_id: authedUser.sub})) {
                return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
            }
            const users = await User.find()
                .select('profilePicture username score')
                .sort({ score: -1 })
                .exec();
            users.forEach((u, index) => {
                rankings.push({
                    _id: u._id,
                    profilePicture: u.profilePicture,
                    username: u.username,
                    score: u.score,
                    placement: index+1
                });
            });
            return reply.send({success: true, data: rankings});
        } catch (err) {
            return reply.status(401).send({success: false, error: 'Unauthorized' });
        }
    })
    server.post<{Params: IBuongiornoRequestParams}>("/:id", async (request, reply) => {
        const { id } = request.params;
        await request.jwtVerify();
        const authedUser = request.user as IAuthToken;
        const initiatingUser = await User.findOne({_id: authedUser.sub});
        const targetUser = await User.findOne({_id: id});
        if (!initiatingUser) {
            return reply.status(401).send({success: false, error: "This authentication token does not belong to an existing user."});
        }
        if (!targetUser) {
            return reply.status(401).send({success: false, error: "This user does not exist."});
        }
        if (id === authedUser.sub) {
            return reply.status(400).send({success: false, error: "You cannot send a Buongiorno to yourself."});
        }
        const friend = initiatingUser.friends.find((friend) => friend.friend_id.toString() === id);
        if (!friend) {
            return reply.status(400).send({success: false, error: "You can only say Buongiorno to someone you have added as a friend."});
        }
        const currentTime = new Date();
        const twentyFourHoursAgo = new Date(currentTime.getTime() - 60 * 60 * 24 * 1000);
        if (twentyFourHoursAgo < new Date(friend.lastBuongiornoTime)) {
            return reply.status(400).send({success: false, error: `You have to wait 24 hours before wishing @${targetUser.username} Buongiorno again`});
        }
        const friendIndex = initiatingUser.friends.findIndex((friend) => friend.friend_id.toString() === id);
        initiatingUser.friends[friendIndex].lastBuongiornoTime = currentTime;
        initiatingUser.score += 2;
        targetUser.score += 1;
        await initiatingUser.save();
        await targetUser.save();
        return reply.send({success: true, message: `Successfully sent a Buongiorno to ${targetUser.username}`});
    })
}



module.exports = routes;