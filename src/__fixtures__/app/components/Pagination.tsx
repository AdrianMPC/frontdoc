/** One page link. */
const PaginationItem = ({ page }: { /** Page number */ page: number }) => <a href={`#${page}`}>{page}</a>

export const Pagination = { Item: PaginationItem }
