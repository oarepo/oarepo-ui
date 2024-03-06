import React from "react";
import PropTypes from "prop-types";
import _isEmpty from "lodash/isEmpty";
import Overridable from "react-overridable";
import { withState, ActiveFilters, buildUID } from "react-searchkit";
import { GridResponsiveSidebarColumn } from "react-invenio-forms";
import { Container, Grid, Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  SearchAppFacets,
  SearchAppResultsPane,
  SearchBar,
} from "@js/invenio_search_ui/components";
import { ResultOptions } from "@js/invenio_search_ui/components/Results";
import { ClearFiltersButton } from "./ClearFiltersButton";
import { parseSearchAppConfigs } from "@js/oarepo_ui";

const ResultOptionsWithState = withState(ResultOptions);

export const SearchAppLayout = ({ config, hasButtonSidebar }) => {
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const facetsAvailable = !_isEmpty(config.aggs);
  const [searchAppConfig, ...otherSearchAppConfigs] = parseSearchAppConfigs();
  const { overridableIdPrefix } = searchAppConfig;

  let columnsAmount;
  let resultsPaneLayoutFacets;

  if (facetsAvailable) {
    if (hasButtonSidebar) {
      columnsAmount = 3;
      resultsPaneLayoutFacets = {
        mobile: 16,
        tablet: 16,
        computer: 10,
        largeScreen: 10,
        widescreen: 10,
        width: undefined,
      };
    } else {
      columnsAmount = 2;
      resultsPaneLayoutFacets = {
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
      resultsPaneLayoutFacets = {
        mobile: 16,
        tablet: 16,
        computer: 12,
        largeScreen: 12,
        widescreen: 12,
        width: undefined,
      };
    } else {
      columnsAmount = 1;
      resultsPaneLayoutFacets = {
        mobile: 16,
        tablet: 16,
        computer: 16,
        largeScreen: 16,
        widescreen: 16,
        width: undefined,
      };
    }
  }

  const resultsSortLayoutFacets = {
    mobile: 14,
    tablet: 14,
    computer: 5,
    largeScreen: 5,
    widescreen: 5,
  };

  const resultsSortLayoutNoFacets = {
    mobile: 16,
    tablet: 16,
    computer: 16,
    largeScreen: 16,
    widescreen: 16,
  };

  const resultsPaneLayoutNoFacets = resultsPaneLayoutFacets;

  // make list full width if no facets available
  const resultsPaneLayout = facetsAvailable
    ? resultsPaneLayoutFacets
    : resultsPaneLayoutNoFacets;

  const resultSortLayout = facetsAvailable
    ? resultsSortLayoutFacets
    : resultsSortLayoutNoFacets;

  return (
    <Container fluid>
      <Overridable
        id={buildUID(overridableIdPrefix, "SearchApp.searchbarContainer")}
      >
        <Grid relaxed padded>
          <Grid.Row>
            <Grid.Column width={12} floated="right">
              <SearchBar buildUID={buildUID} appName={overridableIdPrefix} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Overridable>
      <Grid
        columns={columnsAmount}
        relaxed
        className="search-app rel-mt-2"
        padded
      >
        <Grid.Row verticalAlign="middle" className="result-options">
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
                icon="sliders"
                onClick={() => setSidebarVisible(true)}
                title={i18next.t("Filter results")}
                aria-label={i18next.t("Filter results")}
              />
            </Grid.Column>
          )}
          {facetsAvailable && (
            <Grid.Column floated="left" only="computer" width={11}>
              <ActiveFilters />
            </Grid.Column>
          )}
          <Grid.Column textAlign="right" floated="right" {...resultSortLayout}>
            <ResultOptionsWithState />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column floated="left">
            <ClearFiltersButton />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={columnsAmount}>
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
              <SearchAppFacets
                aggs={config.aggs}
                appName={overridableIdPrefix}
                buildUID={buildUID}
              />
            </GridResponsiveSidebarColumn>
          )}
          <Grid.Column {...resultsPaneLayout}>
            <SearchAppResultsPane
              layoutOptions={config.layoutOptions}
              appName={overridableIdPrefix}
              buildUID={buildUID}
            />
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
                id={buildUID(
                  overridableIdPrefix,
                  "SearchApp.buttonSidebarContainer"
                )}
              ></Overridable>
            </Grid.Column>
          )}
        </Grid.Row>
      </Grid>
    </Container>
  );
};

SearchAppLayout.propTypes = {
  hasButtonSidebar: PropTypes.bool,
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
  }),
};
