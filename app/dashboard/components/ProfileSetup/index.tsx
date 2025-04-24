"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error";

export function ProfileSetupPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: number; class_name: string }[]>(
    []
  );
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch classes and regions when component mounts
    const fetchData = async () => {
      try {
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, class_name")
          .neq('class_name', 'captain');

        const { data: regionData, error: regionError } = await supabase
          .from("regions")
          .select("id, name");

        if (classError) throw classError;
        if (regionError) throw regionError;

        if (classData) setClasses(classData);
        if (regionData) setRegions(regionData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(getErrorMessage(error));
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
  
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");
  
      // Find the selected class object
      const selectedClassObj = classes.find(cls => cls.id.toString() === selectedClass);
      const selectedRegionObj = regions.find(region => region.id.toString() === selectedRegion);
      
      if (!selectedClassObj && selectedClass) {
        throw new Error("Selected class not found");
      }
      if (!selectedRegionObj && selectedRegion) {
        throw new Error("Selected region not found");
      }
      
      console.log({
        id: user.id,
        name: name,
        age: parseInt(age) || null,
        role: "user", // Фиксированное значение для обычных пользователей
        class: selectedClassObj?.class_name || null, // Сохраняем название класса
        region: selectedRegionObj?.id || null, // Сохраняем ID региона
        created_at: new Date().toISOString(),
      })
      // Update profile information
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: name,
          age: parseInt(age) || null,
          role: "user", // Фиксированное значение для обычных пользователей
          class: selectedClassObj?.class_name || null, // Сохраняем название класса
          region: selectedRegionObj?.id || null, // Сохраняем ID региона
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });
  
      if (error) throw error;
  
      toast.success("Profile setup complete!");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Profile setup error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Почти готово!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Пожалуйста предоставьте некоторые данные для завершения настройки
            вашего профиля
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Полное Имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="Иванов Иван Иванович"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Ваш возраст</Label>
            <Input
              id="age"
              type="number"
              placeholder="14"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="1"
              max="120"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Класс</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Регион</Label>
              <Select
                value={selectedRegion}
                onValueChange={setSelectedRegion}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Сохранение..." : "Закончить настройку"}
          </Button>
        </form>
      </div>
    </div>
  );
}