import mongoose from "mongoose";

export async function connection(callback: () => void) {
    try {
        await mongoose.connect(process.env.MONGO_URL || "");
        console.log("connected");
        callback();
    } catch (error) {
        console.log(`failed to connect database ${error}`);
    }
}
