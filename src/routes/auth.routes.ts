import * as bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { User } from "../models/user.model";

// TODO: Figure out how to not break stuff when exporting both the routes function and the IAccessToken interface. Will dupe for now.
export interface IAccessToken {
    sub: mongoose.Types.ObjectId;
    username: string;
    exp: number;
    iat: number;
    sid: mongoose.Types.ObjectId;
}

export interface IRefreshToken {
    sid: mongoose.Types.ObjectId;
}

interface IPasswordResetBody {
    username: string;
}
interface ILoginBody {
    username: string;
    password: string;
}
interface ISignupBody {
    displayName: string;
    username: string;
    email: string;
    pronouns: string;
    password: string;
}

async function routes(server: FastifyInstance, options: Object) {
    // Create a new account
    server.post<{ Body: ISignupBody }>(
        "/signup",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["displayName", "username", "email", "password", "confirmPassword"],
                    properties: {
                        displayName: { type: "string", minLength: 3, maxLength: 64 },
                        username: { type: "string", minLength: 3, maxLength: 16 },
                        email: { type: "string", format: "email" },
                        pronouns: { type: "string" },
                        password: { type: "string", minLength: 8 },
                        confirmPassword: { type: "string", minLength: 8}, // You may add custom validation for password confirmation
                    },
                },
            },
        },
        async (request, reply) => {
            const { displayName, username, email, pronouns, password } = request.body;

            if (await User.exists({email})) {
                return reply.code(409).send({ error: "This email has already been used." });
            }
            if (await User.exists({username})) {
                return reply.code(409).send({error: "This username is not available."});
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = new User({
                displayName,
                username,
                email: email.toLowerCase(),
                pronouns: pronouns ?? "",
                isActive: false,
                password: hashedPassword
            });
            await newUser.save();
            return reply.send({success: true, newUser});
        }
    );

    // Login
    server.post<{Body: ILoginBody}>(
        "/login",
        async (request, reply) => {
            const { username, password } = request.body
            const matchedUser = await User.findOne({$or: [{"username": username}, {"email": username}]});
            if (!matchedUser) {
               return reply.send("Wrong username or password.");
            }
            if(!matchedUser.isActive) {
               return reply.send("This account is not active yet.");
            }
            const passwordMatch = await bcrypt.compare(password, matchedUser.password);
            if(!passwordMatch) {
                return reply.send("Wrong username or password.");
            }

            const sessionId = new mongoose.Types.ObjectId();
            const accessTokenPayload: IAccessToken = {
                sub: matchedUser._id,
                username: username,
                exp: Math.floor(Date.now() / 1000) + 60 * 10,
                iat: Math.floor(Date.now() / 1000),
                sid: sessionId,
            };
            const refreshTokenPayload : IRefreshToken = {sid: sessionId};
            const accessToken = server.jwt.sign(accessTokenPayload, {
                expiresIn: '5m',
            });
            const refreshToken = server.jwt.sign(refreshTokenPayload, {
                expiresIn: '1y',
            })
            return reply.send({accessToken: accessToken, refreshToken: refreshToken});
        });

    // Forgot password
    server.post<{Body: IPasswordResetBody}>(
        "/forgot",
        async (request, reply) => {
            const { username } = request.body;
            const userToReset = await User.findOne({$or:[{username: username}, {email: username}]});
            if (userToReset) {
                const token = server.jwt.sign({ sub: userToReset._id }, {
                    expiresIn: '30m',
                });
                //TODO: Send email with token instead of sending it in the reply.
                return reply.send({token});
            } else {
                return reply.code(400).send("User not found.");
            }
        }
    )
}
module.exports = routes;