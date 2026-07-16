const LOCAL_IP = "10.13.22.54";

export const API_URL = __DEV__
  ? `http://${LOCAL_IP}:3000`
  : "jorima-eight.vercel.app";