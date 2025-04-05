import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [room, setRoom] = useState("");

  const email = localStorage.getItem("email");
  const socket = useSocket();
  const navigate = useNavigate();
  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    const { room } = data;
    navigate(`/room/${room}`);
  }, []);
  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket]);

  return (
    <main className="m-20">
      <h1 className="text-lg font-extrabold text-center mb-5">Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-col w-full max-w-sm">
            <label htmlFor="email" className="mb-1 text-sm font-medium">
              Email Id
            </label>
            <input
              type="email"
              id="email"
              value={email}
              className="input input-bordered bg-gray-100 text-gray-700 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="flex flex-col w-full max-w-sm">
            <label htmlFor="room" className="mb-1 text-sm font-medium">
              Room Id
            </label>
            <input
              type="text"
              id="room"
              placeholder="Type here"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-4 w-full max-w-sm"
          >
            JOIN
          </button>
        </div>
      </form>
    </main>
  );
};

export default LobbyScreen;
