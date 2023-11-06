import * as bcrypt from "bcrypt";
import {FastifyInstance} from "fastify";
import { User } from "../models/user.model";
import * as jwt from "jsonwebtoken";

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
    confirmPassword: string;
}

async function routes(server: FastifyInstance, options: Object) {
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
            const { displayName, username, email, pronouns, password, confirmPassword } = request.body;
            if (password !== confirmPassword) {
                return reply.code(400).send({ error: "Password and Confirm Password fields do not match." });
            }
            const matchedUsername = await User.findOne({username});
            const matchedEmail = await User.findOne({email});
            if (matchedUsername) {
                return reply.code(400).send({ error: "This username is not available." });
            }
            if (matchedEmail) {
                return reply.code(400).send({ error: "This email has already been used." });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = new User({
                displayName,
                username,
                email: email.toLowerCase(),
                pronouns: pronouns || "",
                isActive: false,
                password: hashedPassword
            });
            await newUser.save();
            return reply.send({"success": true, newUser});
        }
    );

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

            const tokenPayload = {
                sub: matchedUser._id,
                username: username,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
                iat: Math.floor(Date.now() / 1000)
            }
            const tokenSecretKey = process.env.JWT_SECRET!; // force unwrap to be removed
            const token = jwt.sign(tokenPayload, tokenSecretKey);

            return reply.send({"token": token, "iat": tokenPayload.iat});
        });
};
module.exports = routes;