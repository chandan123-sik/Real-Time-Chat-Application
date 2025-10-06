import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ✅ Check authentication
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log("Auth check failed:", error.message);
    }
  };

  // ✅ Login
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Logout
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // ✅ Update profile
  const updateProfile = async (body) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put("/api/auth/update-profile", body, {
        headers: { token },
      });

      if (data.success) {
        setAuthUser(data.user || ((prev) => ({ ...prev, ...body })));
        toast.success("Profile updated successfully");
        return { success: true, user: data.user || null };
      } else {
        toast.error(data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  // ✅ Connect Socket
  const connectSocket = (userData) => {
    if (!userData || socket) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      transports: ["websocket"],
      secure: true,
      withCredentials: true,
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Online users from backend:", userIds);
      setOnlineUsers(userIds);
    });
  };

  // ✅ Effect: Check auth when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }

    // cleanup
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
