import mongoose from "mongoose";

interface UserModelInterface extends mongoose.Model<IUser> {
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
    },
    email: {
        type: String,
        required: true,
    },
    pronouns: {
        type: String,
        default: ""
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
const User = mongoose.model<IUser, UserModelInterface>('User', userSchema);
// Define a static method to create new user documents
userSchema.statics.build = (attr: IUser) => {
    return new User(attr);
};

export { User }