import { Router } from "express";
import AuthController from "../controllers/auth-controller";
import { checkAuth } from "../middlewares/checkAuth";
const router = Router();
//Login route
router.post("/login", AuthController.login);
//logout route
router.post("/logout", AuthController.logout);
//Get user profile
router.post("/me", AuthController.me);
//Change my password
router.post("/change-password", [checkAuth], AuthController.changePassword);
//Update Playerid
router.post("/update-playerid", [checkAuth], AuthController.updatePlayerid);
export default router;
