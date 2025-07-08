"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { EllipsisVertical, User as UserIcon } from "lucide-react";

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
  const trigger = React.cloneElement(
    children as React.ReactElement<any>,
    {
      onSelect: (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      },
    }
  );
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
            <Button variant="destructive" onClick={() => { onConfirm(); setOpen(false); }}>
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
  
  const trigger = React.cloneElement(
    children as React.ReactElement<any>,
    {
      onSelect: (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      },
    }
  );

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
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{user.displayName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div>
                  {user.approved ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-semibold">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-sm text-gray-900">
                  {user.createdAt?.toDate().toLocaleDateString() || 'N/A'}
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
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'unapproved'>('all');

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
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

  // Action handlers
  const handleApprove = async (u: User) => {
    await updateDoc(doc(db, 'users', u.id), { approved: true });
    setData((prev) => prev.map((x) => (x.id === u.id ? { ...x, approved: true } : x)));
  };
  const handleDisapprove = async (u: User) => {
    await updateDoc(doc(db, 'users', u.id), { approved: false });
    setData((prev) => prev.map((x) => (x.id === u.id ? { ...x, approved: false } : x)));
  };
  const handleDelete = async (u: User) => {
    await deleteDoc(doc(db, 'users', u.id));
    setData((prev) => prev.filter((x) => x.id !== u.id));
  };
  const handleRoleChange = async (u: User, role: string) => {
    await updateDoc(doc(db, 'users', u.id), { role });
    setData((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
  };

  // Filter data
  const filtered = data.filter((u) => {
    if (filterType === 'all') return true;
    if (filterType === 'approved') return u.approved;
    return !u.approved;
  });

  // Define columns
  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: 'displayName', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: (info) => {
        const role = info.getValue() as string;
        let color = '';
        if (role === 'admin') color = 'bg-blue-100 text-blue-800';
        else color = 'bg-gray-100 text-gray-800';
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'approved',
      header: 'Approved',
      cell: (info) => {
        const approved = info.getValue() as boolean;
        return approved ? (
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">Yes</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-semibold">No</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: (info) => {
        const ts = info.getValue() as any;
        return ts?.toDate().toLocaleString() || '';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
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
            {row.original.role !== 'admin' && (
              <ConfirmDialog
                actionName="Make Admin"
                description="grant admin rights to this user"
                onConfirm={() => handleRoleChange(row.original, 'admin')}
              >
                <DropdownMenuItem>Make Admin</DropdownMenuItem>
              </ConfirmDialog>
            )}
            {row.original.role !== 'user' && (
              <ConfirmDialog
                actionName="Make User"
                description="set this user role to user"
                onConfirm={() => handleRoleChange(row.original, 'user')}
              >
                <DropdownMenuItem>Make User</DropdownMenuItem>
              </ConfirmDialog>
            )}
            <ConfirmDialog
              actionName="Delete User"
              description="delete this user"
              onConfirm={() => handleDelete(row.original)}
            >
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </ConfirmDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Administration</h1>
        <p className="text-gray-600">Manage user approvals and roles</p>
      </div>
      <div className="mb-4 space-x-2">
        <Button size="sm" variant={filterType === 'all' ? 'default' : 'outline'} onClick={() => setFilterType('all')}>
          All
        </Button>
        <Button size="sm" variant={filterType === 'approved' ? 'default' : 'outline'} onClick={() => setFilterType('approved')}>
          Approved
        </Button>
        <Button size="sm" variant={filterType === 'unapproved' ? 'default' : 'outline'} onClick={() => setFilterType('unapproved')}>
          Unapproved
        </Button>
      </div>
      <DataTable<User>
        data={filtered}
        columns={columns}
        loading={loading}
        showExport={false}
      />
    </div>
  );
}