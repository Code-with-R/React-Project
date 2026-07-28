import express from "express";
import { deleteUser, test, updateUser, getUserListings, getUserContact } from "../controlers/user.controler.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.get('/test',test);
router.post('/update/:id', verifyToken, updateUser)
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/listings/:id', verifyToken, getUserListings);
router.get('/contact/:id', getUserContact);

export default router;
