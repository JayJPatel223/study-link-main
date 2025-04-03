import { Router, Request, Response } from "express";
import { authenticateUser } from "../middlewares/authenticateUser";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../types/auth-req";

const router = Router();

router.get(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
      });

      res.status(200).json({ user: req.user, groups });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Implement user profile update
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      try {
        await prisma.user.delete({
          where: { id: userId },
        });
        res.status(200).json({ message: "User account deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user account" });
      }
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
