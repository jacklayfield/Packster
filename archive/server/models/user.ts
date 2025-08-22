import Joi from "joi";

const userModel = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string(),
});

export default userModel;
