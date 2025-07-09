"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import type { ColumnDef } from "@tanstack/react-table";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Activity,
  ChevronRight,
  EllipsisVertical,
  User as UserIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// Define User schema
type User = {
  id: string;
  approved: boolean;
  createdAt: any; // Firestore Timestamp
  displayName: string;
  email: string;
  photoUrl?: string;
  role: string;
};

// Define Activity schema
type Activity = {
  id: string;
  message: string;
  loggedAt: any; // Firestore Timestamp
  loggedBy: string; // email
};

// Expandable text component for activity messages
function ExpandableText({
  text,
  maxLength = 80,
}: {
  text: string;
  maxLength?: number;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (text.length <= maxLength) {
    return <span className="text-sm">{text}</span>;
  }

  return (
    <>
      <div className="text-sm">
        <span>{text.substring(0, maxLength)}...</span>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="ml-2 text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
        >
          <ChevronRight className="w-3 h-3 mr-1" />
          Show more
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>Full activity message</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {text}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Reusable confirmation dialog for actions
function ConfirmDialog({
  actionName,
  description,
  onConfirm,
  children,
}: {
  actionName: string;
  description: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Clone the trigger element to intercept clicks and open dialog without closing dropdown
  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    onSelect: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
  });
  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {actionName}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {description}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// User details dialog component
function UserDetailsDialog({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    onSelect: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
  });

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information for {user.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Avatar */}
            <div className="flex justify-center">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.displayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-sm text-gray-900">{user.displayName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Role
                </label>
                <div>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div>
                  {user.approved ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      Approved
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Member Since
                </label>
                <p className="text-sm text-gray-900">
                  {user.createdAt?.toDate().toLocaleDateString() || "N/A"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Admin() {
  const { user } = useUser();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "approved" | "unapproved"
  >("all");
  const [activeTab, setActiveTab] = useState<"users" | "activity">("users");
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      const rows = snapshot.docs.map((d) => {
        const u = d.data() as any;
        return {
          id: d.id,
          approved: u.approved,
          createdAt: u.createdAt,
          displayName: u.displayName,
          email: u.email,
          photoUrl: u.photoURL,
          role: u.role,
        } as User;
      });
      setData(rows);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Fetch activity data
  useEffect(() => {
    async function fetchActivity() {
      if (activeTab !== "activity") return;

      setActivityLoading(true);
      try {
        const activityQuery = query(
          collection(db, "activity"),
          orderBy("loggedAt", "desc"),
          limit(100), // Limit to last 100 activities for performance
        );
        const snapshot = await getDocs(activityQuery);
        const activities = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Activity,
        );
        setActivityData(activities);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setActivityLoading(false);
      }
    }
    fetchActivity();
  }, [activeTab]);

  // Refresh activity when actions are performed
  const refreshActivity = async () => {
    if (activeTab === "activity") {
      setActivityLoading(true);
      try {
        const activityQuery = query(
          collection(db, "activity"),
          orderBy("loggedAt", "desc"),
          limit(100),
        );
        const snapshot = await getDocs(activityQuery);
        const activities = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Activity,
        );
        setActivityData(activities);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setActivityLoading(false);
      }
    }
  };

  // Action handlers
  const handleApprove = async (u: User) => {
    await updateDoc(doc(db, "users", u.id), { approved: true });
    setData((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, approved: true } : x)),
    );

    // Log activity
    await addDoc(collection(db, "activity"), {
      message: `Approved user: ${u.displayName} (${u.email})`,
      loggedAt: serverTimestamp(),
      loggedBy: user?.email || "unknown",
    });

    // Refresh activity if on activity tab
    refreshActivity();
  };

  const handleDisapprove = async (u: User) => {
    await updateDoc(doc(db, "users", u.id), { approved: false });
    setData((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, approved: false } : x)),
    );

    // Log activity
    await addDoc(collection(db, "activity"), {
      message: `Disapproved user: ${u.displayName} (${u.email})`,
      loggedAt: serverTimestamp(),
      loggedBy: user?.email || "unknown",
    });

    // Refresh activity if on activity tab
    refreshActivity();
  };

  const handleDelete = async (u: User) => {
    await deleteDoc(doc(db, "users", u.id));
    setData((prev) => prev.filter((x) => x.id !== u.id));

    // Log activity
    await addDoc(collection(db, "activity"), {
      message: `Deleted user: ${u.displayName} (${u.email})`,
      loggedAt: serverTimestamp(),
      loggedBy: user?.email || "unknown",
    });

    // Refresh activity if on activity tab
    refreshActivity();
  };

  const handleRoleChange = async (u: User, role: string) => {
    await updateDoc(doc(db, "users", u.id), { role });
    setData((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));

    // Log activity
    await addDoc(collection(db, "activity"), {
      message: `Changed role for ${u.displayName} (${u.email}) to ${role}`,
      loggedAt: serverTimestamp(),
      loggedBy: user?.email || "unknown",
    });

    // Refresh activity if on activity tab
    refreshActivity();
  };

  // Filter data
  const filtered = data.filter((u) => {
    if (filterType === "all") return true;
    if (filterType === "approved") return u.approved;
    return !u.approved;
  });

  // Define columns
  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: "displayName", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: (info) => {
        const role = info.getValue() as string;
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "approved",
      header: "Approved",
      cell: (info) => {
        const approved = info.getValue() as boolean;
        return approved ? (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Yes
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            No
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (info) => {
        const ts = info.getValue() as any;
        return ts?.toDate().toLocaleString() || "";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <UserDetailsDialog user={row.original}>
              <DropdownMenuItem>View</DropdownMenuItem>
            </UserDetailsDialog>
            {row.original.approved ? (
              <ConfirmDialog
                actionName="Disapprove User"
                description="disapprove this user"
                onConfirm={() => handleDisapprove(row.original)}
              >
                <DropdownMenuItem>Disapprove</DropdownMenuItem>
              </ConfirmDialog>
            ) : (
              <ConfirmDialog
                actionName="Approve User"
                description="approve this user"
                onConfirm={() => handleApprove(row.original)}
              >
                <DropdownMenuItem>Approve</DropdownMenuItem>
              </ConfirmDialog>
            )}
            {row.original.role !== "admin" && (
              <ConfirmDialog
                actionName="Make Admin"
                description="grant admin rights to this user"
                onConfirm={() => handleRoleChange(row.original, "admin")}
              >
                <DropdownMenuItem>Make Admin</DropdownMenuItem>
              </ConfirmDialog>
            )}
            {row.original.role !== "user" && (
              <ConfirmDialog
                actionName="Make User"
                description="set this user role to user"
                onConfirm={() => handleRoleChange(row.original, "user")}
              >
                <DropdownMenuItem>Make User</DropdownMenuItem>
              </ConfirmDialog>
            )}
            <ConfirmDialog
              actionName="Delete User"
              description="delete this user"
              onConfirm={() => handleDelete(row.original)}
            >
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Define activity columns
  const activityColumns: ColumnDef<Activity, unknown>[] = [
    {
      accessorKey: "loggedAt",
      header: "Time",
      cell: (info) => {
        const ts = info.getValue() as any;
        return ts?.toDate().toLocaleString() || "";
      },
    },
    {
      accessorKey: "loggedBy",
      header: "User",
      cell: (info) => {
        const email = info.getValue() as string;
        return <span className="text-sm font-medium">{email}</span>;
      },
    },
    {
      accessorKey: "message",
      header: "Activity",
      cell: (info) => {
        const message = info.getValue() as string;
        return <ExpandableText text={message} maxLength={80} />;
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-gray-600">Manage users and view system activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "activity"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            System Activity
          </button>
        </nav>
      </div>

      {/* Users Tab Content */}
      {activeTab === "users" && (
        <>
          <div className="mb-4 space-x-2">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterType === "approved" ? "default" : "outline"}
              onClick={() => setFilterType("approved")}
            >
              Approved
            </Button>
            <Button
              size="sm"
              variant={filterType === "unapproved" ? "default" : "outline"}
              onClick={() => setFilterType("unapproved")}
            >
              Unapproved
            </Button>
          </div>
          <DataTable<User>
            data={filtered}
            columns={columns}
            loading={loading}
            showExport={false}
          />
        </>
      )}

      {/* Activity Tab Content */}
      {activeTab === "activity" && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing the last 100 system activities (most recent first)
            </p>
          </div>
          <DataTable<Activity>
            data={activityData}
            columns={activityColumns}
            loading={activityLoading}
            showExport={false}
          />
        </>
      )}
    </div>
  );
}
