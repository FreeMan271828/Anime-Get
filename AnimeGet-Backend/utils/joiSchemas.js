// utils/joiSchemas.js
const Joi = require('joi');

const animeSchema = Joi.object({
    title_cn: Joi.string().required(),
    title_jp: Joi.string().required(),
    official_site: Joi.string().uri().required(),
    broadcast_day: Joi.number().integer().min(0).max(6).required(),
    broadcast_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    status: Joi.string().valid('PLAN', 'WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED').required(),
    type_id: Joi.number().integer().required(),
    cover_image: Joi.string().allow('').optional()
});

const userRegisterSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required()
});

const userLoginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

module.exports = {
  animeSchema,
  userRegisterSchema,
  userLoginSchema,
};
