// SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React, { useEffect, useRef } from "react";
import { List } from "semantic-ui-react";
import PropTypes from "prop-types";

/**
 * Renders a scrollable list of items and scrolls to the item with `scrollToId`.
 * Each item is `{ id, component }`: `id` is used for keying and scroll tracking,
 * `component` is the rendered content.
 */
export const AutoScrollList = ({ items, scrollToId }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!scrollToId || !containerRef.current) {
      return;
    }

    const item = containerRef.current.querySelector(
      `[data-scroll-id="${CSS.escape(String(scrollToId))}"]`,
    );

    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [scrollToId]);

  return (
    <div ref={containerRef} className="auto-scroll-list">
      <List bulleted relaxed>
        {items.map(({ id, component }) => (
          <List.Item key={String(id)} data-scroll-id={String(id)}>
            {component}
          </List.Item>
        ))}
      </List>
    </div>
  );
};

AutoScrollList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      component: PropTypes.node.isRequired,
    }),
  ).isRequired,
  scrollToId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
