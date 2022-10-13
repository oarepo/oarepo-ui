import json
from typing import List

from oarepo_model_builder.builder import ModelBuilder
from oarepo_model_builder.builders import process
from oarepo_model_builder.builders.json_base import JSONBaseBuilder
from oarepo_model_builder.property_preprocessors import PropertyPreprocessor
from oarepo_model_builder.utils.verbose import log
from werkzeug.utils import import_string


class InvenioLayoutBuilder(JSONBaseBuilder):
    TYPE = "script_sample_data"
    output_file_type = "layout"
    output_file_name = "layout"
    parent_module_root_name = "jsonschemas"

    def __init__(self, builder: ModelBuilder, property_preprocessors: List[PropertyPreprocessor]):
        super().__init__(builder, property_preprocessors)
        self.ui = self.builder.schema.schema.get('oarepo:ui', {})
        self.data = {}
        self.collected = []
        self.components = {}
        self.process_entrypoint()

    #for components definition
    def process_entrypoint(self):
        import importlib_metadata

        components_eps = importlib_metadata.entry_points()['oarepo_model_builder_ui.components']
        for ep in components_eps:
            entrypoint = import_string(ep.value)
            self.components[ep.name] = {'members': entrypoint.members, 'value_type': entrypoint.value_type}


    @process("/model/**", condition=lambda current, stack: stack.schema_valid)
    def model_element(self):
        if self.ui == {}:
            return
        schema_element_type = self.stack.top.schema_element_type

        if schema_element_type == "property":
            key = self.process_path(self.stack.path, self.stack.top.key)
            self.generate_property(key)
        elif schema_element_type == "items":
            pass
        else:
            if 'oarepo:ui' in self.stack.top.data and self.stack.path not in self.collected:
                self.collected.append(self.stack.path)
                key = self.process_path(self.stack.path, self.stack.top.key)
                for element in self.ui:
                    if element in self.stack.top.data['oarepo:ui']:
                        content = self.stack.top.data['oarepo:ui'][element]
                        self.ui[element] = self.merge_content(self.ui[element], key, content)

            self.build_children()

    def process_path(self, path, key):
        path_array = path.split('/')
        path_array = path_array[4:]
        if len(path_array)> 0:
            path_array = path_array[:-1]
        full_key = ''
        for p in path_array:
            if p == 'properties':
                continue
            if full_key == '':
                full_key = p
            else:
                full_key = full_key + '.' + p
        if full_key != '':
            full_key = full_key + '.'
        full_key = full_key + key
        return full_key

    def generate_property(self, key):

        if "properties" in self.stack.top.data:
            if not 'oarepo:ui' in self.stack.top.data and key != 'metadata':
                self.stack.top.data['oarepo:ui'] = {'default':{"component": "raw","dataField": ""}}
            if 'oarepo:ui' in self.stack.top.data and self.stack.path not in self.collected:
                self.collected.append(self.stack.path)
                self.stack.top.data['oarepo:ui'] = self.update_datafield(self.stack.top.data['oarepo:ui'], key, self.stack.top.data.properties)
                self.process_elements(key)
                self.output.merge(self.ui)
            self.output.enter(key, {})
            self.build_children()
            self.output.leave()
        elif "items" in self.stack.top.data:
            if 'oarepo:ui' in self.stack.top.data and self.stack.path not in self.collected:
                self.collected.append(self.stack.path)
                self.stack.top.data['oarepo:ui'] = self.update_datafield(self.stack.top.data['oarepo:ui'], key, self.stack.top.data['items'])
                self.process_elements(key)
                self.output.merge(self.ui)
            self.output.enter(key, [])
            self.build_children()
            top = self.output.stack.real_top
            top_as_dict = {}
            for t in top:
                top_as_dict[json.dumps(t, sort_keys=True)] = t
            top.clear()
            top.extend(top_as_dict.values())

            self.output.leave()
        else:
            if not 'oarepo:ui' in self.stack.top.data:
                self.stack.top.data['oarepo:ui'] = {'default': {"component": "raw","dataField": ""}}
            if 'oarepo:ui' in self.stack.top.data and self.stack.path not in self.collected:
                self.collected.append(self.stack.path)
                self.stack.top.data['oarepo:ui'] = self.update_datafield(self.stack.top.data['oarepo:ui'], key)
                self.process_elements(key)
                self.output.merge(self.ui)

    def process_elements(self, key ):
        self.merge_content(path = key, content = self.stack.top.data['oarepo:ui'])

    def members_name(self, component_name):
        component_def = self.components.get(component_name, None)
        if not component_def or 'members' not in component_def:
            log(log.INFO, f"""Could not resolve the {component_def} component.""")
            return '' #return dictionary
        return component_def['members']
    def update_datafield(self, dictionary, path, properties = None):
        for layout in dictionary:
            if 'dataField' in dictionary[layout] and dictionary[layout]['dataField'] == "":
                dictionary[layout]['dataField'] = path
        if self.stack.top.data.type == 'array':
            for layout in dictionary:
                top_layout_data = dictionary[layout]
                members_name = self.members_name(top_layout_data['component'])

                if type(members_name) is list:
                    members_name = members_name[0]
                fl_layout_data = {}
                if layout in self.stack.top.data['items']['oarepo:ui']:
                    fl_layout_data = self.stack.top.data['items']['oarepo:ui'][layout]
                elif 'default' in self.stack.top.data['items']['oarepo:ui']:
                    fl_layout_data = self.stack.top.data['items']['oarepo:ui']['default']
                fl_members_name = self.members_name(fl_layout_data['component'])
                if type(fl_members_name) is list:
                    for mem in fl_members_name:
                        if mem in fl_members_name:
                            fl_members_name = mem
                            break
                if type(fl_members_name) is not str:
                    return dictionary

                if 'properties' in properties:
                    items = properties['properties']
                    for it in items:
                        index = fl_layout_data[fl_members_name].index(it)
                        result = self.array_processing(items, it, "", layout)
                        fl_layout_data[members_name][index] = result


                top_layout_data[members_name] = fl_layout_data
                if layout in dictionary:
                    dictionary[layout] = top_layout_data
                elif 'default' in dictionary:
                    dictionary['default'] = top_layout_data


        elif properties:
            for property in properties:

                for layout in dictionary: #search, detail etc..
                    layout_data = dictionary[layout]
                    component_def = self.components.get(layout_data['component'], None)
                    if not component_def or 'members' not in component_def:
                        log(log.INFO,f"""Could not resolve the {layout_data['component']} component.""")
                        return dictionary
                    if type(component_def['members']) is str:
                        members = layout_data[component_def['members']]
                        if type(members) is list and property in members:
                            index = members.index(property)
                            members[index] = path + '.' + property
                            layout_data[component_def['members']] = members
                            dictionary[layout] = layout_data
                        elif type(members) is object:
                            pass
                        else:
                            members = path + '.' + property #just value
                            layout_data[component_def['members']] = members
                            dictionary[layout] = layout_data

                    else:
                        for member in component_def['members']:
                            if member in layout_data:
                                members = layout_data[member]
                                if type(members) is list and property in members:
                                    index = members.index(property)
                                    members[index] = path + '.' + property
                                    layout_data[member] = members
                                    dictionary[layout] = layout_data
                                elif type(members) is object:
                                    pass
                                else:
                                    members = path + '.' + property  # just value
                                    layout_data[member] = members
                                    dictionary[layout] = layout_data
        return dictionary

    def merge_content(self, path, content):
        dictionary = self.ui
        for layout in self.ui: #search, detail etc..
            layout_data = dictionary[layout]
            component_def = self.components.get(layout_data['component'], None)
            if not component_def or 'members' not in component_def:
                log(log.INFO, f"""Could not resolve the {layout_data['component']} component.""")
                return dictionary

            member_names = component_def.get('members', '')
            members = []
            if type(member_names) is str:
                if member_names not in layout_data:
                    continue
                else:
                    members = layout_data[member_names]
            elif type(member_names) is list:
                if not any(member in layout_data for member in member_names):
                    continue
                else:
                    for member in member_names:
                        if member in layout_data:
                            members = layout_data[member]

            for it in members:
                if it == path:
                    index = members.index(it)
                    if layout in content:
                        layout_data['items'][index] = content[layout]
                    elif 'default' in content:
                        layout_data['items'][index] = content['default']
                elif type(it) is not str:
                    self.object_processing(it, path, content, layout)
            dictionary[layout] = layout_data
            self.ui = dictionary
    def array_processing(self, items,it, path, layout):
        data = items[it]

        if 'properties' in data:
            new_items_list = []
            for i in data['properties']:
                result = self.array_processing(data['properties'], i, it + ".", layout)
                new_items_list.append(result)
            members_name = self.members_name(data['oarepo:ui'][layout]['component'])
            if type(members_name) is list:
                for mem in members_name:
                    if mem in data['oarepo:ui'][layout]:
                        members_name = mem
                        break
            data['oarepo:ui'][layout][members_name] = new_items_list
            return data['oarepo:ui'][layout]
        else:
            if 'oarepo:ui' not in data:
                data['oarepo:ui'] = {'default':{"component": "raw","dataField": ""}}

            if layout in data['oarepo:ui']:

                if 'dataField' in data['oarepo:ui'][layout] and data['oarepo:ui'][layout][
                        'dataField'] == "":
                    data['oarepo:ui'][layout]['dataField'] = path + it
                return data['oarepo:ui'][layout]
            elif 'default' in data['oarepo:ui']:

                if 'dataField' in data['oarepo:ui']['default'] and data['oarepo:ui']['default'][
                        'dataField'] == "":
                    data['oarepo:ui']['default']['dataField'] = path + it
                return data['oarepo:ui']['default']

    def object_processing(self, layout_data, path, content, layout):

        component_def = self.components.get(layout_data['component'], None)

        if not component_def or 'members' not in component_def:
            log(log.INFO, f"""Could not resolve the {layout_data['component']} component.""")
            return layout_data
        member_names = component_def.get('members', '')
        members = []
        if type(member_names) is str:
            if member_names not in layout_data:
                return layout_data
            else:
                members = layout_data[member_names]
        elif type(member_names) is list:
            if not any(member in layout_data for member in member_names):
                return layout_data
            else:
                for member in member_names:
                    if member in layout_data:
                        members = layout_data[member]

        for it in members:
            if it == path:
                index = members.index(it)
                if layout in content:
                    layout_data['items'][index] = content[layout]
                elif 'default' in content:
                    layout_data['items'][index] = content['default']
            elif type(it) is not str:
                self.object_processing(it, path, content, layout)


        return layout_data

    def build(self, schema):
        output_name = schema.settings[self.output_file_name]
        output = self.builder.get_output(self.output_file_type, output_name)
        if not output.created:
            return

        super().build(schema)

    def on_enter_model(self, output_name):
        self.output.next_document()


def nested_replace( structure, original, new ):
    if type(structure) == list:
        return [nested_replace( item, original, new) for item in structure]

    if type(structure) == dict:
        return {key : nested_replace(value, original, new)
                     for key, value in structure.items() }

    if structure == original:
        return new
    else:
        return structure











