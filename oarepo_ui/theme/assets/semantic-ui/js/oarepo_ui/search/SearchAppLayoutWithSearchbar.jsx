import {
  SearchAppResultsPane,
  SearchConfigurationContext,
} from "@js/invenio_search_ui/components";
import { i18next } from "@translations/oarepo_ui/i18next";
import React, { useContext } from "react";
import { SearchBar, ActiveFilters } from "react-searchkit";
import { GridResponsiveSidebarColumn } from "react-invenio-forms";
import { Grid, Button, Container, Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import {
  SearchAppFacets,
  ClearFiltersButton,
  ShouldActiveFiltersRender,
  ActiveFiltersCountFloatingLabel,
} from "@js/oarepo_ui";
import Overridable from "react-overridable";

export const SearchAppLayoutWithSearchbarHOC = ({
  placeholder,
  extraContent,
  mobileOnlyExtraRow,
  appName,
}) => {
  const SearchAppLayoutWithSearchbar = (props) => {
    const [sidebarVisible, setSidebarVisible] = React.useState(false);
    const { config } = props;
    const searchAppContext = useContext(SearchConfigurationContext);
    const { buildUID } = searchAppContext;
    return (
      <Container className="rel-mt-4 rel-mb-4">
        <Grid>
          <GridResponsiveSidebarColumn
            width={4}
            open={sidebarVisible}
            onHideClick={() => setSidebarVisible(false)}
          >
            <ShouldActiveFiltersRender>
              <Overridable id={buildUID("ClearFiltersButton.container")}>
                <ClearFiltersButton
                  className={"clear-filters-button mobile tablet only"}
                />
              </Overridable>
            </ShouldActiveFiltersRender>
            <SearchAppFacets aggs={config.aggs} appName={appName} />
          </GridResponsiveSidebarColumn>
          <Grid.Column computer={12} mobile={16} tablet={16}>
            <Grid columns="equal">
              <ShouldActiveFiltersRender>
                <Grid.Row only="computer" verticalAlign="middle">
                  <Grid.Column>
                    <ActiveFilters />
                  </Grid.Column>
                </Grid.Row>
              </ShouldActiveFiltersRender>
              <Grid.Row only="computer" verticalAlign="middle">
                <Grid.Column>
                  <SearchBar placeholder={placeholder} className="rel-pl-1" />
                </Grid.Column>
                {extraContent?.()}
              </Grid.Row>
              <Grid.Column only="mobile tablet" mobile={2} tablet={2}>
                <Button
                  basic
                  onClick={() => setSidebarVisible(true)}
                  title={i18next.t("Filter results")}
                  aria-label={i18next.t("Filter results")}
                  className="facets-sidebar-open-button"
                >
                  <Icon name="filter"></Icon>
                  <ShouldActiveFiltersRender>
                    <ActiveFiltersCountFloatingLabel />
                  </ShouldActiveFiltersRender>
                </Button>
              </Grid.Column>
              <Grid.Column
                only="mobile tablet"
                mobile={14}
                tablet={14}
                floated="right"
              >
                <SearchBar placeholder={placeholder} />
              </Grid.Column>
              {extraContent && (
                <Grid.Row only="tablet mobile" verticalAlign="middle">
                  {extraContent()}
                </Grid.Row>
              )}
              {mobileOnlyExtraRow && (
                <Grid.Row verticalAlign="middle" only="mobile">
                  {mobileOnlyExtraRow()}
                </Grid.Row>
              )}
              <Grid.Row>
                <Grid.Column mobile={16} tablet={16} computer={16}>
                  <SearchAppResultsPane
                    layoutOptions={config.layoutOptions}
                    appName={appName}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Grid.Column>
        </Grid>
      </Container>
    );
  };

  SearchAppLayoutWithSearchbar.propTypes = {
    config: PropTypes.object.isRequired,
  };

  return SearchAppLayoutWithSearchbar;
};

SearchAppLayoutWithSearchbarHOC.propTypes = {
  placeholder: PropTypes.string,
  extraContent: PropTypes.oneOfType([PropTypes.func, PropTypes.oneOf([null])]),
  mobileOnlyExtraRow: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.oneOf([null]),
  ]),
  appName: PropTypes.string,
};

SearchAppLayoutWithSearchbarHOC.defaultProps = {
  extraContent: null,
  mobileOnlyExtraRow: null,
  appName: undefined,
  placeholder: "",
};
