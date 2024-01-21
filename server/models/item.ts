import Joi from "joi";

const itemModel = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  cost: Joi.number().min(0).required(),
  usersBringing: Joi.array().items(Joi.string()),
  usersExempted: Joi.array().items(Joi.string()),
  required: Joi.boolean(),
  groupId: Joi.string().required(),
});

export default itemModel;
