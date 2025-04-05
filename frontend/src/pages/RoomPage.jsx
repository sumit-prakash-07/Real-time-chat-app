import React, { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer.js";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [ismuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(async ({ from, offer }) => {
    console.log(`incoming call`, from, offer);
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit("accept:call", { to: from, ans });
  }, []);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("call accepted");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("Got tracks");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("accept:call", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("accept:call", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);
  return (
    <div className="p-10 min-h-screen bg-gray-100 flex flex-col items-center space-y-10">
      <div className="text-center mt-24 space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">Room Page</h1>
        <h4
          className={`text-lg ${
            remoteSocketId ? "text-green-600" : "text-red-500"
          }`}
        >
          {remoteSocketId ? "Connected" : "No one in room"}
        </h4>
      </div>

      <div className="space-x-4">
        {myStream && (
          <button
            onClick={sendStreams}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition"
          >
            Send Streams
          </button>
        )}

        {remoteSocketId && (
          <button
            onClick={handleCallUser}
            className="px-6 py-2 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition"
          >
            Call
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {myStream && (
          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              My Video
            </h2>
            <button
              onClick={toggleMute}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl shadow-md hover:bg-purple-600 transition"
            >
              {ismuted ? "Unmute" : "Mute"}
            </button>
            <ReactPlayer
              playing
              muted={ismuted}
              height="300px"
              width="100%"
              url={myStream}
              className="rounded-xl overflow-hidden"
            />
          </div>
        )}

        {remoteStream && (
          <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Remote Video
            </h2>
            <button
              onClick={toggleMute}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl shadow-md hover:bg-purple-600 transition"
            >
              {ismuted ? "Unmute" : "Mute"}
            </button>
            <ReactPlayer
              playing
              muted={ismuted}
              height="300px"
              width="100%"
              url={remoteStream}
              className="rounded-xl overflow-hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
