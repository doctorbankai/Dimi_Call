import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  FileSpreadsheet,
  Upload,
  Settings,
  Eye,
  Download
} from 'lucide-react';
import { ColumnTypeSelector } from './ColumnTypeSelector';
import { ColumnTypesOverview } from './ColumnTypesOverview';
import { ColumnTypeValidation } from './ColumnTypeValidation';
import { useColumnTypes } from '../hooks/useColumnTypes';

// Données de démonstration
const DEMO_COLUMNS = [
  { id: 'prenom', label: 'Prénom', type: 'text' as const },
  { id: 'nom', label: 'Nom', type: 'text' as const },
  { id: 'telephone', label: 'Téléphone', type: 'phone' as const },
  { id: 'email', label: 'Email', type: 'email' as const },
  { id: 'statut', label: 'Statut', type: 'status' as const },
  { id: 'commentaire', label: 'Commentaire', type: 'comment' as const },
  { id: 'dateRappel', label: 'Date Rappel', type: 'date' as const },
  { id: 'heureRappel', label: 'Heure Rappel', type: 'time' as const },
];

export const ColumnTypesDemo: React.FC = () => {
  const { updateColumnType, getColumnType } = useColumnTypes();
  const [activeTab, setActiveTab] = useState('demo');

  // Initialiser les types de démonstration
  React.useEffect(() => {
    DEMO_COLUMNS.forEach(column => {
      updateColumnType(column.id, column.type);
    });
  }, [updateColumnType]);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Démonstration des Types de Colonnes</h1>
        <p className="text-muted-foreground">
          Gestion intelligente des types de données pour l'import de contacts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demo">Démo Table</TabsTrigger>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        {/* Onglet Démo Table */}
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Table avec Sélecteurs de Type
              </CardTitle>
              <CardDescription>
                Chaque en-tête de colonne dispose d'un sélecteur de type de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {DEMO_COLUMNS.map((column) => (
                        <TableHead key={column.id} className="h-20 px-3 py-2">
                          <div className="flex flex-col items-center justify-center gap-2 min-h-[60px]">
                            {/* En-tête de colonne */}
                            <div className="text-sm font-medium text-center">
                              {column.label}
                            </div>

                            {/* Sélecteur de type */}
                            <ColumnTypeSelector
                              columnId={column.id}
                              columnLabel={column.label}
                              currentType={getColumnType(column.id, column.label)}
                              onTypeChange={updateColumnType}
                              className="h-6 px-2 text-xs"
                            />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {DEMO_COLUMNS.map((column) => (
                        <TableCell key={column.id} className="px-3 py-2 text-center">
                          <div className="text-xs text-muted-foreground">
                            Type: {getColumnType(column.id, column.label)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Aperçu */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Aperçu des Types de Colonnes
              </CardTitle>
              <CardDescription>
                Vue d'ensemble et gestion des types détectés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColumnTypesOverview />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Validation */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Validation des Types
              </CardTitle>
              <CardDescription>
                Vérification de la conformité pour l'import de contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColumnTypeValidation />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Import */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Processus d'Import
              </CardTitle>
              <CardDescription>
                Étapes pour importer des contacts avec validation des types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Étapes d'import */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Étapes d'import :</h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <span className="font-medium">Préparation du fichier</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Préparez votre fichier CSV/Excel avec les colonnes appropriées
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        <span className="font-medium">Détection automatique</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Les types de colonnes sont automatiquement détectés
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <span className="font-medium">Correction manuelle</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Ajustez les types si nécessaire avec les sélecteurs
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          4
                        </div>
                        <span className="font-medium">Validation et import</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Validez et importez vos données
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Importer un fichier
                  </Button>

                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Télécharger un modèle
                  </Button>
                </div>

                {/* Conseils d'import */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Conseils pour un import réussi :
                  </h5>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Utilisez des en-têtes de colonnes clairs (ex: "Téléphone", "Nom", "Prénom")</li>
                    <li>• Assurez-vous que les numéros de téléphone sont au bon format</li>
                    <li>• Vérifiez que les dates sont dans un format standard (YYYY-MM-DD)</li>
                    <li>• Testez d'abord avec un petit échantillon de données</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
