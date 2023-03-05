// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import _get from "lodash/get";
import _isString from "lodash/isString";
import _isArray from "lodash/isArray";
import _isObject from "lodash/isObject";
import _camelCase from "lodash/camelCase";
import _upperFirst from "lodash/upperFirst";
import * as React from "react";
import { GlobalDataContext } from "./context";

/**
 * Uses data field configuration to query data
 * for respectful values. If no field is passed
 * it simply returns all data.
 *
 * @param data Current Data context object
 * @param field Data fields configuration
 * @returns `props` with values resolved from DataContext
 */
export const useDataContext = (data, field) => {
  const _getContextData = (_data) => {
    if (_isString(field)) {
      return _get(_data, field);
    } else if (field?.path || field?.default) {
      return _get(_data, field?.path, field?.default);
    }
  };

  if (_isArray(data)) {
    return data.map((d) => _getContextData(d));
  }
  return _getContextData(data);
};

export const useGlobalDataContext = () => {
  const context = React.useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalDataContext must be used within a context provider"
    );
  }
  return context;
};

export const useItems = (items, itemConfig = { component: "raw" }) => {
  return items?.map((item) => {
    if (_isString(item)) {
      return { ...itemConfig, children: item };
    } else if (!item.component) {
      return { ...itemConfig, ...item };
    }
    return item;
  });
};

const SeparatorLayout = ({ layout }) => useLayout({ layout });

export const useSeparator = (separator) => {
  if (!separator) {
    return {};
  }
  return _isString(separator) ? (
    <React.Fragment>{separator}</React.Fragment>
  ) : (
    <SeparatorLayout layout={separator} />
  );
};

export function useComponent(name, componentPackage = "oarepo_ui") {
  const componentName = _upperFirst(_camelCase(name));
  console.log("loading component", componentName);
  const Component = React.lazy(() =>
    import(
      /* webpackInclude: /ui_components\/.*\.jsx$/ */ `@uijs/${componentPackage}/ui_components/${componentName}`
    )
  );
  return { Component };
}

const LayoutComponent = ({
  layout,
  data,
  dataField,
  useGlobalData,
  ...rest
}) => {
  const {
    component,
    data: layoutData,
    dataField: layoutDataField,
    ...restLayoutProps
  } = layout;
  const { Component } = useComponent(component);
  const scopedData = useDataContext(data, layoutDataField || dataField);

  const dataContext =
    layoutDataField || dataField ? scopedData : layoutData || data;
  const renderData = _isArray(dataContext) ? dataContext : [dataContext];
  const componentProps = {
    ...restLayoutProps,
    data: renderData,
    useGlobalData,
    ...rest,
  };

  return (
    <React.Suspense key={`sus-${component}`} fallback={<React.Fragment />}>
      <Component {...componentProps} />
    </React.Suspense>
  );
};

export function useLayout(layoutProps) {
  const { layout, data, useGlobalData = false, ...rest } = layoutProps;

  if (_isArray(layout)) {
    return layout.map((layoutItem, idx) => (
      <LayoutComponent
        {...{
          key: idx,
          layout: layoutItem,
          data: layoutItem.data || data,
          useGlobalData,
          ...rest,
        }}
      />
    ));
  } else {
    return <LayoutComponent {...layoutProps} />;
  }
}

const ChildComponent = ({ layout, data, useGlobalData }) =>
  useLayout({ layout, data, useGlobalData });

export const useChildrenOrValue = (children, data, useGlobalData) => {
  if (children) {
    if (_isArray(children)) {
      return children.map((child) => (
        <ChildComponent {...{ layout: child, data, useGlobalData }} />
      ));
    } else if (_isObject(children)) {
      return <ChildComponent {...{ layout: children, data, useGlobalData }} />;
    }
    return <React.Fragment>{children}</React.Fragment>;
  } else if (_isString(data)) {
    return <React.Fragment>{data}</React.Fragment>;
  } else if (data) {
    return (
      <pre>
        <code>{JSON.stringify(data)}</code>
      </pre>
    );
  }
};
