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
import { IconChevronDown } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

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
          photoUrl: u.photoUrl,
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
    { accessorKey: 'role', header: 'Role' },
    {
      accessorKey: 'approved',
      header: 'Approved',
      cell: (info) => (info.getValue() ? 'Yes' : 'No'),
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
              <IconChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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