import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  isOpen: boolean;
  isOpend(value: boolean): boolean
  setIsOpen(value: boolean): void
}

export function LogoutButton({ isOpen, isOpend, setIsOpen }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <Button 
    variant="ghost" 
    className={cn("w-full justify-start gap-3", !isOpen && "justify-center")}
    onClick={handleLogout}>
    <LogOut className="h-4 w-4" />
    {isOpen && <span>Выйти</span>}
  </Button>
  );
}