import express from "express";
import {
  createBeneficiaryByFamilyId,
  createFamily,
  getAllFamilies,
  getFamilyById,
  deleteFamily,
  getBeneficiariesByFamilyId,
  updateFamily,
  getFamilyDonationHistory,
} from "../controllers/family.controller.js";

export default (router: express.Router) => {
  router.get("/families", getAllFamilies);
  router.get("/families/:id", getFamilyById);
  router.post("/families", createFamily);
  router.put("/families/:id", updateFamily);
  router.delete("/families/:id", deleteFamily);

  router.get("/families/:id/beneficiaries", getBeneficiariesByFamilyId);
  router.post("/families/:id/beneficiaries", createBeneficiaryByFamilyId);
  router.get("/families/:id/donation-history", getFamilyDonationHistory);
};
