import { InstructorProfileSetup } from "@/components/teachers/InstructorProfileSetup";
import { useNavigate } from "react-router-dom";

export default function InstructorSetup() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/instructor-dashboard");
  };

  return <InstructorProfileSetup onComplete={handleComplete} />;
}
