'use client';

import { Logo } from './logo';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/lib/firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase/config';

export function Header() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  
  // Don't render header on login/register pages
  if (pathname === '/login' || pathname === '/register') {
      return null;
  }
  
  // Don't render header for contest page
  if (pathname.startsWith('/contest/')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9 border">
            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href={isAdminPath ? "/dashboard" : "/admin/dashboard"}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>{isAdminPath ? "Student View" : "Admin Dashboard"}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/leaderboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Leaderboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
