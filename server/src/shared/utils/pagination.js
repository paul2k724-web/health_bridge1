import { PAGINATION } from '../../config/constants.js';

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getSortParams = (query, defaultSort = { createdAt: -1 }) => {
  const { sortBy, sortOrder } = query;

  if (!sortBy) {
    return defaultSort;
  }

  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

const getSearchFilter = (query, searchableFields = []) => {
  const { search } = query;

  if (!search || searchableFields.length === 0) {
    return {};
  }

  const searchRegex = new RegExp(search, 'i');
  const orConditions = searchableFields.map((field) => ({
    [field]: searchRegex,
  }));

  return { $or: orConditions };
};

const getDateRangeFilter = (query, field = 'createdAt') => {
  const { startDate, endDate } = query;
  const filter = {};

  if (startDate) {
    filter[field] = { $gte: new Date(startDate) };
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter[field] = { ...filter[field], $lte: end };
  }

  return filter;
};

const buildFilter = (...filters) => {
  return Object.assign({}, ...filters);
};

export {
  getPaginationParams,
  getSortParams,
  getSearchFilter,
  getDateRangeFilter,
  buildFilter,
};

export default {
  getPaginationParams,
  getSortParams,
  getSearchFilter,
  getDateRangeFilter,
  buildFilter,
};
