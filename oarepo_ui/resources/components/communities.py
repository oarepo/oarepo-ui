from typing import Dict

from flask_principal import Identity
from invenio_communities.communities.records.api import Community
from invenio_communities.proxies import current_communities
from flask import request


from .base import UIResourceComponent


class AllowedCommunitiesComponent(UIResourceComponent):
    def form_config(
        self,
        *,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        form_config["allowed_communities"] = self.get_allowed_communities(
            identity, "create"
        )
        generic_community = current_communities.service.read(
            id_="generic", identity=identity
        )
        generic_community = generic_community.to_dict()
        form_config["generic_community"] = {
            "slug": str(generic_community["slug"]),
            "id": str(generic_community["id"]),
            "logo": f"/api/communities/{generic_community['id']}/logo",
            **(generic_community["metadata"] or {}),
        }

    def before_ui_create(
        self,
        *,
        data: Dict,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict,
        extra_context: Dict,
        **kwargs,
    ):
        preselected_community_slug = request.args.get("community", None)
        preselected_community = next(
            (
                c
                for c in form_config["allowed_communities"]
                if c["slug"] == preselected_community_slug
            ),
            None,
        )
        form_config["preselected_community"] = preselected_community

    def get_allowed_communities(self, identity, action):
        # get all communities
        community_ids = set()
        for need in identity.provides:
            if need.method == "community" and need.value:
                community_ids.add(need.value)
        ret = []
        # for each community, get workflow
        for community_id in community_ids:
            community = Community.get_record(community_id)
            if self.user_has_permission(identity, community, action):
                # get the link to the community

                ret.append(
                    {
                        "slug": str(community.slug),
                        "id": str(community.id),
                        "logo": f"/api/communities/{community.id}/logo",
                        **(community.metadata or {}),
                    }
                )
        return ret

    def user_has_permission(self, identity, community, action):
        workflow = community.custom_fields.get("workflow")

        workflow = workflow or "default"  # TODO: just for testing !!!

        if not workflow:
            return False
        return self.check_user_permissions(
            str(community.id), workflow, identity, action
        )

    def check_user_permissions(self, community_id, workflow, identity, action):
        from oarepo_workflows.proxies import current_oarepo_workflows
        from oarepo_workflows.errors import InvalidWorkflowError

        if workflow not in current_oarepo_workflows.record_workflows:
            raise InvalidWorkflowError(
                f"Workflow {workflow} does not exist in the configuration."
            )
        wf = current_oarepo_workflows.record_workflows[workflow]
        permissions = wf.permissions(
            action, data={"parent": {"communities": {"default": community_id}}}
        )
        return permissions.allows(identity)
