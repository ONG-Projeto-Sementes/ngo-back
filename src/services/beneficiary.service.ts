import { BaseService } from "../core/base-service/index.js";
import { IBeneficiary, BeneficiaryModel } from "../models/beneficiary.js";

export class BeneficiaryService extends BaseService<IBeneficiary> {
  constructor() {
    super(BeneficiaryModel);
  }
}

export default new BeneficiaryService();
