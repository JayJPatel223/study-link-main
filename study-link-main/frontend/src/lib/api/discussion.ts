import { apiClient } from "@lib/api-client";

export interface Discussion {
  id: number;
  title: string;
  content: string | null;
  authorId: string;
  groupId: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  _count: {
    comments: number;
  };
  comments?: Comment[];
}

export interface Comment {
  id: number;
  content: string;
  authorId: string;
  discussionId: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

// Fetch discussions for a group
export const fetchGroupDiscussions = async (
  groupId: number
): Promise<Discussion[]> => {
  const response = await apiClient.get(`/discussions/${groupId}`);
  return response.data;
};

// Get a specific discussion with comments
export const getDiscussion = async (
  groupId: number,
  discussionId: number
): Promise<Discussion> => {
  const response = await apiClient.get(
    `/discussions/${groupId}/${discussionId}`
  );
  return response.data;
};

// Create a new discussion
export const createDiscussion = async (
  groupId: number,
  data: { title: string; content?: string }
): Promise<Discussion> => {
  const response = await apiClient.post(`/discussions/${groupId}`, data);
  return response.data;
};

// Add a comment to a discussion
export const addComment = async (
  groupId: number,
  discussionId: number,
  data: { content: string }
): Promise<Comment> => {
  const response = await apiClient.post(
    `/discussions/comments/${groupId}/${discussionId}`,
    data
  );
  return response.data;
};

// Delete a discussion
export const deleteDiscussion = async (
  groupId: number,
  discussionId: number
): Promise<void> => {
  await apiClient.delete(`/discussions`, {
    data: {
      groupId,
      discussionId,
    },
  });
};

// Delete a comment
export const deleteComment = async (
  groupId: number,
  discussionId: number,
  commentId: number
) => {
  await apiClient.delete(`/discussions/comments`, {
    data: {
      groupId,
      discussionId,
      commentId,
    },
  });
};

// Update a discussion
export const updateDiscussion = async (
  groupId: number,
  discussionId: number,
  data: { title: string; content?: string }
): Promise<Discussion> => {
  const response = await apiClient.put(`/discussions`, {
    groupId,
    discussionId,
    ...data,
  });
  return response.data;
};

// Update a comment
export const updateComment = async (
  groupId: number,
  discussionId: number,
  commentId: number,
  data: { content: string }
): Promise<Comment> => {
  const response = await apiClient.put(`/discussions/comments`, {
    groupId,
    discussionId,
    commentId,
    ...data,
  });
  return response.data;
};
