import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = "admin" | "instructor" | "user";

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: UserRole[];
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  async function fetchUsers() {
    try {
      // Fetch profiles with emails using the secure RPC function
      const { data: profiles, error: profilesError } = await supabase
        .rpc("get_users_with_emails");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile: any) => {
        const roles = userRoles
          ?.filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as UserRole) || [];

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          roles: roles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      // Remove all existing roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Add new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success("Permissão atualizada com sucesso!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar permissão");
      console.error(error);
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "instructor":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-3 h-3" />;
      case "instructor":
        return <UserCog className="w-3 h-3" />;
      default:
        return <UserIcon className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "instructor":
        return "Instrutor";
      default:
        return "Usuário";
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Shield className="w-16 h-16 text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Acesso Restrito
            </h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Gerenciar Usuários
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Defina permissões de acesso para cada usuário
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-6 bg-card border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">
                    {user.email[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {user.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className={getRoleBadgeColor(role)}
                      >
                        <span className="flex items-center gap-1">
                          {getRoleIcon(role)}
                          {getRoleLabel(role)}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={user.roles[0] || "user"}
                  onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione uma permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="instructor">Instrutor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Users;
