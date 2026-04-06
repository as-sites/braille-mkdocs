import { useState } from "react";
import {
  FileText,
  Home,
  Image,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/media", label: "Media", icon: Image },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserFooter() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="grid gap-2 text-sm">
      <span className="text-muted-foreground truncate">
        {user?.name ?? user?.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2"
        onClick={() => {
          void logout().finally(() => {
            navigate("/login");
          });
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const crumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col border-r border-border bg-sidebar p-5">
        <h1 className="text-lg font-bold mb-4">Braille Docs</h1>
        <div className="flex-1">
          <NavLinks />
        </div>
        <Separator className="my-3" />
        <UserFooter />
      </aside>

      {/* Mobile header + sheet */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <h1 className="text-lg font-bold">Braille Docs</h1>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-5">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-col h-full">
              <div className="flex-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <Separator className="my-3" />
              <UserFooter />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="p-4 md:p-6">
        <header className="flex justify-between items-center gap-4 flex-wrap mb-4">
          <span className="text-sm text-muted-foreground">Admin workspace</span>
          <span className="text-sm text-muted-foreground">
            {crumbs.length > 0 ? crumbs.join(" / ") : "dashboard"}
          </span>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
