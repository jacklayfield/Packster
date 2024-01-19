import Joi from "joi";

const groupModel = Joi.object({
  name: Joi.string().required(),
  date: Joi.date(),
  budget: Joi.number().min(0),
  budgetUsed: Joi.number().min(0),
});

export default groupModel;
