import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';

// Interface pour les données d'exemple
interface ExampleData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  createdAt: string;
}

// Données d'exemple
const generateExampleData = (count: number): ExampleData[] => {
  const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending'];
  const roles = ['Admin', 'User', 'Manager', 'Developer', 'Designer'];
  const names = ['Alice Martin', 'Bob Dupont', 'Claire Moreau', 'David Bernard', 'Emma Petit', 'François Durand', 'Gabrielle Roux', 'Henri Blanc'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: names[i % names.length] + ` ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: statuses[i % statuses.length],
    role: roles[i % roles.length],
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('fr-FR'),
  }));
};

interface ExamplePaginatedTableProps {
  className?: string;
}

export const ExamplePaginatedTable: React.FC<ExamplePaginatedTableProps> = ({
  className = '',
}) => {
  // Générer des données d'exemple
  const [data] = useState(() => generateExampleData(127)); // 127 éléments pour tester la pagination
  
  // Utiliser le hook de pagination
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data,
    initialItemsPerPage: 25,
    initialPage: 1,
  });

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Gestionnaires d'événements (exemple)
  const handleEdit = (item: ExampleData) => {
    console.log('Éditer:', item);
  };

  const handleDelete = (item: ExampleData) => {
    console.log('Supprimer:', item);
  };

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
        <div className="text-sm text-muted-foreground">
          {totalItems} utilisateur{totalItems > 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.role}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={goToPage}
        onItemsPerPageChange={setItemsPerPage}
        pageSizeOptions={[25, 50]}
        showFirstLast={true}
        showPageInfo={true}
      />
    </div>
  );
};