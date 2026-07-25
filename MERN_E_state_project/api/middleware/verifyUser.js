import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/error.js";

const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
};

export const verifyUser = (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = getCookie(req.headers.cookie, "access_token") || bearerToken;

  if (!token) {
    return next(errorHandler(401, "You must be signed in"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch {
    next(errorHandler(401, "Your session is invalid or has expired"));
  }
};
