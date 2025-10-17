import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Contact, ContactStatus } from "../types"
import { Progress } from "@/components/ui/progress"

interface StatusCompletionChartProps {
    contacts: Contact[]
    className?: string
    compact?: boolean
}

const chartConfig = {
    completion: {
        label: "Complétion",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

export function StatusCompletionChart({ contacts, className, compact = false }: StatusCompletionChartProps) {
    const stats = useMemo(() => {
        const total = contacts.length
        if (total === 0) {
            return {
                total: 0,
                withStatus: 0,
                percentage: 0,
                chartData: [{ status: "completion", value: 0, fill: "var(--color-completion)" }],
            }
        }

        const withStatus = contacts.filter(
            (c) => c.statut && c.statut !== ContactStatus.NonDefini
        ).length

        const percentage = Math.round((withStatus / total) * 100)

        return {
            total,
            withStatus,
            percentage,
            chartData: [{ status: "completion", value: withStatus, fill: "var(--color-completion)" }],
        }
    }, [contacts])

    if (compact) {
        return (
            <div
                className={`inline-flex items-center gap-3 rounded-md border bg-card px-3 h-9 ${className || ''}`}
                title={`${stats.withStatus}/${stats.total} contacts avec statut défini`}
            >
                <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1">
                        <Progress value={stats.percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                        {stats.percentage}%
                    </span>
                </div>
            </div>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-base">Complétion des statuts</CardTitle>
                <CardDescription className="text-xs">Contacts avec statut défini</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4 pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-bold tabular-nums">{stats.percentage}%</span>
                        <span className="text-sm text-muted-foreground">
                            {stats.withStatus}/{stats.total}
                        </span>
                    </div>
                    <Progress value={stats.percentage} className="h-3" />
                    <ChartContainer config={chartConfig} className="h-[120px] w-full">
                        <BarChart
                            data={[
                                { name: "Qualifiés", value: stats.withStatus, fill: "hsl(var(--primary))" },
                                { name: "Restants", value: stats.total - stats.withStatus, fill: "hsl(var(--muted))" },
                            ]}
                            layout="vertical"
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={40} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-0">
                <div className="flex items-center gap-2 leading-none font-medium text-xs">
                    <TrendingUp className="h-3 w-3" />
                    {stats.withStatus} contacts qualifiés
                </div>
                <div className="text-muted-foreground leading-none text-xs">
                    {stats.total - stats.withStatus} restants à qualifier
                </div>
            </CardFooter>
        </Card>
    )
}
