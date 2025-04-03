import { apiClient } from "@lib/api-client";

export interface File {
  id: number;
  fileName: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  uploadedById: string;
  discussion: {
    id: number;
    title: string;
  } | null;
  discussionId: number;
  groupId: number;
}

export const getGroupFiles = async (groupId: number): Promise<File[]> => {
  try {
    const response = await apiClient.get(`/files?groupId=${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group files:", error);
    throw error;
  }
};

export const searchFiles = async (
  groupId: number,
  fileName?: string,
  discussionId?: number
): Promise<File[]> => {
  try {
    const response = await apiClient.put("/files", {
      groupId,
      fileName,
      discussionId,
    });
    return response.data;
  } catch (error) {
    console.error("Error searching files:", error);
    throw error;
  }
};

export const getFileById = async (fileId: number): Promise<File> => {
  try {
    const response = await apiClient.get(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching file ${fileId}:`, error);
    throw error;
  }
};

export const deleteFile = async (
  fileId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
};

// This function formats file size in bytes to human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};
