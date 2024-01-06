import Joi from "joi";

const itemModel = Joi.object({
  groupName: Joi.string().required(),
  name: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  cost: Joi.number().min(0).required(),
});

export default itemModel;
