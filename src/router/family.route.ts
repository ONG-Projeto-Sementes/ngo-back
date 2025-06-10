import express from "express";
import { createBeneficiaryByFamilyId, createFamily, getAllFamilies } from "../controllers/family.controller.js";

export default (router: express.Router) => {
  router.get("/families", getAllFamilies);
  router.post("/families", createFamily);

  router.post("/families/:familyId/beneficiaries", createBeneficiaryByFamilyId);
};
