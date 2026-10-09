import { createContext, useContext, useState } from 'react'

const FullscreenContext = createContext({
  fullscreenActive: false,
  setFullscreenActive: () => {},
})

export function FullscreenProvider({ children }) {
  const [fullscreenActive, setFullscreenActive] = useState(false)
  return (
    <FullscreenContext.Provider
      value={{ fullscreenActive, setFullscreenActive }}
    >
      {children}
    </FullscreenContext.Provider>
  )
}

export function useFullscreen() {
  return useContext(FullscreenContext)
}