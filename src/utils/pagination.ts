// Pagination helper for list endpoints.
// Parses page/limit from query params and caps the limit at 100.

export const parsePagination = (query: Record<string, unknown>) => {
  let page = Number(query.page) || 1;
  let limit = Number(query.limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};
