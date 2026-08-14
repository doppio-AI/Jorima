const LOCAL_IP = "192.168.1.95";

export const API_URL = __DEV__
  ? `http://${LOCAL_IP}:3000`
  : "jorima-eight.vercel.app";