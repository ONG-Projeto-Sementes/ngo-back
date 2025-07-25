import mongoose from "mongoose";

export async function connection(callback?: () => void) {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            console.log("⚠️  MONGO_URL not provided - running without database");
            if (callback) callback();
            return;
        }
        
        await mongoose.connect(mongoUrl);
        console.log("✅ Database connected successfully");
        if (callback) callback();
    } catch (error) {
        console.log(`❌ Failed to connect to database: ${error}`);
        console.log("⚠️  Server will continue running without database connection");
        if (callback) callback();
    }
}
