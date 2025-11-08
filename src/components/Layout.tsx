import React, { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  LogOut,
  Menu,
  Shield,
  Calendar,
  Trophy,
  Camera,
  User,
  BarChart3,
  Bell,
} from "lucide-react";
import ctmoLogo from "@/assets/ctmo-logo.png";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Professores",
    href: "/teachers",
    icon: GraduationCap,
  },
  {
    title: "Turmas",
    href: "/classes",
    icon: Users,
  },
  {
    title: "Alunos",
    href: "/students",
    icon: UserCheck,
  },
  {
    title: "Frequência",
    href: "/attendance",
    icon: Calendar,
  },
];

function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin, isInstructor, roles } = useUserRole();
  const isStudent = roles.includes("user");

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-sidebar-border">
          {open ? (
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src={ctmoLogo} 
                alt="CTMO" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              />
              <div>
                <h1 className="text-lg md:text-xl font-bold">
                  <span className="text-primary">Portal</span>
                  <span className="text-foreground"> CTMO</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Centro de Treinamento Marcial
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src={ctmoLogo} 
                alt="CTMO" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 md:space-y-2 p-2 md:p-4">
              {/* Show different navigation based on role */}
              {isAdmin ? (
                <>
                  {/* Admin sees all menu items */}
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.href}
                            className={cn(
                              "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-300",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            {open && <span className="text-sm md:text-base font-medium">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/users"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/users"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Shield className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Usuários</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin-reports"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/admin-reports"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <BarChart3 className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Relatórios</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/enrollment-requests"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/enrollment-requests"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Bell className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Solicitações Turma</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/instructor-requests"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/instructor-requests"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <GraduationCap className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Solicitações Instrutor</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/training-feed"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/training-feed"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Camera className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Feed de Treinos</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/achievements"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/achievements"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Trophy className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Conquistas</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : isInstructor ? (
                <>
                  {/* Instructor only sees Dashboard and Classes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/instructor-dashboard"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/instructor-dashboard"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Dashboard</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/classes"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/classes"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Users className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Minhas Turmas</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/instructor-reports"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/instructor-reports"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <BarChart3 className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Relatórios</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/training-feed"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/training-feed"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Camera className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Feed Treinos</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/instructor-profile"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/instructor-profile"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <User className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Meu Perfil</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                /* Student view - show student portal and achievements */
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/student-portal"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/student-portal"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <UserCheck className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Meu Portal</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/achievements"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/achievements"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Trophy className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Conquistas</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/training-feed"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/training-feed"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Camera className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Feed de Treinos</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/student-profile"
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                          location.pathname === "/student-profile"
                            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_84%_50%_/_0.3)]"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <User className="w-5 h-5 shrink-0" />
                        {open && <span className="font-medium">Meu Perfil</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User section */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {user && open && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 border-border hover:bg-destructive hover:text-destructive-foreground",
              !open && "justify-center px-2"
            )}
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {open && "Sair"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col w-full min-w-0">
          {/* Mobile header with menu trigger */}
          <header className="sticky top-0 z-10 flex items-center gap-3 md:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 md:p-4 lg:hidden">
            <SidebarTrigger>
              <Menu className="h-5 w-5 md:h-6 md:w-6" />
            </SidebarTrigger>
            <h2 className="font-bold text-base md:text-lg">
              <span className="text-primary">Portal</span> CTMO
            </h2>
          </header>

          {/* Main content */}
          <div className="flex-1 p-3 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
