import { sendSuccess } from "../utils/response.js";

const getHealth = (_req, res) => {
  return sendSuccess(res, "API is healthy", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export { getHealth };
