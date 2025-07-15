const Joi = require("joi");

const userSignupSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),

  first_name: Joi.string().required().trim(),

  last_name: Joi.string().required().trim(),

  institute: Joi.string().required().trim(),

  grade: Joi.string()
    .valid("below10", "10-12", "graduation", "postgraduation", "other")
    .required(),

  password: Joi.string().min(8).required(),

  confirm_password: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Passwords do not match." }),
});

module.exports = {
  userSignupSchema,
};
