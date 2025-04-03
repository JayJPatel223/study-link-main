import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/auth";
import { CardHeader, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import GroupMembers from "./GroupMembers";
import GroupSettings from "./GroupSettings";
import DiscussionsLayout from "./DiscussionsLayout";
import { Loader2, ShieldAlert, Download, Trash2 } from "lucide-react";
import {
  getGroupById,
  getGroupMembers,
  Group,
  GroupMember,
} from "@lib/api/group";
import {
  getGroupFiles,
  File as FileType,
  formatFileSize,
  deleteFile,
} from "@lib/api/files";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

interface GroupDetailsProps {
  groupId: number;
}

const GroupDetails = ({ groupId }: GroupDetailsProps) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("discussions");
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const [groupData, members] = await Promise.all([
          getGroupById(groupId),
          getGroupMembers(groupId),
        ]);

        setMembers(members);
        setGroup(groupData);

        const userIsAdmin = members.some(
          (member) =>
            String(member.userId) === String(user?.id) &&
            member.role === "ADMIN"
        );
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error("Error fetching group details:", error);
        setError("Failed to load group details. Please try again.");
      } finally {
        setLoading(false);
        setFetchTrigger(0);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, user, fetchTrigger]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (activeTab === "files" && groupId) {
        try {
          setLoadingFiles(true);
          const filesData = await getGroupFiles(groupId);
          setFiles(filesData);
        } catch (error) {
          console.error("Error fetching files:", error);
          toast({
            title: "Error",
            description: "Failed to load files. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoadingFiles(false);
        }
      }
    };

    fetchFiles();
  }, [activeTab, groupId, fetchTrigger]);

  const handleFileDownload = (file: FileType) => {
    window.open(file.url, "_blank");
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      await deleteFile(fileId);
      setFiles(files.filter((file) => file.id !== fileId));
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "discussions", label: "Discussions" },
    { id: "files", label: "Files & Resources" },
    { id: "members", label: "Members" },
    ...(isAdmin ? [{ id: "settings", label: "Settings" }] : []),
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground">
          Group not found. Please select another group.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center text-xs font-medium text-primary">
              <ShieldAlert className="w-4 h-4 mr-1" />
              Admin
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 h-full ">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="discussions"
            className="flex-1 border-none data-[state=active]:flex"
          >
            <DiscussionsLayout groupId={groupId} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent
            value="files"
            className="flex-1 border-none p-6 data-[state=active]:flex flex-col"
          >
            {loadingFiles ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  No files have been uploaded to this group yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableCaption>Files uploaded to this group</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Discussion</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        {file.fileName}
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {file.discussion ? file.discussion.title : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {file.uploadedBy.image ? (
                            <img
                              src={file.uploadedBy.image}
                              alt={file.uploadedBy.name}
                              className="h-6 w-6 rounded-full mr-2"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
                              {file.uploadedBy.name.charAt(0)}
                            </div>
                          )}
                          <span>{file.uploadedBy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleFileDownload(file)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(isAdmin || file.uploadedById === user?.id) && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleFileDelete(file.id)}
                              title="Delete"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent
            value="members"
            className="flex-1 border-none p-6 data-[state=active]:flex"
          >
            <GroupMembers
              groupId={groupId}
              isAdmin={isAdmin}
              members={members}
              setFetchTrigger={setFetchTrigger}
            />
          </TabsContent>

          <TabsContent
            value="settings"
            className="flex-1 border-none p-6 data-[state=active]:flex"
          >
            {isAdmin === true ? (
              <GroupSettings
                groupId={groupId}
                isAdmin={isAdmin}
                groupData={group}
                onGroupUpdated={setGroup}
                setFetchTrigger={setFetchTrigger}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                  <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Admin Access Required
                  </h3>
                  <p className="text-muted-foreground">
                    Only group administrators can access and modify settings.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  );
};

export default GroupDetails;
