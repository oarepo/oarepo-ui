import json


def test_search(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(f"/simple-model/") as c:
        txt = json.loads(c.text)
        search_config = txt["search_config"]
        assert search_config == {
            "aggs": [],
            "appId": None,
            "defaultComponents": {},
            "defaultSortingOnEmptyQueryString": {"sortBy": "newest"},
            "initialQueryState": {
                "filters": [],
                "hiddenParams": None,
                "layout": "list",
                "page": 1,
                "size": 10,
                "sortBy": "bestmatch",
            },
            "layoutOptions": {"gridView": False, "listView": True},
            "paginationOptions": {
                "defaultValue": 10,
                "maxTotalResults": 10000,
                "resultsPerPage": [
                    {"text": "10", "value": 10},
                    {"text": "20", "value": 20},
                    {"text": "50", "value": 50},
                ],
            },
            "searchApi": {
                "axios": {
                    "headers": {"Accept": "application/vnd.inveniordm.v1+json"},
                    "url": "/api/simple-model",
                    "withCredentials": True,
                },
                "invenio": {
                    "requestSerializer": "InvenioRecordsResourcesRequestSerializer"
                },
            },
            "sortOptions": [
                {"sortBy": "bestmatch", "text": "Best match"},
                {"sortBy": "newest", "text": "Newest"},
                {"sortBy": "oldest", "text": "Oldest"},
            ],
            "sortOrderDisabled": True,
            "ui_endpoint": "/simple-model",
            "ui_links": {
                "create": "https://127.0.0.1:5000/simple-model/_new",
                "next": "https://127.0.0.1:5000/simple-model?page=2",
                "self": "https://127.0.0.1:5000/simple-model",
            },
        }
