import PropTypes from "prop-types";
import React, { useContext } from "react";
import Overridable from "react-overridable";
import { Item, Grid, Icon, Label } from "semantic-ui-react";
import { AppContext, withState } from "react-searchkit";
import { ErrorBoundary } from "react-error-boundary";
import { i18next } from "@translations/oarepo_ui/i18next";

const DefaultListItemErrorFallback = ({ result }) => {
  return (
    <Item data-testid="error-fallback">
      <Item.Content>
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column className="results-list item-side computer tablet only">
              <Item.Extra className="labels-actions">
                <Icon name="warning sign" color="red" size="big" />
              </Item.Extra>
            </Grid.Column>
            <Grid.Column className="results-list item-main">
              <div className="justify-space-between flex">
                <Item.Header as="h2">
                  {i18next.t("Something went wrong")} {result?.id}
                </Item.Header>
                <div className="item-access-rights">
                  <Label color="red">{i18next.t("Error")}</Label>
                </div>
              </div>
              <Item.Meta>
                <Grid columns={1}>
                  <Grid.Column>
                    <Grid.Row className="ui separated">
                      <span>
                        {i18next.t(
                          "An error occurred while rendering this component"
                        )}
                      </span>
                    </Grid.Row>
                  </Grid.Column>
                </Grid>
              </Item.Meta>
              <Item.Description>
                {i18next.t(
                  "Please try refreshing the page or contact support if the problem persists."
                )}
              </Item.Description>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Item.Content>
    </Item>
  );
};

DefaultListItemErrorFallback.propTypes = {
  result: PropTypes.object.isRequired,
};

// Don't see another way, if we do not wish to put the error boundary directly
// in result list items component, which would be tedious
const ListItem = ({ result, overridableId }) => {
  const { buildUID } = useContext(AppContext);
  return (
    <ErrorBoundary fallback={<DefaultListItemErrorFallback result={result} />}>
      <Overridable
        id={buildUID("ResultsList.item", overridableId)}
        result={result}
      >
        <Item href={`#${result.id}`}>
          <Item.Image
            size="small"
            src={result.imgSrc || "https://placehold.co/200"}
          />
          <Item.Content>
            <Item.Header>{result.title}</Item.Header>
            <Item.Description>{result.description}</Item.Description>
          </Item.Content>
        </Item>
      </Overridable>
    </ErrorBoundary>
  );
};

ListItem.propTypes = {
  result: PropTypes.object.isRequired,
  overridableId: PropTypes.string.isRequired,
};

const ListItemContainerComponent = ({ currentResultsState, overridableId }) => {
  const _results = currentResultsState?.data?.hits?.map((result, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <ListItem result={result} key={index} overridableId={overridableId} />
  ));

  return (
    <Item.Group divided relaxed link>
      {_results}
    </Item.Group>
  );
};

ListItemContainerComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  overridableId: PropTypes.string.isRequired,
};

export const ListItemContainer = withState(ListItemContainerComponent);
