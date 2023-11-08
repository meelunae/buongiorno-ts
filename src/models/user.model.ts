import mongoose from "mongoose";

interface IAuthToken {
    sub: string;
    username: string;
    exp: number;
    iat: number;
}
interface ILeaderboardUser {
    _id: mongoose.default.Types.ObjectId;
    profilePicture: string;
    username: string;
    score: number;
    placement: number;
}

interface IUserDetails {
    _id: mongoose.default.Types.ObjectId;
    profilePicture: string;
    username: string;
    displayName: string;
    pronouns: string;
    bio: string;
    score: number;
    friends: number;
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
    friends: [IFriend];
}
interface UserModelInterface extends mongoose.Model<IUser> {
    build(attr: IUser): any
}
interface IFriend {
    friendId: mongoose.Types.ObjectId;
    lastBuongiornoTime: Date;
    friendsSince: Date;
}

const friendSchema = new mongoose.Schema({
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lastBuongiornoTime: {
        type: Date
    },
    friendsSince: {
        type: Date
    },
}, { timestamps: false })

const userSchema = new mongoose.Schema({
    profilePicture: {
        type: String,
        default: "" // to be set
    },
    displayName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9_]*$/, 'Please enter a valid username']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
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
        trim: true,
    },
    isActive: {
        type: Boolean,
        required: true,
    },
    score: {
        type: Number,
        default: 0
    },
    friends: {
        type: [friendSchema],
        default: [],
    },
}, { timestamps: true })
const User = mongoose.model<IUser, UserModelInterface>('User', userSchema);

userSchema.statics.build = (attr: IUser) => {
    return new User(attr);
};

export { IAuthToken, ILeaderboardUser, IFriend, IUserDetails, User }