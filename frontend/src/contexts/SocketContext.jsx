import React, { createContext, useContext } from "react";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  // You can add your socket logic here later
  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
} 