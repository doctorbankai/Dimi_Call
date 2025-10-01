"use client"

import UltraResponsiveCalendar from "@/components/UltraResponsiveCalendar"

export default function CalendarDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="py-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6">
            Calendrier Ultra-Responsive
          </h1>
          <p className="text-center text-muted-foreground mb-8 text-sm sm:text-base">
            Démonstration des meilleures pratiques Tailwind pour la responsivité
          </p>
        </div>
        <UltraResponsiveCalendar />
      </div>
    </div>
  )
}
