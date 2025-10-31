import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, User, Calendar as CalendarIcon } from "lucide-react";

interface EnrollmentRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  message: string;
  created_at: string;
  student_id: string;
  class_id: string;
  students: {
    full_name: string;
    email: string;
  };
  classes: {
    name: string;
    schedule: string;
  };
}

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const { data, error } = await supabase
        .from("enrollment_requests")
        .select(`
          *,
          students (
            full_name,
            email
          ),
          classes (
            name,
            schedule
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as EnrollmentRequest[]);
    } catch (error: any) {
      toast.error("Erro ao carregar solicitações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string, studentId: string, classId: string) {
    try {
      // Create enrollment
      const { error: enrollError } = await supabase
        .from("class_enrollments")
        .insert([{
          student_id: studentId,
          class_id: classId,
        }]);

      if (enrollError) throw enrollError;

      // Update request status
      const { error: updateError } = await supabase
        .from("enrollment_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      toast.success("Matrícula aprovada com sucesso!");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao aprovar matrícula");
      console.error(error);
    }
  }

  async function handleReject(requestId: string) {
    try {
      const { error } = await supabase
        .from("enrollment_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Solicitação rejeitada");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao rejeitar solicitação");
      console.error(error);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="w-3 h-3" /> Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const reviewedRequests = requests.filter(r => r.status !== "pending");

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solicitações de Matrícula</h1>
        <p className="text-muted-foreground">
          Gerencie as solicitações de matrículas adicionais dos alunos
        </p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Pendentes ({pendingRequests.length})</h2>
        
        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação pendente</h3>
            <p className="text-muted-foreground">
              Todas as solicitações foram processadas
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{request.students.full_name}</p>
                      <p className="text-sm text-muted-foreground">{request.students.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{request.classes.name}</p>
                      <p className="text-sm text-muted-foreground">{request.classes.schedule}</p>
                    </div>
                  </div>

                  {request.message && (
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {request.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(request.id, request.student_id, request.class_id)}
                    className="flex-1"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Processadas ({reviewedRequests.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewedRequests.map((request) => (
              <Card key={request.id} className="p-6 opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="font-semibold">{request.students.full_name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <p className="font-semibold">{request.classes.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentRequests;
