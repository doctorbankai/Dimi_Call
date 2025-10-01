import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    pageSizeOptions?: number[];
    showFirstLast?: boolean;
    showPageInfo?: boolean;
    className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions = [25, 50, 100],
    showFirstLast = true,
    showPageInfo = true,
    className = '',
}) => {
    // Calculer les pages à afficher
    const getVisiblePages = () => {
        const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageClick = (page: number | string) => {
        if (typeof page === 'number' && page !== currentPage) {
            onPageChange(page);
        }
    };

    return (
        <div className={`relative flex items-center justify-between px-3 py-1.5 min-h-[48px] ${className}`}>
            {/* Conteneur principal avec grille à 3 colonnes pour centrer la pagination */}
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center">
                {/* Sélecteur de taille de page - à gauche */}
                <div className="flex items-center space-x-2.5 flex-shrink-0 justify-self-start">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                        Lignes par page:
                    </p>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => onItemsPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="h-7 w-[50px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Navigation de pagination - centrée */}
                {totalPages > 1 && (
                    <Pagination className="mx-auto w-auto justify-self-center">
                        <PaginationContent className="gap-1.5">
                            {/* Bouton première page */}
                            {showFirstLast && (
                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handlePageClick(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronFirst className="h-3 w-3" />
                                        <span className="sr-only">Première page</span>
                                    </Button>
                                </PaginationItem>
                            )}

                            {/* Bouton précédent */}
                            <PaginationItem>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handlePageClick(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                    <span className="sr-only">Page précédente</span>
                                </Button>
                            </PaginationItem>

                            {/* Pages numérotées */}
                            {visiblePages.map((page, index) => (
                                <PaginationItem key={index}>
                                    {page === '...' ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            size="default"
                                            onClick={() => handlePageClick(page)}
                                            isActive={page === currentPage}
                                            className="cursor-pointer h-7 w-7 text-xs"
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            {/* Bouton suivant */}
                            <PaginationItem>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handlePageClick(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                    <span className="sr-only">Page suivante</span>
                                </Button>
                            </PaginationItem>

                            {/* Bouton dernière page */}
                            {showFirstLast && (
                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handlePageClick(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronLast className="h-3 w-3" />
                                        <span className="sr-only">Dernière page</span>
                                    </Button>
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                )}

                {/* Espace vide pour équilibrer la grille */}
                <div></div>
            </div>

            {/* Section droite avec informations, colonnes et graphique */}
            {showPageInfo && (
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {totalItems === 0 ? (
                            'Aucun résultat'
                        ) : (
                            `${startItem}-${endItem} sur ${totalItems}`
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};