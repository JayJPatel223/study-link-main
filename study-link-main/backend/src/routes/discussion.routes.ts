import { Router, Response } from "express";
import { authenticateUser } from "../middlewares/authenticateUser";
import { AuthenticatedRequest } from "../types/auth-req";
import prisma from "../utils/prisma";

const router = Router();

// Get all discussions for a group
router.get(
  "/:groupId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId } = req.params;

      // Check if user is a member of the group
      const userMembership = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parseInt(groupId),
        },
      });

      if (!userMembership) {
        res.status(403).json({
          message:
            "You don't have permission to view discussions in this group",
        });
        return;
      }

      // Fetch discussions including comment counts
      const discussions = await prisma.discussion.findMany({
        where: {
          groupId: parseInt(groupId),
          deletedAt: null, // Only fetch non-deleted discussions
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: {
                where: {
                  deletedAt: null, // Only count non-deleted comments
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get a specific discussion with comments
router.get(
  "/:groupId/:discussionId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId } = req.params;

      // Check if user is a member of the group
      const userMembership = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parseInt(groupId),
        },
      });

      if (!userMembership) {
        res.status(403).json({
          message:
            "You don't have permission to view discussions in this group",
        });
        return;
      }

      // Fetch the discussion with comments
      const discussion = await prisma.discussion.findFirst({
        where: {
          id: parseInt(discussionId),
          groupId: parseInt(groupId),
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          comments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: {
                where: {
                  deletedAt: null, // Only count non-deleted comments
                },
              },
            },
          },
        },
      });

      if (!discussion) {
        res.status(404).json({ message: "Discussion not found" });
        return;
      }

      res.status(200).json(discussion);
    } catch (error) {
      console.error("Error fetching discussion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create a new discussion
router.post(
  "/:groupId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId } = req.params;
      const { title, content } = req.body;
      const parsedGroupId = parseInt(groupId);

      if (!title) {
        res.status(400).json({ message: "Title is required" });
        return;
      }

      // Check if user is a member of the group
      const isMember = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
      });

      if (!isMember) {
        res.status(403).json({ message: "Not a member of this group" });
        return;
      }

      const discussion = await prisma.discussion.create({
        data: {
          title,
          content,
          groupId: parsedGroupId,
          authorId: req.user?.id!,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Add a comment to a discussion
router.post(
  "/comments/:groupId/:discussionId",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId } = req.params;
      const { content } = req.body;
      const parsedGroupId = parseInt(groupId);
      const parsedDiscussionId = parseInt(discussionId);

      if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
      }

      // Check if user is a member of the group
      const isMember = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
      });

      if (!isMember) {
        res.status(403).json({ message: "Not a member of this group" });
        return;
      }

      // Check if discussion exists and belongs to the group
      const discussion = await prisma.discussion.findFirst({
        where: {
          id: parsedDiscussionId,
          groupId: parsedGroupId,
          deletedAt: null,
        },
      });

      if (!discussion) {
        res.status(404).json({ message: "Discussion not found" });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          discussionId: parsedDiscussionId,
          authorId: req.user?.id!,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete a discussion (soft delete)
router.delete(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId } = req.body;
      const parsedGroupId = parseInt(groupId);
      const parsedDiscussionId = parseInt(discussionId);

      // Check if discussion exists
      const discussion = await prisma.discussion.findFirst({
        where: {
          id: parsedDiscussionId,
          groupId: parsedGroupId,
          deletedAt: null,
        },
      });

      if (!discussion) {
        res.status(404).json({ message: "Discussion not found" });
        return;
      }

      // Check if user is the author or an admin
      const userRole = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
        select: {
          role: true,
        },
      });

      if (discussion.authorId !== req.user?.id && userRole?.role !== "ADMIN") {
        res
          .status(403)
          .json({ message: "Not authorized to delete this discussion" });
        return;
      }

      // Soft delete
      await prisma.discussion.update({
        where: {
          id: parsedDiscussionId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      res.status(200).json({ message: "Discussion deleted successfully" });
    } catch (error) {
      console.error("Error deleting discussion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete a comment or comments (soft delete)
router.delete(
  "/comments",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId, commentId } = req.body;
      const parsedGroupId = parseInt(groupId);
      const parsedDiscussionId = parseInt(discussionId);
      const parsedCommentId = parseInt(commentId);

      // Check if comment exists
      const comment = await prisma.comment.findFirst({
        where: {
          id: parsedCommentId,
          discussionId: parsedDiscussionId,
          deletedAt: null,
        },
        include: {
          discussion: {
            select: {
              groupId: true,
            },
          },
        },
      });

      if (!comment || comment.discussion.groupId !== parsedGroupId) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      // Check if user is the author or an admin
      const userRole = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
        select: {
          role: true,
        },
      });

      if (comment.authorId !== req.user?.id && userRole?.role !== "ADMIN") {
        res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
        return;
      }

      // Soft delete
      await prisma.comment.update({
        where: {
          id: parsedCommentId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Edit a discussion
router.put(
  "/",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId, title, content } = req.body;
      const parsedGroupId = parseInt(groupId);
      const parsedDiscussionId = parseInt(discussionId);

      if (!title) {
        res.status(400).json({ message: "Title is required" });
        return;
      }

      // Check if discussion exists
      const discussion = await prisma.discussion.findFirst({
        where: {
          id: parsedDiscussionId,
          groupId: parsedGroupId,
          deletedAt: null,
        },
      });

      if (!discussion) {
        res.status(404).json({ message: "Discussion not found" });
        return;
      }

      // Check if user is the author or an admin
      const userRole = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
        select: {
          role: true,
        },
      });

      if (discussion.authorId !== req.user?.id && userRole?.role !== "ADMIN") {
        res
          .status(403)
          .json({ message: "Not authorized to edit this discussion" });
        return;
      }

      // Update the discussion
      const updatedDiscussion = await prisma.discussion.update({
        where: {
          id: parsedDiscussionId,
        },
        data: {
          title,
          content,
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      res.status(200).json(updatedDiscussion);
    } catch (error) {
      console.error("Error updating discussion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Edit a comment
router.put(
  "/comments",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, discussionId, commentId, content } = req.body;
      const parsedGroupId = parseInt(groupId);
      const parsedDiscussionId = parseInt(discussionId);
      const parsedCommentId = parseInt(commentId);

      if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
      }

      // Check if comment exists
      const comment = await prisma.comment.findFirst({
        where: {
          id: parsedCommentId,
          discussionId: parsedDiscussionId,
          deletedAt: null,
        },
        include: {
          discussion: {
            select: {
              groupId: true,
            },
          },
        },
      });

      if (!comment || comment.discussion.groupId !== parsedGroupId) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      // Check if user is the author or an admin
      const userRole = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
        select: {
          role: true,
        },
      });

      if (comment.authorId !== req.user?.id && userRole?.role !== "ADMIN") {
        res
          .status(403)
          .json({ message: "Not authorized to edit this comment" });
        return;
      }

      // Update the comment
      const updatedComment = await prisma.comment.update({
        where: {
          id: parsedCommentId,
        },
        data: {
          content,
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      res.status(200).json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get discussions by author in a group
router.get(
  "/author",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { groupId, authorId } = req.body;
      const parsedGroupId = parseInt(groupId);

      // Check if user is a member of the group
      const isMember = await prisma.groupMember.findFirst({
        where: {
          userId: req.user?.id!,
          groupId: parsedGroupId,
        },
      });

      if (!isMember) {
        res.status(403).json({ message: "Not a member of this group" });
        return;
      }

      // Get the author details
      const author = await prisma.user.findUnique({
        where: {
          id: authorId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }

      // Check if the author is a member of the group
      const isAuthorMember = await prisma.groupMember.findFirst({
        where: {
          userId: authorId,
          groupId: parsedGroupId,
        },
      });

      if (!isAuthorMember) {
        res
          .status(404)
          .json({ message: "Author is not a member of this group" });
        return;
      }

      const discussions = await prisma.discussion.findMany({
        where: {
          groupId: parsedGroupId,
          authorId: authorId,
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        author,
        discussions,
      });
    } catch (error) {
      console.error("Error fetching discussions by author:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
