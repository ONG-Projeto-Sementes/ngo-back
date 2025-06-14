import { BaseService } from "../core/base-service/index.js";
import { IFamily, FamilyModel } from "../models/family.js";
import { BeneficiaryService } from "./beneficiary.service.js";

export class FamilyService extends BaseService<IFamily> {
  constructor(private beneficiaryService: BeneficiaryService) {
    super(FamilyModel);
  }

  async deleteOneById(id: string): Promise<IFamily | null> {
    await this.beneficiaryService.updateMany({
      filters: {
        family: id,
      },
      data: {
        $unset: { family: true },
      },
    });

    return super.deleteOne({
      filters: {
        _id: id,
      },
    });
  }
}

const beneficiaryService = new BeneficiaryService();
export default new FamilyService(beneficiaryService);
