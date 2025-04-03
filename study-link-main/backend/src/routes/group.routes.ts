import { Router, Response } from "express";
import { authenticateUser } from "../middlewares/authenticateUser";
import { AuthenticatedRequest } from "../types/auth-req";
import prisma from "../utils/prisma";
import { Role } from "@prisma/client";

const router = Router();

router.get(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: { userId: req.user?.id },
          },
        },
      });
      res.status(200).json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, isPrivate, password } = req.body;

      const group = await prisma.group.create({
        data: {
          name,
          description,
          private: isPrivate || false,
          password: isPrivate ? password : null,
        },
      });

      await prisma.groupMember.create({
        data: {
          userId: req.user?.id!,
          groupId: group.id,
          role: "ADMIN",
        },
      });

      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/join-group/:groupId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const { password } = req.query;

      const group = await prisma.group.findUnique({
        where: {
          id: parseInt(groupId),
        },
      });

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      if (group?.private && group.password !== password) {
        res.status(401).json({ message: "Invalid password" });
        return;
      }

      const existingMember = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parseInt(groupId),
        },
      });

      if (existingMember) {
        res
          .status(400)
          .json({ message: "User is already a member of the group" });
        return;
      }

      await prisma.groupMember.create({
        data: {
          userId: req.user?.id!,
          groupId: parseInt(groupId),
          role: "MEMBER",
        },
      });

      res.status(201).json({ message: "User added to group successfully" });
    } catch (error) {
      console.error("Error adding user to group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/leave-group/:groupId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId } = req.params;

      // Check if user is in the group
      const groupMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(groupId),
          },
        },
      });

      if (!groupMember) {
        res.status(404).json({ message: "User is not a member of this group" });
        return;
      }

      // Check if this is the last admin
      if (groupMember.role === "ADMIN") {
        const adminCount = await prisma.groupMember.count({
          where: {
            groupId: parseInt(groupId),
            role: "ADMIN",
          },
        });

        if (adminCount === 1) {
          // Find another member to promote to admin or delete the group
          const anotherMember = await prisma.groupMember.findFirst({
            where: {
              groupId: parseInt(groupId),
              role: "MEMBER",
            },
          });

          if (anotherMember) {
            // Promote another member to admin
            await prisma.groupMember.update({
              where: { id: anotherMember.id },
              data: { role: "ADMIN" },
            });
          } else {
            // No other members, delete the group
            await prisma.group.delete({
              where: { id: parseInt(groupId) },
            });
            res.status(200).json({
              message: "Last member left the group. Group has been deleted.",
            });
            return;
          }
        }
      }

      // Remove the user from the group
      await prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(groupId),
          },
        },
      });

      res.status(200).json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, private: isPrivate, password } = req.body;

      // Check if user is an admin of the group
      const groupMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(id),
          },
        },
      });

      if (!groupMember || groupMember.role !== "ADMIN") {
        res.status(403).json({
          message: "You don't have permission to update this group",
        });
        return;
      }

      // Update group with all privacy settings
      const updatedGroup = await prisma.group.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          private: isPrivate,
          password: isPrivate ? password : null,
        },
      });

      // Remove password from response
      const { password: _, ...groupWithoutPassword } = updatedGroup;

      res.status(200).json(groupWithoutPassword);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user is an admin of the group
      const groupMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(id),
          },
        },
      });

      if (!groupMember || groupMember.role !== "ADMIN") {
        res.status(403).json({
          message: "You don't have permission to delete this group",
        });
        return;
      }

      // Delete all group members first (to avoid foreign key constraints)
      await prisma.groupMember.deleteMany({
        where: { groupId: parseInt(id) },
      });

      // Delete all group files
      await prisma.file.deleteMany({
        where: { groupId: parseInt(id) },
      });

      // Delete all group discussions and their comments
      const discussions = await prisma.discussion.findMany({
        where: { groupId: parseInt(id) },
      });

      for (const discussion of discussions) {
        await prisma.comment.deleteMany({
          where: { discussionId: discussion.id },
        });
      }

      await prisma.discussion.deleteMany({
        where: { groupId: parseInt(id) },
      });

      await prisma.group.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get all members of a group
router.get(
  "/:id/members",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user is a member of the group
      const userMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(id),
          },
        },
      });

      if (!userMembership) {
        res.status(403).json({
          message: "You don't have permission to view this group's members",
        });
        return;
      }

      const members = await prisma.groupMember.findMany({
        where: { groupId: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      res.status(200).json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Change a user's role in a group (promote/demote)
router.put(
  "/:groupId/members/:userId/role",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;

      if (!role || !["ADMIN", "MEMBER"].includes(role)) {
        res.status(400).json({ message: "Invalid role" });
        return;
      }

      // Check if requester is an admin of the group
      const requesterMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(groupId),
          },
        },
      });

      if (!requesterMembership || requesterMembership.role !== "ADMIN") {
        res.status(403).json({
          message: "You don't have permission to change roles in this group",
        });
        return;
      }

      // Update the user's role
      await prisma.groupMember.update({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: parseInt(groupId),
          },
        },
        data: {
          role: Role.ADMIN,
        },
      });

      res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Remove a member from a group (admin only)
router.delete(
  "/:groupId/members/:userId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, userId } = req.params;

      // Check if requester is an admin of the group
      const requesterMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: req.user?.id!,
            groupId: parseInt(groupId),
          },
        },
      });

      if (!requesterMembership || requesterMembership.role !== "ADMIN") {
        res.status(403).json({
          message:
            "You don't have permission to remove members from this group",
        });
        return;
      }

      // Check that user is not removing themselves through this endpoint
      if (userId === req.user?.id) {
        res.status(400).json({
          message: "Use the leave-group endpoint to remove yourself",
        });
        return;
      }

      // Check if target user is the last admin
      const targetMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: parseInt(groupId),
          },
        },
      });

      if (targetMembership?.role === "ADMIN") {
        const adminCount = await prisma.groupMember.count({
          where: {
            groupId: parseInt(groupId),
            role: "ADMIN",
          },
        });

        if (adminCount === 1) {
          res.status(400).json({
            message:
              "Cannot remove the last admin. Promote another member to admin first.",
          });
          return;
        }
      }

      // Remove the member
      await prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId: userId,
            groupId: parseInt(groupId),
          },
        },
      });

      res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Search for groups by name
router.get(
  "/search",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { query } = req.query;

      const groups = await prisma.group.findMany({
        where: {
          name: {
            contains: query as string,
            mode: "insensitive", // Case insensitive search
          },
          members: {
            none: { userId: req.user?.id },
          },
        },
        // Limit the number of results
        take: 20,
        // Select only the necessary fields
        select: {
          id: true,
          name: true,
          private: true,
          description: true,
          // Count the number of members
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      // Transform the results to include member count
      const formattedGroups = groups.map((group) => ({
        id: group.id,
        name: group.name,
        private: group.private,
        description: group.description,
        memberCount: group._count.members,
      }));

      res.status(200).json(formattedGroups);
    } catch (error) {
      console.error("Error searching groups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
// Get group details by ID
router.get(
  "/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const group = await prisma.group.findUnique({
        where: { id: parseInt(id) },
        include: {
          members: {
            where: {
              role: "ADMIN",
            },
          },
        },
      });

      if (!group) {
        res.status(404).json({ message: "Group not found" });
        return;
      }

      // Check if user is a member of the group
      const isMember = group.members.some(
        (member) => member.userId === req.user?.id
      );

      if (!isMember) {
        // Remove sensitive information for non-members
        const { password, ...publicGroupInfo } = group;
        res.status(200).json(publicGroupInfo);
        return;
      }

      res.status(200).json(group);
    } catch (error) {
      console.error("Error fetching group details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
