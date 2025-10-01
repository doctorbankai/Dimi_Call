import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface LoadingPageProps {
  onComplete: () => void;
}

export function LoadingPage({ onComplete }: LoadingPageProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + 2;
        if (nextProgress >= 100) {
          clearInterval(interval);
          // Attendre un peu avant de déclencher onComplete pour une transition fluide
          setTimeout(() => {
            onComplete();
          }, 200);
          return 100;
        }
        return nextProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Texte "Dimicall" en gras avec style macOS/iOS */}
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
        Dimicall
      </h1>
      
      {/* Barre de progression avec style moderne */}
      <div className="w-80">
        <Progress 
          value={progress} 
          className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        />
      </div>
      
      {/* Texte de chargement subtil */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
        Chargement...
      </p>
    </div>
  );
}
