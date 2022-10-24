// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// async function getComponent(componentId) {
//   const component = await import(
//     /* webpackInclude: /\.jsx$/ */ `./components/${componentId}.jsx`
//   )
//   return component
// }
// eslint-disable-next-line react-hooks/rules-of-hooks

export { buildUID } from './util'
export { useLayout } from './hooks'
export { GlobalDataContextProvider } from './context'

// TODO: update oarepo-ui README with info how to use this JS package:
// 
// import { useLayout } from '@js/oarepo_ui'
// const appRoot = document.querySelector('#search-app')
// const SearchLayout = ({ layout, data, useGlobalData = false }) => useLayout({ layout, data, useGlobalData })
//
// ReactDOM.render(
//   <SearchLayout layout={searchResultItem} data={searchResultItemData} />
//   appRoot,
// )