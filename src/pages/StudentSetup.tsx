import { StudentProfileSetup } from "@/components/students/StudentProfileSetup";
import { useNavigate } from "react-router-dom";

export default function StudentSetup() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/student-portal");
  };

  return <StudentProfileSetup onComplete={handleComplete} />;
}
