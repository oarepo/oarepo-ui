import { createSearchAppInit } from "@js/invenio_search_ui";
import { OARepoRecordResultsListItem } from "./layouts";
import {
    ContribSearchAppFacets,
    ContribBucketAggregationElement,
    ContribBucketAggregationValuesElement,
} from "@js/invenio_search_ui/components";

createSearchAppInit({
    "BucketAggregation.element": ContribBucketAggregationElement,
    "BucketAggregationValues.element": ContribBucketAggregationValuesElement,
    "ResultsList.item": OARepoRecordResultsListItem,
    "SearchApp.facets": ContribSearchAppFacets,
});
