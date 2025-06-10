import { BaseService } from "../core/base-service/index.js";
import { IDonation, DonationModel } from "../models/donation.js";

export class DonationService extends BaseService<IDonation> {
  constructor() {
    super(DonationModel);
  }
}

export default new DonationService();
