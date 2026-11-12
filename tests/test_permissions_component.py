# SPDX-FileCopyrightText: 2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

from invenio_access.permissions import system_identity
from invenio_rdm_records.services.services import RDMRecordService

from oarepo_ui.proxies import current_oarepo_ui
from oarepo_ui.resources.components import PermissionsComponent


def _record_with_communities(*ids, default=None):
    data = {"ids": list(ids)}
    if default is not None:
        data["default"] = default
    communities = SimpleNamespace(ids=list(ids), to_dict=lambda: dict(data))
    return SimpleNamespace(parent=SimpleNamespace(communities=communities))


def _rdm_service(allowed_ids):
    service = MagicMock(spec=RDMRecordService)

    def check(identity, action, record=None, community_id=None, **kwargs):
        assert action == "remove_community_from_record"
        if community_id == "boom":
            raise RuntimeError("policy failure")
        return community_id in allowed_ids

    service.check_permission.side_effect = check
    return service


def test_upstream_detail_actions_configured(app):
    actions = current_oarepo_ui.record_actions
    for action in (
        "edit",
        "new_version",
        "manage",
        "update_draft",
        "read_files",
        "review",
        "view",
        "media_read_files",
        "moderate",
        "request_deletion",
        "immediately_delete",
        "remove_community_from_record",
        "manage_files",
        "delete_draft",
        "manage_record_access",
    ):
        assert action in actions


def test_removable_community_ids_non_rdm_service(app, simple_model_ui_resource, record_service):
    component = PermissionsComponent(simple_model_ui_resource)
    record = _record_with_communities("c1")
    assert component.get_removable_community_ids(record_service, system_identity, record) == []


def test_removable_community_ids_rdm_service(app, simple_model_ui_resource):
    component = PermissionsComponent(simple_model_ui_resource)
    service = _rdm_service({"c1"})
    record = _record_with_communities("c1", "c2", "boom")
    assert component.get_removable_community_ids(service, system_identity, record) == ["c1"]


def test_removable_community_ids_skip_default_community(app, simple_model_ui_resource):
    """The primary community is never offered for removal (oarepo-communities forbids it)."""
    component = PermissionsComponent(simple_model_ui_resource)
    service = _rdm_service({"c1", "c2"})
    record = _record_with_communities("c1", "c2", default="c1")
    assert component.get_removable_community_ids(service, system_identity, record) == ["c2"]
    checked = [call.kwargs["community_id"] for call in service.check_permission.call_args_list]
    assert checked == ["c2"]


def test_removable_community_ids_default_allowed_in_subclass(app, simple_model_ui_resource):
    class UpstreamPermissionsComponent(PermissionsComponent):
        remove_default_community_allowed = True

    component = UpstreamPermissionsComponent(simple_model_ui_resource)
    service = _rdm_service({"c1", "c2"})
    record = _record_with_communities("c1", "c2", default="c1")
    assert component.get_removable_community_ids(service, system_identity, record) == ["c1", "c2"]


def test_removable_community_ids_missing_parent_or_record(app, simple_model_ui_resource):
    component = PermissionsComponent(simple_model_ui_resource)
    service = MagicMock(spec=RDMRecordService)
    assert component.get_removable_community_ids(service, system_identity, None) == []
    assert component.get_removable_community_ids(service, system_identity, SimpleNamespace()) == []
    service.check_permission.assert_not_called()


def test_detail_permissions_non_rdm(app, simple_model_ui_resource, users, draft_factory):
    """before_ui_detail on a plain draft-service model must not raise and yields safe defaults."""
    draft = draft_factory(users[0].identity)
    api_record = simple_model_ui_resource.api_service.read_draft(users[0].identity, draft["id"])
    extra_context: dict = {}
    render_kwargs: dict = {}
    PermissionsComponent(simple_model_ui_resource).before_ui_detail(
        api_record=api_record,
        identity=users[0].identity,
        extra_context=extra_context,
        render_kwargs=render_kwargs,
    )
    perms = render_kwargs["permissions"]
    assert perms["removable_community_ids"] == []
    assert perms["can_request_deletion"] is False
    assert perms["can_immediately_delete"] is False
    assert perms["can_remove_community_from_record"] is False
