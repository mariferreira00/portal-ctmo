import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type InstructorRequest = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
  profiles: {
    full_name: string;
  } | null;
};

export default function InstructorRequests() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
      return;
    }

    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from("instructor_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", request.user_id)
            .single();

          return {
            ...request,
            profiles: profile,
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("instructor_requests")
        .update({
          status: "approved",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Add instructor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "instructor",
        });

      if (roleError) throw roleError;

      toast.success("Solicitação aprovada com sucesso!");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Erro ao aprovar solicitação");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("instructor_requests")
        .update({
          status: "rejected",
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Solicitação rejeitada");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Erro ao rejeitar solicitação");
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Solicitações de Instrutor</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de usuários que querem se tornar instrutores
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma solicitação encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {request.profiles?.full_name || "Nome não disponível"}
                      </CardTitle>
                      <CardDescription>
                        Solicitado em{" "}
                        {new Date(request.created_at).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {request.status === "approved" && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {request.status === "rejected" && (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {request.status === "pending" && (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {request.status === "approved"
                        ? "Aprovado"
                        : request.status === "rejected"
                        ? "Rejeitado"
                        : "Pendente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.status === "pending" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Notas (opcional)
                        </label>
                        <Textarea
                          placeholder="Adicione observações sobre esta solicitação..."
                          value={notes[request.id] || ""}
                          onChange={(e) =>
                            setNotes({ ...notes, [request.id]: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.id, request.user_id)}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                  {request.status !== "pending" && request.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notas:</strong> {request.notes}
                    </div>
                  )}
                  {request.reviewed_at && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Revisado em{" "}
                      {new Date(request.reviewed_at).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
