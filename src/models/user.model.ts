import mongoose from "mongoose";

interface UserModelInterface extends mongoose.Model<any> {
    build(attr: IUser): any
}
interface IUser {
    profilePicture: string;
    displayName: string;
    username: string;
    email: string;
    pronouns: string;
    bio: string;
    password: string;
    isActive: boolean;
    score: number;
}

const userSchema = new mongoose.Schema({
    profilePicture: {
        type: String,
        required: true,
        default: "" // to be set
    },
    displayName: {
        type: String,
        required: true,
        // max 64 chars?
    },
    username: {
        type: String,
        required: true,
        // min 3 chars, max 16 chars
    },
    email: {
        type: String,
        required: true,
        // verify it is a valid email
    },
    pronouns: {
        type: String,
    },
    bio: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true,
        // store bcrypt hash
    },
    isActive: {
        type: Boolean,
        required: true,
    },
    score: {
        type: Number,
        default: 0
    },
}, { timestamps: true })
const User = mongoose.model<any, UserModelInterface>('User', userSchema);
export { User }