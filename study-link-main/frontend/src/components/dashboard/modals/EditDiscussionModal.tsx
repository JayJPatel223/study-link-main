import { FormEvent, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Discussion } from "../../../lib/api/discussion";

interface EditDiscussionModalProps {
  discussion: Discussion | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateDiscussion: (
    id: number,
    title: string,
    content: string
  ) => Promise<void>;
}

const EditDiscussionModal = ({
  discussion,
  isOpen,
  onOpenChange,
  onUpdateDiscussion,
}: EditDiscussionModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discussion) {
      setFormData({
        title: discussion.title,
        content: discussion.content || "",
      });
    }
  }, [discussion]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!discussion || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateDiscussion(discussion.id, formData.title, formData.content);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!discussion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>
              Update your discussion details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                placeholder="Enter discussion title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-content" className="text-right">
                Content
              </Label>
              <Textarea
                id="edit-content"
                placeholder="Enter discussion content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: e.target.value,
                  })
                }
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Discussion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDiscussionModal;
