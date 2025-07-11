import mongoose from "mongoose";
const DonationDistributionSchema = new mongoose.Schema({
    donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    distributionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: { type: String },
    distributedBy: { type: String },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Índices para otimizar consultas
DonationDistributionSchema.index({ donationId: 1, familyId: 1 });
DonationDistributionSchema.index({ familyId: 1, distributionDate: -1 });
DonationDistributionSchema.index({ donationId: 1 });
export const DonationDistributionModel = mongoose.model('DonationDistribution', DonationDistributionSchema);
