import React from "react";
import { Pagination } from "semantic-ui-react";
import PropTypes from "prop-types";

export const SmallPagination = ({
  currentPage,
  totalResults,
  currentSize,
  onPageChange,
  maxTotalResults = 10000,
}) => {
  const maxTotalPages = Math.floor(maxTotalResults / currentSize);
  const pages = Math.ceil(totalResults / currentSize);
  const totalDisplayedPages = Math.min(pages, maxTotalPages);
  return (
    <Pagination
      activePage={currentPage}
      size="tiny"
      totalPages={totalDisplayedPages}
      firstItem={null}
      lastItem={null}
      boundaryRange={0}
      siblingRange={3}
      onPageChange={(_, { activePage }) => onPageChange(activePage)}
    />
  );
};

SmallPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalResults: PropTypes.number.isRequired,
  currentSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  maxTotalResults: PropTypes.number,
};
