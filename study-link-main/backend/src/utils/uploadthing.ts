import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import prisma from "./prisma";
import { z } from "zod";
const f = createUploadthing();

export const uploadRouter = {
  profilePicture: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .input(z.object({ userId: z.string(), token: z.string() }))
    .middleware(async ({ input }) => {
      const session = await prisma.session.findUnique({
        where: {
          token: input.token,
        },
      });

      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: input.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          image: file.ufsUrl,
        },
      });
    }),

  discussionFiles: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        discussionId: z.string(),
        token: z.string(),
        groupId: z.string(),
      })
    )
    .middleware(async ({ input }) => {
      const session = await prisma.session.findUnique({
        where: { token: input.token },
      });

      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return {
        discussionId: input.discussionId,
        userId: session.userId,
        groupId: input.groupId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.file.create({
        data: {
          discussionId: parseInt(metadata.discussionId),
          url: file.ufsUrl,
          fileName: file.name,
          size: file.size,
          groupId: parseInt(metadata.groupId),
          uploadedById: metadata.userId,
        },
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
