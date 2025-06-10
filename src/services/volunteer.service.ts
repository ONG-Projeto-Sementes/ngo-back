import { BaseService } from "../core/base-service/index.js";
import { IVolunteer, VolunteerModel } from "../models/volunteer.js";

export class VolunteerService extends BaseService<IVolunteer> {
  constructor() {
    super(VolunteerModel);
  }
}

export default new VolunteerService();
