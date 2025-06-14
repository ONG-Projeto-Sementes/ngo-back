import express from "express";
import {
  deleteBeneficiary,
  getBeneficiaries,
  updateBeneficiary,
  getBeneficiaryById,
} from "../controllers/beneficiary.controller.js";

export default (router: express.Router) => {
  router.get("/beneficiaries", getBeneficiaries);
  router.get("/beneficiaries/:id", getBeneficiaryById);
  router.put("/beneficiaries/:id", updateBeneficiary);
  router.delete("/beneficiaries/:id", deleteBeneficiary);
};
