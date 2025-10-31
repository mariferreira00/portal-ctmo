import { StudentProfileSetup } from "@/components/students/StudentProfileSetup";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function StudentSetup() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleComplete = () => {
    navigate("/student-portal");
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
      <StudentProfileSetup onComplete={handleComplete} />
    </div>
  );
}
