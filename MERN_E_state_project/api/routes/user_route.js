import express from "express";
import { test } from "../controls/user_control.js";

const router = express.Router();

router.get('/test',test);

export default router;