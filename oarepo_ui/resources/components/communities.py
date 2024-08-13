from typing import Dict

from flask_principal import Identity
from invenio_communities.communities.records.api import Community


from .base import UIResourceComponent


class AllowedCommunitiesComponent(UIResourceComponent):
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
        ret = self.get_allowed_communities(identity, "create")
        form_config['allowed_communities'] = ret
        return ret

    def get_allowed_communities(self, identity, action):
        # get all communities
        community_ids = set()
        for need in identity.provides:
            if need.method == 'community' and need.value:
                community_ids.add(need.value)
        ret = []
        # for each community, get workflow
        for community_id in community_ids:
            community = Community.get_record(community_id)
            if self.user_has_permission(identity, community, action):
                # get the link to the community

                ret.append({
                    'slug': community.slug,
                    'title': community.metadata['title']
                })
        return ret

    def user_has_permission(self, identity, community, action):
        workflow = community.custom_fields.get('workflow')

        workflow = workflow or "default"  # TODO: just for testing !!!

        if not workflow:
            return False
        return self.check_user_permissions(str(community.id), workflow, identity, action)

    def check_user_permissions(self, community_id, workflow, identity, action):
        from oarepo_workflows.proxies import current_oarepo_workflows
        from oarepo_workflows.errors import InvalidWorkflowError
        if workflow not in current_oarepo_workflows.record_workflows:
            raise InvalidWorkflowError(f"Workflow {workflow} does not exist in the configuration.")
        wf = current_oarepo_workflows.record_workflows[workflow]
        permissions = wf.permissions(action, data={
            'parent': {
                'communities': {
                    'default': community_id
                }
            }
        })
        return permissions.allows(identity)
