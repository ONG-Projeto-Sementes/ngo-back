import mongoose from "mongoose";
const DonationCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: { type: String, trim: true },
    defaultUnit: {
        type: String,
        required: true,
        trim: true
    },
    icon: { type: String },
    color: {
        type: String,
        match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        default: '#6B7280'
    },
    isActive: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
export const DonationCategoryModel = mongoose.model('DonationCategory', DonationCategorySchema);
