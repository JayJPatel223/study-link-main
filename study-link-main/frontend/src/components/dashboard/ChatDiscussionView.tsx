import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/auth";
import { Button } from "@components/ui/button";
import { Loader2, Send, Edit, Trash2, Check, X } from "lucide-react";
import { useToast } from "@components/ui/use-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import {
  addComment,
  deleteComment,
  updateComment,
  Discussion,
  Comment,
  getDiscussion,
} from "@lib/api/discussion";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { ScrollArea } from "@components/ui/scroll-area";
import DeleteCommentModal from "./modals/DeleteCommentModal";
import { Input } from "@components/ui/input";
import { ChatSkeleton } from "@components/ui/chat-skeleton";

interface ChatDiscussionViewProps {
  groupId: number;
  discussionId: number;
  isAdmin: boolean;
  discussion?: Discussion | null;
  discussionLoading?: boolean;
  onCommentDeleted?: (discussionId: number, commentCount: number) => void;
  onUpdateDiscussion?: (discussion: Discussion) => void;
}

// Helper functions
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Helper function to format dates for message groups
const getDateDisplay = (date: Date): string => {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMMM d, yyyy");
  }
};

// Comment component
interface CommentItemProps {
  comment: Comment;
  isCurrentUser: boolean;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: number) => void;
  showAvatar: boolean;
  isFirstInGroup: boolean;
}

const CommentItem = ({
  comment,
  isCurrentUser,
  onEdit,
  onDelete,
  showAvatar,
  isFirstInGroup,
}: CommentItemProps) => (
  <div
    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${
      !isFirstInGroup ? "mt-1" : "mt-6"
    }`}
  >
    <div
      className={`flex gap-3 max-w-[80%] ${
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {showAvatar ? (
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage
            src={comment.author.image || ""}
            alt={comment.author.name}
          />
          <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 flex-shrink-0" /> // Empty spacer to maintain alignment
      )}

      <div>
        {!isCurrentUser && isFirstInGroup && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {comment.author.name}
          </div>
        )}
        <div className="flex flex-col">
          <div
            className={`flex items-center gap-2 ${
              isCurrentUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`rounded-3xl max-w-64 p-2.5 ${
                isCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(comment.createdAt), "h:mm a")}
            </span>
          </div>

          {isCurrentUser && (
            <div className="flex justify-end gap-1 mt-1 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEdit(comment)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Date Separator Component
interface DateSeparatorProps {
  date: string;
}

const DateSeparator = ({ date }: DateSeparatorProps) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
      {date}
    </div>
  </div>
);

// Edit Comment Form
interface EditCommentFormProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const EditCommentForm = ({
  content,
  onChange,
  onSave,
  onCancel,
  isSubmitting,
}: EditCommentFormProps) => (
  <div className="space-y-2">
    <Input
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[200px] bg-background text-foreground border-muted-foreground/30"
    />
    <div className="flex justify-end gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/30"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onSave}
        disabled={isSubmitting}
        className="h-8 w-8"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
);

// Message Input Form
interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const MessageInput = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: MessageInputProps) => (
  <form onSubmit={onSubmit} className="flex gap-2">
    <Input
      placeholder="Type your message..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 rounded-full h-11"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (value.trim()) {
            onSubmit(e);
          }
        }
      }}
    />
    <Button
      type="submit"
      className="self-end rounded-full h-11"
      disabled={isSubmitting || !value.trim()}
    >
      <Send className="h-4 w-4" />
    </Button>
  </form>
);

// Main component
const ChatDiscussionView = ({
  groupId,
  discussionId,
  discussion,
  discussionLoading = false,
  onCommentDeleted,
  onUpdateDiscussion,
}: ChatDiscussionViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Consolidated state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [lastCommentId, setLastCommentId] = useState<number | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set comments from the discussion prop
  useEffect(() => {
    if (discussion && discussion.comments) {
      setComments(discussion.comments);

      // Update lastCommentId for comparison during polling
      if (discussion.comments.length > 0) {
        const lastComment = discussion.comments[discussion.comments.length - 1];
        setLastCommentId(lastComment.id);
      }

      setLoading(false);
    } else {
      // If no comments in discussion, set empty array
      setComments([]);
      setLoading(discussionLoading);
    }
  }, [discussion, discussionLoading]);

  // Polling function to fetch latest discussion data
  const pollForNewComments = useCallback(async () => {
    if (!groupId || !discussionId) return;

    try {
      const latestDiscussion = await getDiscussion(groupId, discussionId);

      // Check if there are new comments
      if (latestDiscussion.comments?.length) {
        const newLastComment =
          latestDiscussion.comments[latestDiscussion.comments.length - 1];

        // Only update if there are new comments
        if (!lastCommentId || newLastComment.id > lastCommentId) {
          setComments(latestDiscussion.comments);
          setLastCommentId(newLastComment.id);

          // Update parent component if callback exists
          if (onUpdateDiscussion) {
            onUpdateDiscussion(latestDiscussion);
          }
        }
      }
    } catch (error) {
      console.error("Failed to poll for new comments:", error);
    }
  }, [groupId, discussionId, lastCommentId, onUpdateDiscussion]);

  // Set up polling interval
  useEffect(() => {
    // Start polling when component mounts
    pollIntervalRef.current = setInterval(pollForNewComments, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollForNewComments]);

  // Scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // CRUD operations
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const comment = await addComment(groupId, discussionId, {
        content: newComment,
      });

      // Update local comments state
      setComments((prevComments) => [...prevComments, comment]);

      // Update both count AND comments array in parent component
      if (onUpdateDiscussion && discussion) {
        onUpdateDiscussion({
          ...discussion,
          comments: [...(discussion.comments || []), comment],
          _count: {
            ...discussion._count,
            comments: (discussion._count?.comments || 0) + 1,
          },
        });
      }

      setNewComment("");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    // Only allow author to edit their own comments
    if (comment.authorId === user?.id) {
      setEditingComment(comment.id);
      setEditContent(comment.content);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateComment(groupId, discussionId, commentId, {
        content: editContent,
      });

      // Update the local comments array
      setComments((prevComments) =>
        prevComments.map((c) => (c.id === commentId ? updated : c))
      );

      setEditingComment(null);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update comment. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const openDeleteCommentDialog = (commentId: number) => {
    // Only allow author to delete their own comments
    const comment = comments.find((c) => c.id === commentId);

    // Only allow author to delete their own comments
    if (comment && comment.authorId === user?.id) {
      setDeleteDialogOpen(true);
      setCommentToDelete(commentId);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(groupId, discussionId, commentToDelete);

      // Update local comments array
      setComments((prevComments) =>
        prevComments.filter((c) => c.id !== commentToDelete)
      );

      // Update comment count in parent component
      if (onUpdateDiscussion && discussion) {
        onUpdateDiscussion({
          ...discussion,
          _count: {
            ...discussion._count,
            comments: Math.max(0, (discussion._count?.comments || 1) - 1),
          },
        });
      }

      // Notify parent component
      if (onCommentDeleted) {
        onCommentDeleted(discussionId, comments.length - 1);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-227px)] min-w-[40vw]">
      <div className="px-4 py-3 border-b flex-shrink-0">
        <h2 className="text-xl font-semibold">Group Chat</h2>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-3 overflow-y-auto" ref={scrollAreaRef}>
          {loading ? (
            <ChatSkeleton />
          ) : (
            <div className="space-y-2">
              {discussion?.comments && discussion.comments.length > 0 ? (
                <>
                  {discussion.comments.reduce<React.ReactNode[]>(
                    (elements, comment, index) => {
                      const currentDate = new Date(comment.createdAt);
                      const isCurrentUser = comment.authorId === user?.id;

                      // Check if this comment is from the same author as the previous one
                      const prevComment =
                        index > 0 && discussion.comments
                          ? discussion.comments[index - 1]
                          : null;
                      const isSameAuthorAsPrevious =
                        prevComment &&
                        prevComment.authorId === comment.authorId;

                      // Only show avatar for the first message in a sequence from the same author
                      const showAvatar = !isSameAuthorAsPrevious;
                      const isFirstInGroup = !isSameAuthorAsPrevious;

                      // Add date separator if this is the first message or date changed since previous message
                      if (
                        index === 0 ||
                        (prevComment &&
                          !isSameDay(
                            currentDate,
                            new Date(prevComment.createdAt)
                          ))
                      ) {
                        elements.push(
                          <DateSeparator
                            key={`date-${comment.id}`}
                            date={getDateDisplay(currentDate)}
                          />
                        );
                      }

                      // Add the comment
                      if (editingComment === comment.id) {
                        if (isCurrentUser) {
                          elements.push(
                            <div
                              key={comment.id}
                              className={`flex ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              } ${!isFirstInGroup ? "mt-1" : "mt-6"}`}
                            >
                              <div
                                className={`flex gap-3 max-w-[80%] ${
                                  isCurrentUser
                                    ? "flex-row-reverse"
                                    : "flex-row"
                                }`}
                              >
                                {showAvatar ? (
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage
                                      src={comment.author.image || ""}
                                      alt={comment.author.name}
                                    />
                                    <AvatarFallback>
                                      {getInitials(comment.author.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-10 flex-shrink-0" />
                                )}
                                <div>
                                  {!isCurrentUser && isFirstInGroup && (
                                    <div className="text-sm font-medium mb-1">
                                      {comment.author.name}
                                    </div>
                                  )}
                                  <div
                                    className={`rounded-lg p-3 ${
                                      isCurrentUser
                                        ? "bg-background border border-primary/30"
                                        : "bg-background border border-muted/50"
                                    }`}
                                  >
                                    <EditCommentForm
                                      content={editContent}
                                      onChange={(content) =>
                                        setEditContent(content)
                                      }
                                      onSave={() =>
                                        handleUpdateComment(comment.id)
                                      }
                                      onCancel={() => setEditingComment(null)}
                                      isSubmitting={isSubmitting}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // If not the author, just show the regular comment without edit form
                          elements.push(
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              isCurrentUser={isCurrentUser}
                              onEdit={handleEditComment}
                              onDelete={openDeleteCommentDialog}
                              showAvatar={showAvatar}
                              isFirstInGroup={isFirstInGroup}
                            />
                          );
                        }
                      } else {
                        elements.push(
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            isCurrentUser={isCurrentUser}
                            onEdit={handleEditComment}
                            onDelete={openDeleteCommentDialog}
                            showAvatar={showAvatar}
                            isFirstInGroup={isFirstInGroup}
                          />
                        );
                      }

                      return elements;
                    },
                    []
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t sticky bottom-0 bg-background flex-shrink-0">
          <MessageInput
            value={newComment}
            onChange={(value) => setNewComment(value)}
            onSubmit={handleAddComment}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <DeleteCommentModal
        isOpen={deleteDialogOpen}
        onOpenChange={(isOpen) => setDeleteDialogOpen(isOpen)}
        onConfirmDelete={handleDeleteComment}
      />
    </div>
  );
};

export default ChatDiscussionView;
