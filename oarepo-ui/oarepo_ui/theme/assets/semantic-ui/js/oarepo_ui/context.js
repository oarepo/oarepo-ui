import * as React from 'react'

function globalDataReducer (_state, action) {
  if (action.type === 'set') {
    return action.value
  } else {
    throw new Error(`Unhandled action type: ${action.type}`)
  }
}

function GlobalDataContextProvider ({ children, value }) {
  const [state, dispatch] = React.useReducer(globalDataReducer, value || {})
  const stateValue = { state, dispatch }

  return (
    <GlobalDataContext.Provider value={stateValue}>
      {children}
    </GlobalDataContext.Provider>
  )
}

const GlobalDataContext = React.createContext(undefined)

export { GlobalDataContext, GlobalDataContextProvider }
