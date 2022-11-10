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
export { OARepoRecordResultsListItem } from './layouts'
