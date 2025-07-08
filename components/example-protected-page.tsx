// Example usage of individual page protection with role-based access
// You can use this in any page component as an alternative to the layout-based protection

import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useRole } from '@/hooks/use-role';
import { Spinner } from '@/components/ui/spinner';

// Example 1: Admin-only page
export function ExampleAdminPage() {
  const { loading, isAuthenticated, isApproved, hasRole } = useProtectedRoute(true, 'admin');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated || !isApproved || !hasRole) {
    return null; // Component will redirect via the hook
  }

  return (
    <div>
      <h1>Admin-Only Page</h1>
      <p>Only admin users can see this content.</p>
    </div>
  );
}

// Example 2: Regular protected page with conditional admin content
export function ExampleRegularPage() {
  const { loading, isAuthenticated, isApproved } = useProtectedRoute(true);
  const { isAdmin } = useRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated || !isApproved) {
    return null; // Component will redirect via the hook
  }

  return (
    <div>
      <h1>Regular Protected Page</h1>
      <p>All authenticated and approved users can see this content.</p>
      
      {isAdmin() && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h2>Admin Section</h2>
          <p>This section is only visible to admin users.</p>
        </div>
      )}
    </div>
  );
}

// Example 3: Multi-role access
export function ExampleMultiRolePage() {
  const { loading, isAuthenticated, isApproved, hasRole } = useProtectedRoute(true, ['admin', 'moderator']);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated || !isApproved || !hasRole) {
    return null; // Component will redirect via the hook
  }

  return (
    <div>
      <h1>Admin & Moderator Page</h1>
      <p>Only admin and moderator users can see this content.</p>
    </div>
  );
}
