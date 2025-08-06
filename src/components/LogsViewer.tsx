import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Copy, Trash2, Download, Filter, Search, ChevronDown, CheckCircle } from 'lucide-react';
import { LogsService, LogEntry, LogsFilter, LogLevel } from '../services/logsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '../lib/utils';

interface LogsViewerProps {
  // Pas de props nécessaires, utilise le LogsService directement
}

const LOG_LEVEL_COLORS = {
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  warn: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  debug: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

const LOG_LEVEL_LABELS = {
  error: 'Erreur',
  warn: 'Avertissement',
  info: 'Information',
  debug: 'Debug'
};

export const LogsViewer: React.FC<LogsViewerProps> = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogsFilter>({
    levels: ['error', 'warn', 'info', 'debug']
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set(['error', 'warn', 'info', 'debug'])
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Charger les logs initiaux et s'abonner aux changements
  useEffect(() => {
    const updateLogs = () => {
      const currentFilter: LogsFilter = {
        levels: Array.from(selectedLevels),
        searchTerm: searchTerm || undefined
      };
      setLogs(LogsService.getLogs(currentFilter));
    };

    // Charger les logs initiaux
    updateLogs();

    // S'abonner aux changements
    const unsubscribe = LogsService.addListener(updateLogs);

    return unsubscribe;
  }, [selectedLevels, searchTerm]);

  // Auto-scroll vers le bas quand de nouveaux logs arrivent
  useEffect(() => {
    if (isAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  // Gérer le scroll manuel (désactiver auto-scroll si l'utilisateur scroll)
  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsAutoScroll(isAtBottom);
    }
  };

  // Filtrer les logs affichés
  const filteredLogs = useMemo(() => {
    return logs.filter(log => selectedLevels.has(log.level));
  }, [logs, selectedLevels]);

  // Gérer le changement de niveau sélectionné
  const handleLevelToggle = (level: LogLevel) => {
    const newSelectedLevels = new Set(selectedLevels);
    if (newSelectedLevels.has(level)) {
      newSelectedLevels.delete(level);
    } else {
      newSelectedLevels.add(level);
    }
    setSelectedLevels(newSelectedLevels);
  };

  // Copier les logs dans le presse-papiers
  const handleCopyLogs = async () => {
    try {
      const logsText = LogsService.exportLogs('text');
      await navigator.clipboard.writeText(logsText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Exporter les logs en fichier
  const handleExportLogs = () => {
    const logsText = LogsService.exportLogs('text');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dimicall-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Vider les logs
  const handleClearLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les logs ?')) {
      LogsService.clearLogs();
    }
  };

  // Formater l'horodatage
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Compter les logs par niveau
  const logCounts = useMemo(() => {
    const counts = { error: 0, warn: 0, info: 0, debug: 0 };
    logs.forEach(log => counts[log.level]++);
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Logs système</CardTitle>
                <CardDescription>
                  {LogsService.getLogCount()} entrées • Capture {LogsService.isCapturingLogs() ? 'active' : 'inactive'}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5"
              >
                <Filter className="w-4 h-4" />
                Filtres
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLogs}
                className="gap-1.5"
                disabled={logs.length === 0}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
                className="gap-1.5"
                disabled={logs.length === 0}
              >
                <Download className="w-4 h-4" />
                Exporter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="gap-1.5 text-red-600 hover:text-red-700"
                disabled={logs.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Vider
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filtres */}
        {showFilters && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Recherche */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtres par niveau */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Niveaux de log</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LOG_LEVEL_LABELS) as LogLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => handleLevelToggle(level)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                        selectedLevels.has(level) 
                          ? LOG_LEVEL_COLORS[level]
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      )}
                    >
                      {LOG_LEVEL_LABELS[level]}
                      <Badge variant="secondary" className="text-xs">
                        {logCounts[level]}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto border rounded-md"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun log à afficher</p>
                  <p className="text-xs">
                    {logs.length === 0 ? 'Aucun log capturé' : 'Aucun log ne correspond aux filtres'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-sm font-mono"
                  >
                    <div className="flex-shrink-0 text-xs text-muted-foreground min-w-[80px]">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    
                    <Badge
                      variant="outline"
                      className={cn("flex-shrink-0 text-xs", LOG_LEVEL_COLORS[log.level])}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    
                    <div className="flex-shrink-0 text-xs text-muted-foreground min-w-[80px]">
                      {log.source}
                    </div>
                    
                    <div className="flex-1 break-words">
                      <div>{log.message}</div>
                      {log.stack && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Stack trace
                          </summary>
                          <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pied de page avec statistiques */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{filteredLogs.length} logs affichés sur {logs.length}</span>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span>Auto-scroll:</span>
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={cn(
                "px-2 py-1 rounded text-xs",
                isAutoScroll 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isAutoScroll ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {Object.entries(logCounts).map(([level, count]) => (
            <div key={level} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", {
                'bg-red-500': level === 'error',
                'bg-yellow-500': level === 'warn',
                'bg-blue-500': level === 'info',
                'bg-gray-500': level === 'debug'
              })} />
              <span className="text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};