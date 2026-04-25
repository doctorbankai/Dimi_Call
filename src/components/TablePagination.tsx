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
        <div className={`relative flex items-center justify-between px-4 py-2.5 border-t border-border/40 ${className}`}>
            {/* Conteneur principal avec grille à 3 colonnes pour centrer la pagination */}
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center">
                {/* Sélecteur de taille de page - à gauche */}
                <div className="flex items-center gap-2 flex-shrink-0 justify-self-start">
                    <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                        Lignes
                    </span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => onItemsPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="h-7 w-[52px] text-xs border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top" className="rounded-lg border-border/50">
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
                        <PaginationContent className="gap-1">
                            {/* Bouton première page */}
                            {showFirstLast && (
                                <PaginationItem>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-40 transition-colors"
                                        onClick={() => handlePageClick(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronFirst className="h-3.5 w-3.5" />
                                        <span className="sr-only">Première page</span>
                                    </Button>
                                </PaginationItem>
                            )}

                            {/* Bouton précédent */}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-40 transition-colors"
                                    onClick={() => handlePageClick(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span className="sr-only">Page précédente</span>
                                </Button>
                            </PaginationItem>

                            {/* Pages numérotées */}
                            {visiblePages.map((page, index) => (
                                <PaginationItem key={index}>
                                    {page === '...' ? (
                                        <PaginationEllipsis className="text-muted-foreground/50" />
                                    ) : (
                                        <PaginationLink
                                            size="default"
                                            onClick={() => handlePageClick(page)}
                                            isActive={page === currentPage}
                                            className={`cursor-pointer h-7 w-7 text-xs rounded-md transition-colors ${
                                                page === currentPage 
                                                    ? 'bg-foreground text-background font-medium' 
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                            }`}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            {/* Bouton suivant */}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-40 transition-colors"
                                    onClick={() => handlePageClick(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                    <span className="sr-only">Page suivante</span>
                                </Button>
                            </PaginationItem>

                            {/* Bouton dernière page */}
                            {showFirstLast && (
                                <PaginationItem>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-40 transition-colors"
                                        onClick={() => handlePageClick(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronLast className="h-3.5 w-3.5" />
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

            {/* Section droite avec informations */}
            {showPageInfo && (
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground/70 whitespace-nowrap tabular-nums">
                        {totalItems === 0 ? (
                            'Aucun résultat'
                        ) : (
                            <><span className="text-foreground font-medium">{startItem}-{endItem}</span> sur {totalItems}</>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
};
