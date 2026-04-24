const categoryService = require('../services/categoryService');
const { success, created } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll(req.user.id);
    success(res, { categories });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.user.id, req.body);
    created(res, { category }, 'Category created');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.user.id, req.body);
    success(res, { category }, 'Category updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id, req.user.id);
    success(res, null, 'Category deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
