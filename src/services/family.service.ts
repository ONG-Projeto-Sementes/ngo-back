import { BaseService } from "../core/base-service/index.js";
import { IFamily, FamilyModel } from "../models/family.js";

export class FamilyService extends BaseService<IFamily> {
  constructor() {
    super(FamilyModel);
  }
}

export default new FamilyService();
