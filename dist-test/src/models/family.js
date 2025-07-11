import mongoose from "mongoose";
const FamilySchema = new mongoose.Schema({
    city: { type: String, required: true },
    neighborhood: { type: String, required: true },
    contact: { type: String },
    address: { type: String },
    name: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
export const FamilyModel = mongoose.model('Family', FamilySchema);
