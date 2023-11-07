import mongoose from "mongoose";

interface UserModelInterface extends mongoose.Model<IFriend> {
    build(attr: IFriend): any
}

interface IFriend {
    friend_id: mongoose.Schema.Types.ObjectId;
    lastBuongiornoTime: Date;
    friendsSince: Date;
}

const friendSchema = new mongoose.Schema({
    friend_id: {
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
const Friend = mongoose.model<IFriend, UserModelInterface>('Friend', friendSchema);
friendSchema.statics.build = (attr: IFriend) => {
    return new Friend(attr);
};

export { Friend, IFriend }