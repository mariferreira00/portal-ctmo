import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  checked_in_at: string;
  student: {
    full_name: string;
    email: string;
  };
  class: {
    name: string;
    schedule: string;
  };
}

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isInstructor } = useUserRole();

  useEffect(() => {
    if (isAdmin || isInstructor) {
      fetchAttendance();
    }
  }, [isAdmin, isInstructor]);

  async function fetchAttendance() {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          checked_in_at,
          student:students(full_name, email),
          class:classes(name, schedule)
        `)
        .order("checked_in_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setAttendanceRecords(data as any);
    } catch (error: any) {
      toast.error("Erro ao carregar frequência");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin && !isInstructor) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Users className="w-16 h-16 text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Acesso Restrito
            </h3>
            <p className="text-muted-foreground">
              Apenas administradores e instrutores podem acessar esta página.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Group by date
  const recordsByDate = attendanceRecords.reduce((acc, record) => {
    const date = new Date(record.checked_in_at).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Frequência dos Alunos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Acompanhe o histórico de check-ins dos alunos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {attendanceRecords.length}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hoje</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {recordsByDate[new Date().toLocaleDateString("pt-BR")]?.length || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Esta Semana</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {Object.entries(recordsByDate)
                  .filter(([date]) => {
                    const recordDate = new Date(date.split("/").reverse().join("-"));
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return recordDate >= weekAgo;
                  })
                  .reduce((sum, [, records]) => sum + records.length, 0)}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-primary opacity-50" />
          </div>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Histórico de Check-ins
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Data/Hora Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {record.student.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.student.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.class.name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.class.schedule}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(record.checked_in_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
