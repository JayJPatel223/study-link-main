import { Router, Response } from "express";
import { authenticateUser } from "../middlewares/authenticateUser";
import { AuthenticatedRequest } from "../types/auth-req";
import prisma from "../utils/prisma";

const router = Router();

// GET "/" :get all files for a group
router.get(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const groupId = Number(req.query.groupId);

      if (!groupId) {
        res.status(400).json({ error: "Group ID is required" });
        return;
      }

      const files = await prisma.file.findMany({
        where: { groupId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          discussion: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  }
);

// PUT "/" :filtered search (no pagination)
router.put(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, fileName, discussionId } = req.body;

      if (!groupId) {
        res.status(400).json({ error: "Group ID is required" });
        return;
      }

      const filters: any = { groupId: Number(groupId) };

      if (fileName) {
        filters.fileName = {
          contains: fileName,
          mode: "insensitive",
        };
      }

      if (discussionId) {
        filters.discussionId = Number(discussionId);
      }

      const files = await prisma.file.findMany({
        where: filters,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          discussion: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json(files);
    } catch (error) {
      console.error("Error searching files:", error);
      res.status(500).json({ error: "Failed to search files" });
    }
  }
);

// GET "/:id" :get file by id
router.get(
  "/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fileId = Number(req.params.id);

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          discussion: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      res.status(200).json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ error: "Failed to fetch file" });
    }
  }
);

// DELETE "/:id" :delete file by id
router.delete(
  "/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fileId = Number(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // First check if file exists and if user has permission to delete
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          group: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      // Check if user is admin or file owner
      const isAdmin = file.group.members.some(
        (member) => member.role === "ADMIN"
      );
      const isOwner = file.uploadedById === userId;

      if (!isAdmin && !isOwner) {
        res
          .status(403)
          .json({ error: "You don't have permission to delete this file" });
        return;
      }

      // Delete the file
      await prisma.file.delete({
        where: { id: fileId },
      });

      res
        .status(200)
        .json({ success: true, message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
);

export default router;
