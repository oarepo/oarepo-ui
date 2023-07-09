import React, { useContext } from "react";
import { Grid, Button, Container } from "semantic-ui-react";
import {
  SearchBar,
  SearchConfigurationContext,
} from "@js/invenio_search_ui/components";
import { buildUID } from "react-searchkit";

//
export const SearchAppSearchBar = () => {
  const config = useContext(SearchConfigurationContext);
  const newEntryUrl = config.searchApi.axios.url.replace("/api", "") + "/_new";
  return (
    <Container className="mt-20">
      <Grid>
        <Grid.Column mobile={16} tablet={16} computer={10}>
          <SearchBar elementId="" buildUID={buildUID} />
        </Grid.Column>
        <Grid.Column floated="right" mobile={16} tablet={16} computer={4}>
          <Button
            as="a"
            href={newEntryUrl}
            fluid
            color="green"
            icon="plus"
            labelPosition="left"
            content="New Entry"
            type="button"
          />
        </Grid.Column>
      </Grid>
    </Container>
  );
};
