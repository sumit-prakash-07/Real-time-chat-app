import React,{createContext, useContext, useMemo} from "react";
import {io} from 'socket.io-client'
const SocketContext = createContext(null);

export const useSocket = ()=>{
    const socket = useContext(SocketContext);
    return socket;
}

export const SocketProvider = (props) =>{
    const socket = useMemo(()=>
        io('https://real-time-chat-app-r7w6.onrender.com'),[]
    );
    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    )
}