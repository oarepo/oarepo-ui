import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import _isEmpty from "lodash/isEmpty";
import Overridable from "react-overridable";
import { withState, ActiveFilters } from "react-searchkit";
import { GridResponsiveSidebarColumn } from "react-invenio-forms";
import { Container, Grid, Button, Label, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  SearchAppFacets,
  SearchAppResultsPane,
  SearchBar,
  SearchConfigurationContext,
} from "@js/invenio_search_ui/components";
import { ResultOptions } from "./ResultOptions";
import { ClearFiltersButton } from "./ClearFiltersButton";
import { ShouldActiveFiltersRender } from "./ShouldActiveFiltersRender";
import { useActiveSearchFilters } from "./hooks";

const ResultOptionsWithState = withState(ResultOptions);

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const handle = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setVisible(window.scrollY > 300);
      });
    };

    window.addEventListener("scroll", handle, { passive: true });

    return () => {
      window.removeEventListener("scroll", handle);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!visible) return null;

  return (
    <Button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      id="scroll-to-top-button"
      icon
      aria-label={i18next.t("Scroll to top")}
      title={i18next.t("Scroll to top")}
    >
      <Icon size="large" name="chevron up" />
    </Button>
  );
};

export const ActiveFiltersCountFloatingLabelComponent = ({
  currentQueryState: { filters },
  className = "active-filters-count-label",
}) => {
  const { activeFiltersCount } = useActiveSearchFilters(filters);

  return (
    activeFiltersCount > 0 && (
      <Label floating circular size="mini" className={className}>
        {activeFiltersCount}
      </Label>
    )
  );
};

ActiveFiltersCountFloatingLabelComponent.propTypes = {
  // eslint-disable-next-line react/require-default-props
  className: PropTypes.string,
  currentQueryState: PropTypes.object.isRequired,
};

export const ActiveFiltersCountFloatingLabel = withState(
  ActiveFiltersCountFloatingLabelComponent
);

export const SearchAppResultsGrid = ({
  columnsAmount,
  facetsAvailable,
  config,
  appName,
  buildUID,
  resultsPaneLayout,
  hasButtonSidebar = false,
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <Grid
      columns={columnsAmount}
      relaxed
      className="search-app rel-mt-2"
      padded
    >
      {facetsAvailable && (
        <GridResponsiveSidebarColumn
          mobile={4}
          tablet={4}
          computer={4}
          largeScreen={4}
          widescreen={4}
          open={sidebarVisible}
          onHideClick={() => setSidebarVisible(false)}
        >
          <ShouldActiveFiltersRender>
            <ClearFiltersButton className="clear-filters-button mobile tablet only" />
          </ShouldActiveFiltersRender>
          <SearchAppFacets
            aggs={config.aggs}
            appName={appName}
            buildUID={buildUID}
          />
        </GridResponsiveSidebarColumn>
      )}
      <Grid.Column {...resultsPaneLayout}>
        <Grid className="subgrid">
          <Grid.Row>
            {facetsAvailable && (
              <Grid.Column
                floated="left"
                only="mobile tablet"
                mobile={2}
                tablet={2}
                textAlign="center"
              >
                <Button
                  basic
                  onClick={() => setSidebarVisible(true)}
                  title={i18next.t("Filter results")}
                  aria-label={i18next.t("Filter results")}
                  className="facets-sidebar-open-button"
                >
                  <Icon name="filter" />
                  <ShouldActiveFiltersRender>
                    <ActiveFiltersCountFloatingLabel />
                  </ShouldActiveFiltersRender>
                </Button>
              </Grid.Column>
            )}
            <Grid.Column
              mobile={14}
              tablet={14}
              computer={16}
              largeScreen={16}
              widescreen={16}
              floated="right"
            >
              <Overridable
                id={buildUID("SearchApp.searchbarContainer", "", appName)}
              >
                <SearchBar buildUID={buildUID} appName={appName} />
              </Overridable>
            </Grid.Column>
          </Grid.Row>
          <ShouldActiveFiltersRender>
            <Grid.Row only="computer tablet">
              <Grid.Column>
                <ActiveFilters />
              </Grid.Column>
            </Grid.Row>
          </ShouldActiveFiltersRender>
          <Grid.Row verticalAlign="middle" className="result-options pb-0">
            {/* <Grid.Column width={16}> */}
            <ResultOptionsWithState />
            {/* </Grid.Column> */}
          </Grid.Row>
          <Grid.Row verticalAlign="middle">
            <Grid.Column
              as="section"
              aria-label={i18next.t("Search results")}
              width={16}
            >
              <SearchAppResultsPane
                layoutOptions={config.layoutOptions}
                appName={appName}
                buildUID={buildUID}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Grid.Column>
      {hasButtonSidebar && (
        <Grid.Column
          mobile={16}
          tablet={16}
          computer={4}
          largeScreen={4}
          widescreen={4}
        >
          <Overridable
            id={buildUID("SearchApp.buttonSidebarContainer", "", appName)}
          />
        </Grid.Column>
      )}
    </Grid>
  );
};

SearchAppResultsGrid.propTypes = {
  columnsAmount: PropTypes.number.isRequired,
  facetsAvailable: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    aggs: PropTypes.array.isRequired,
    layoutOptions: PropTypes.object,
  }).isRequired,
  appName: PropTypes.string.isRequired,
  buildUID: PropTypes.func.isRequired,
  resultsPaneLayout: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  hasButtonSidebar: PropTypes.bool,
};

export const SearchAppLayout = ({ config, hasButtonSidebar = false }) => {
  const { appName, buildUID } = useContext(SearchConfigurationContext);
  const facetsAvailable = !_isEmpty(config.aggs);

  let columnsAmount;
  let resultsPaneLayout;

  if (facetsAvailable) {
    if (hasButtonSidebar) {
      columnsAmount = 3;
      resultsPaneLayout = {
        mobile: 16,
        tablet: 16,
        computer: 8,
        largeScreen: 8,
        widescreen: 8,
        width: undefined,
      };
    } else {
      columnsAmount = 2;
      resultsPaneLayout = {
        mobile: 16,
        tablet: 16,
        computer: 12,
        largeScreen: 12,
        widescreen: 12,
        width: undefined,
      };
    }
  } else {
    if (hasButtonSidebar) {
      columnsAmount = 2;
      resultsPaneLayout = {
        mobile: 16,
        tablet: 16,
        computer: 12,
        largeScreen: 12,
        widescreen: 12,
        width: undefined,
      };
    } else {
      columnsAmount = 1;
      resultsPaneLayout = {
        mobile: 16,
        tablet: 16,
        computer: 16,
        largeScreen: 16,
        widescreen: 16,
        width: undefined,
      };
    }
  }

  return (
    <Container fluid>
      <SearchAppResultsGrid
        columnsAmount={columnsAmount}
        facetsAvailable={facetsAvailable}
        config={config}
        appName={appName}
        buildUID={buildUID}
        resultsPaneLayout={resultsPaneLayout}
        hasButtonSidebar={hasButtonSidebar}
      />
      <ScrollToTopButton />
    </Container>
  );
};

SearchAppLayout.propTypes = {
  config: PropTypes.shape({
    searchApi: PropTypes.object.isRequired, // same as ReactSearchKit.searchApi
    initialQueryState: PropTypes.shape({
      queryString: PropTypes.string,
      sortBy: PropTypes.string,
      sortOrder: PropTypes.string,
      page: PropTypes.number,
      size: PropTypes.number,
      hiddenParams: PropTypes.array,
      layout: PropTypes.oneOf(["list", "grid"]),
    }),
    aggs: PropTypes.array,
  }).isRequired,
  // eslint-disable-next-line react/require-default-props
  hasButtonSidebar: PropTypes.bool,
};
