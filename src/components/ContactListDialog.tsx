import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Contact } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContactListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    status: string;
    contacts: Contact[];
}

export function ContactListDialog({ isOpen, onClose, status, contacts }: ContactListDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Contacts - {status}</DialogTitle>
                    <DialogDescription>
                        {contacts.length} contact{contacts.length > 1 ? 's' : ''} trouvé{contacts.length > 1 ? 's' : ''} pour le statut <strong>{status}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4 py-4">
                        {contacts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                Aucun contact trouvé pour ce statut.
                            </div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {contact.prenom} {contact.nom}
                                            </span>
                                            {contact.source && (
                                                <Badge variant="outline" className="text-xs">
                                                    {contact.source}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 text-sm text-muted-foreground ml-6">
                                            {contact.telephone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{contact.telephone}</span>
                                                </div>
                                            )}
                                            {contact.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{contact.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground text-right space-y-1">
                                        {(contact.dateRappel || contact.dateRDV) && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {contact.dateRDV ? `RDV: ${contact.dateRDV}` : `Rappel: ${contact.dateRappel}`}
                                                </span>
                                            </div>
                                        )}
                                        {/* Optional: Add button to navigate to contact details if needed */}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
