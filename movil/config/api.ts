const LOCAL_IP = "10.13.12.30";

export const API_URL = __DEV__
  ? `http://${LOCAL_IP}:3000`
  : "https://jorima-eight.vercel.app";