import React, { useState, useEffect, useMemo } from 'react';
import { Theme, QualificationStatutMarital, QualificationSituationPro, QualificationStructureJuridique, QualificationRevenuType, QualificationFiscalite, QualificationChargeType, QualificationLiquiditeType, QualificationFrequence } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Enfant {
    id: string;
    prenom: string;
    age: string;
    remarques: string;
    aCharge: boolean;
}

interface Revenu {
    id: string;
    declarantId: 1 | 2;
    type: QualificationRevenuType | string;
    frequence: QualificationFrequence;
    fiscalite: QualificationFiscalite;
    montant: string;
}

interface Charge {
    id: string;
    type: QualificationChargeType | string;
    frequence: QualificationFrequence;
    montant: string;
    priseEnCompte: boolean;
}

interface Liquidite {
    id: string;
    type: QualificationLiquiditeType | string;
    montant: string;
    remarques: string;
    disponible: boolean;
}

interface QualificationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (comment: string) => void;
    theme: Theme;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const QualificationDialog: React.FC<QualificationDialogProps> = ({ isOpen, onClose, onSave }) => {
    // --- STATE: ETAT CIVIL ---
    const [statutMarital, setStatutMarital] = useState<string>('');
    const [declarant1, setDeclarant1] = useState({ situationPro: '', structureJuridique: '', anciennete: '' });
    const [declarant2, setDeclarant2] = useState({ situationPro: '', structureJuridique: '', anciennete: '' });
    const [enfants, setEnfants] = useState<Enfant[]>([]);

    // --- STATE: FINANCIALS ---
    const [revenus, setRevenus] = useState<Revenu[]>([]);
    const [charges, setCharges] = useState<Charge[]>([]);
    const [liquidites, setLiquidites] = useState<Liquidite[]>(() => [
        { id: generateId(), type: '', montant: '', remarques: '', disponible: true }
    ]);
    const [effortEpargne, setEffortEpargne] = useState({ montant: '', frequence: QualificationFrequence.Mensuel });

    // --- STATE: COMMENTAIRES ---
    const [commentaireAuto, setCommentaireAuto] = useState('');
    const [commentairePersonnel, setCommentairePersonnel] = useState('');

    // --- CONSTANTS ---
    const SEUIL_TAUX_ENDETTEMENT = 0.25; // 25%
    const SEUIL_LIQUIDITES = 50000;
    const COEFF_SALAIRE = 0.77;
    const COEFF_DIVIDENDES = 0.70;

    const showDeclarant2 = [
        QualificationStatutMarital.Marie,
        QualificationStatutMarital.Pacse,
        QualificationStatutMarital.Concubinage
    ].includes(statutMarital as any);

    // --- LOGIC: HELPERS ---
    const annualize = (amount: number, freq: QualificationFrequence) => {
        switch (freq) {
            case QualificationFrequence.Mensuel: return amount * 12;
            case QualificationFrequence.Hebdo: return amount * 52;
            case QualificationFrequence.Trimestriel: return amount * 4;
            case QualificationFrequence.Annuel: return amount;
            default: return amount;
        }
    };

    const getNetFromBrut = (brut: number, type: string) => {
        if (type === QualificationRevenuType.Dividendes) return brut * COEFF_DIVIDENDES;
        return brut * COEFF_SALAIRE;
    };

    // --- LOGIC: UPDATE REVENU ---
    const handleRevenuChange = (id: string, field: keyof Revenu, value: any) => {
        setRevenus(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // --- LOGIC: CALCULATIONS ---
    const calculationResults = useMemo(() => {
        // 1. Filter Eligible Income
        const eligibleRevenus = revenus.filter(r => {
            const declarant = r.declarantId === 1 ? declarant1 : declarant2;
            const isIndep = [QualificationSituationPro.ChefEntreprise, QualificationSituationPro.Freelance].includes(declarant.situationPro as any);
            if (isIndep) {
                const anciennete = parseInt(declarant.anciennete || '0');
                if (anciennete < 3) return false; // Exclusion rule
            }
            return true;
        });

        // 2. Sum Annual Eligible Income (Denominator)
        let totalRevenusEligibles = 0;
        eligibleRevenus.forEach(r => {
            const amount = parseFloat(r.montant) || 0;
            let netAmount = amount;
            if (r.fiscalite === QualificationFiscalite.Brut && r.type !== QualificationRevenuType.Dividendes) { // Dividendes logic ambiguous in prompt, assuming standard coeff for simplicity or user choice
                // Actually prompt implies different logic? Let's stick to standard net conversion if brut
                // However, "Dividendes" usually don't have standard "Brut -> Net" payroll logic.
                // Retaining existing logic: if Dividendes, separate Coeff.
                netAmount = getNetFromBrut(amount, r.type as string);
            } else if (r.fiscalite === QualificationFiscalite.Brut) {
                netAmount = getNetFromBrut(amount, r.type as string);
            }

            // Simpler verification: 
            if (r.fiscalite === QualificationFiscalite.Brut) {
                netAmount = getNetFromBrut(amount, r.type as string);
            }

            totalRevenusEligibles += annualize(netAmount, r.frequence);
        });

        // 3. Sum Annual Charges (Numerator)
        let totalCharges = 0;
        charges.filter(c => c.priseEnCompte).forEach(c => {
            const amount = parseFloat(c.montant) || 0;
            totalCharges += annualize(amount, c.frequence);
        });

        // 4. Results
        const tauxEndettement = totalRevenusEligibles > 0 ? totalCharges / totalRevenusEligibles : 0;

        // 5. LiquiditÃ©s
        const totalLiquidites = liquidites.filter(l => l.disponible).reduce((acc, curr) => acc + (parseFloat(curr.montant) || 0), 0);

        // 6. Savings Effort (Annualized for display consistency?) - keeping as entered for now or annualized? The prompt asks for "Effort d'Ã©pargne" in liquidities section, usually monthly.
        const effortEpargneAmount = parseFloat(effortEpargne.montant) || 0;

        return {
            tauxEndettement,
            totalLiquidites,
            totalCharges,
            totalRevenusEligibles,
            effortEpargneAmount
        };
    }, [revenus, charges, liquidites, declarant1, declarant2, effortEpargne]);

    // --- LOGIC: AUTO COMMENT ---
    useEffect(() => {
        let lines = ['Qualification Financière:'];

        // Etat Civil
        lines.push(`- Statut: ${statutMarital || 'Non défini'}`);
        if (enfants.length > 0) lines.push(`- Enfants: ${enfants.length} (${enfants.filter(e => e.aCharge).length} à charge)`);

        const formatDeclarant = (d: typeof declarant1, label: string) => {
            let parts = [`${label}:`];
            if (d.situationPro) parts.push(d.situationPro);
            if (d.structureJuridique) parts.push(`(${d.structureJuridique})`);
            if (d.anciennete) parts.push(`- ${d.anciennete} ans`);
            return parts.join(' ');
        };

        if (declarant1.situationPro) lines.push(formatDeclarant(declarant1, 'D1'));
        if (showDeclarant2 && declarant2.situationPro) lines.push(formatDeclarant(declarant2, 'D2'));

        // Finance Detail
        if (revenus.length > 0) {
            lines.push(`- Revenus:`);
            revenus.forEach((r) => {
                lines.push(`  • D${r.declarantId} ${r.type} (${r.frequence}): ${r.montant}€ ${r.fiscalite}`);
            });
        }

        if (charges.length > 0) {
            lines.push(`- Charges:`);
            charges.forEach(c => {
                if (c.priseEnCompte) lines.push(`  • ${c.type}: ${c.montant}€ (${c.frequence})`);
            });
        }

        if (liquidites.length > 0) {
            lines.push(`- Liquidités:`);
            liquidites.forEach(l => {
                if (l.disponible) lines.push(`  • ${l.type}: ${l.montant}€ ${l.remarques ? `(${l.remarques})` : ''}`);
            });
        }

        // Finance Summary
        lines.push(`- Revenus Éligibles (Annuel): ${calculationResults.totalRevenusEligibles.toFixed(0)}€`);
        lines.push(`- Charges (Annuel): ${calculationResults.totalCharges.toFixed(0)}€`);

        const tauxPercent = (calculationResults.tauxEndettement * 100).toFixed(2);
        lines.push(`- Taux Endettement: ${tauxPercent}%`);
        lines.push(`- Liquidités Dispo: ${calculationResults.totalLiquidites.toFixed(0)}€`);

        setCommentaireAuto(lines.join('\n'));
    }, [statutMarital, declarant1, declarant2, enfants, revenus, charges, liquidites, calculationResults, showDeclarant2]);

    const handleSave = () => {
        const finalComment = `${commentaireAuto}\n\n${commentairePersonnel}`.trim();
        onSave(finalComment);
        onClose();
    };

    // --- UI COMPONENTS ---

    const renderSituationProFunc = (declarantState: typeof declarant1, setDeclarantState: typeof setDeclarant1, labelPrefix: string) => {
        const isIndep = [QualificationSituationPro.ChefEntreprise, QualificationSituationPro.Freelance].includes(declarantState.situationPro as any);
        const isChef = declarantState.situationPro === QualificationSituationPro.ChefEntreprise;

        return (
            <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                <h4 className="font-medium text-sm text-foreground">{labelPrefix}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Situation Pro</Label>
                        <Select value={declarantState.situationPro} onValueChange={v => setDeclarantState({ ...declarantState, situationPro: v })}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                            <SelectContent className="z-[100005]">
                                {Object.values(QualificationSituationPro).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {isChef && (
                        <div className="space-y-1">
                            <Label className="text-xs">Structure</Label>
                            <Select value={declarantState.structureJuridique} onValueChange={v => setDeclarantState({ ...declarantState, structureJuridique: v })}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="SARL, SAS..." /></SelectTrigger>
                                <SelectContent className="z-[100005]">
                                    {Object.values(QualificationStructureJuridique).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {isIndep && (
                        <div className="space-y-1">
                            <Label className="text-xs">Ancienneté (ans)</Label>
                            <Input className="h-8" type="number" placeholder="Ex: 5" value={declarantState.anciennete} onChange={e => setDeclarantState({ ...declarantState, anciennete: e.target.value })} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 bg-background">

                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Qualification Financière</DialogTitle>
                    <DialogDescription>Système de qualification et scoring d'éligibilité</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-8">

                        {/* SECTION 1: ETAT CIVIL */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <div className="h-6 w-1 bg-primary rounded-full" />
                                <h3 className="font-semibold text-lg">État Civil</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Statut Marital</Label>
                                    <Select value={statutMarital} onValueChange={setStatutMarital}>
                                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                        <SelectContent className="z-[100005]">
                                            {Object.values(QualificationStatutMarital).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    {renderSituationProFunc(declarant1, setDeclarant1, "Déclarant 1")}
                                    {showDeclarant2 && renderSituationProFunc(declarant2, setDeclarant2, "Déclarant 2")}
                                </div>
                            </div>

                            {/* Enfants */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Enfants ({enfants.length})</Label>
                                    <Button size="sm" variant="outline" onClick={() => setEnfants([...enfants, { id: generateId(), prenom: '', age: '', remarques: '', aCharge: true }])}>
                                        <Plus className="w-4 h-4 mr-1" /> Ajouter enfant
                                    </Button>
                                </div>
                                {enfants.length > 0 && (
                                    <div className="space-y-2">
                                        {enfants.map((enf, idx) => (
                                            <div key={enf.id} className="flex gap-2 items-end">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-xs">Prénom</Label>
                                                    <Input className="h-8" value={enf.prenom} onChange={e => { const n = [...enfants]; n[idx].prenom = e.target.value; setEnfants(n); }} />
                                                </div>
                                                <div className="w-20 space-y-1">
                                                    <Label className="text-xs">Age</Label>
                                                    <Input className="h-8" type="number" value={enf.age} onChange={e => { const n = [...enfants]; n[idx].age = e.target.value; setEnfants(n); }} />
                                                </div>
                                                <div className="w-32 space-y-1">
                                                    <Label className="text-xs">Remarques</Label>
                                                    <Input className="h-8" value={enf.remarques || ''} placeholder="Optionnel" onChange={e => { const n = [...enfants]; n[idx].remarques = e.target.value; setEnfants(n); }} />
                                                </div>
                                                <div className="flex items-center gap-1 h-8 px-2 border rounded bg-muted/20">
                                                    <Checkbox checked={enf.aCharge} onCheckedChange={c => { const n = [...enfants]; n[idx].aCharge = !!c; setEnfants(n); }} />
                                                    <Label className="text-xs cursor-pointer">À charge</Label>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEnfants(enfants.filter(e => e.id !== enf.id))}><Trash className="w-4 h-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SECTION 2: REVENUS */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-green-500 rounded-full" />
                                    <h3 className="font-semibold text-lg">Revenus ({revenus.length})</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setRevenus([...revenus, { id: generateId(), declarantId: 1, type: '', frequence: QualificationFrequence.Mensuel, fiscalite: QualificationFiscalite.Brut, montant: '' }])}>
                                        + Déclarant 1
                                    </Button>
                                    {showDeclarant2 && (
                                        <Button size="sm" variant="outline" onClick={() => setRevenus([...revenus, { id: generateId(), declarantId: 2, type: '', frequence: QualificationFrequence.Mensuel, fiscalite: QualificationFiscalite.Brut, montant: '' }])}>
                                            + Déclarant 2
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {revenus.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Déclarant</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Fréquence</TableHead>
                                            <TableHead>Fiscalité</TableHead>
                                            <TableHead>Montant (€)</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {revenus.map((rev) => (
                                            <TableRow key={rev.id}>
                                                <TableCell>
                                                    <Badge variant="secondary">D{rev.declarantId}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={rev.type} onValueChange={v => handleRevenuChange(rev.id, 'type', v)}>
                                                        <SelectTrigger className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationRevenuType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={rev.frequence} onValueChange={v => handleRevenuChange(rev.id, 'frequence', v)}>
                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationFrequence).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={rev.fiscalite} onValueChange={v => handleRevenuChange(rev.id, 'fiscalite', v)}>
                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationFiscalite).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" className="h-8" value={rev.montant} onChange={e => handleRevenuChange(rev.id, 'montant', e.target.value)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setRevenus(revenus.filter(r => r.id !== rev.id))}><Trash className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <div className="text-sm text-muted-foreground text-center py-4 italic">Aucun revenu saisi.</div>}
                        </section>

                        {/* SECTION 3: CHARGES */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-red-500 rounded-full" />
                                    <h3 className="font-semibold text-lg">Charges ({charges.length})</h3>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setCharges([...charges, { id: generateId(), type: '', frequence: QualificationFrequence.Mensuel, montant: '', priseEnCompte: true }])}>
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter charge
                                </Button>
                            </div>
                            {charges.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Fréquence</TableHead>
                                            <TableHead>Montant (€)</TableHead>
                                            <TableHead className="text-center">Active</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {charges.map((chg, idx) => (
                                            <TableRow key={chg.id}>
                                                <TableCell>
                                                    <Select value={chg.type} onValueChange={v => { const n = [...charges]; n[idx].type = v; setCharges(n); }}>
                                                        <SelectTrigger className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationChargeType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={chg.frequence} onValueChange={v => { const n = [...charges]; n[idx].frequence = v as QualificationFrequence; setCharges(n); }}>
                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationFrequence).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" className="h-8" value={chg.montant} onChange={e => { const n = [...charges]; n[idx].montant = e.target.value; setCharges(n); }} />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox checked={chg.priseEnCompte} onCheckedChange={c => { const n = [...charges]; n[idx].priseEnCompte = !!c; setCharges(n); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setCharges(charges.filter(c => c.id !== chg.id))}><Trash className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </section>

                        {/* SECTION 4: LIQUIDITES & PATRIMOINE */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                    <h3 className="font-semibold text-lg">Liquidités & Patrimoine</h3>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setLiquidites([...liquidites, { id: generateId(), type: '', montant: '', remarques: '', disponible: true }])}>
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                                </Button>
                            </div>
                            {liquidites.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Montant (€)</TableHead>
                                            <TableHead>Remarques</TableHead>
                                            <TableHead className="text-center">Disponible</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {liquidites.map((liq, idx) => (
                                            <TableRow key={liq.id}>
                                                <TableCell>
                                                    <Select value={liq.type} onValueChange={v => { const n = [...liquidites]; n[idx].type = v; setLiquidites(n); }}>
                                                        <SelectTrigger className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                                                        <SelectContent className="z-[100005]">
                                                            {Object.values(QualificationLiquiditeType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" className="h-8" value={liq.montant} onChange={e => { const n = [...liquidites]; n[idx].montant = e.target.value; setLiquidites(n); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input className="h-8" value={liq.remarques || ''} placeholder="Détails..." onChange={e => { const n = [...liquidites]; n[idx].remarques = e.target.value; setLiquidites(n); }} />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox checked={liq.disponible} onCheckedChange={c => { const n = [...liquidites]; n[idx].disponible = !!c; setLiquidites(n); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setLiquidites(liquidites.filter(l => l.id !== liq.id))}><Trash className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                                <Label className="w-32">Effort d'épargne</Label>
                                <Input className="w-32" type="number" placeholder="Montant" value={effortEpargne.montant} onChange={e => setEffortEpargne({ ...effortEpargne, montant: e.target.value })} />
                                <Select value={effortEpargne.frequence} onValueChange={v => setEffortEpargne({ ...effortEpargne, frequence: v as QualificationFrequence })}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent className="z-[100005]">
                                        {Object.values(QualificationFrequence).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </section>

                        {/* SECTION 5: DASHBOARD */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* TAUX ENDETTEMENT */}
                            <Card className={cn("border-2", calculationResults.tauxEndettement <= SEUIL_TAUX_ENDETTEMENT ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : "border-red-500/50 bg-red-50/50 dark:bg-red-900/10")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium flex items-center justify-between">
                                        Taux d'Endettement
                                        {calculationResults.tauxEndettement <= SEUIL_TAUX_ENDETTEMENT ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {(calculationResults.tauxEndettement * 100).toFixed(1)}%
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Seuil recommandé: 25%
                                    </p>
                                </CardContent>
                            </Card>

                            {/* LIQUIDITES */}
                            <Card className={cn("border-2", calculationResults.totalLiquidites >= SEUIL_LIQUIDITES ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : "border-red-500/50 bg-red-50/50 dark:bg-red-900/10")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-medium flex items-center justify-between">
                                        Liquidités Disponibles
                                        {calculationResults.totalLiquidites >= SEUIL_LIQUIDITES ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {calculationResults.totalLiquidites.toLocaleString('fr-FR')} €
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Objectif: {SEUIL_LIQUIDITES.toLocaleString('fr-FR')} €
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* COMMENTS */}
                        <section className="space-y-4">
                            <div className="space-y-2">
                                <Label>Commentaire Automatique (Aperçu)</Label>
                                <Textarea className="bg-muted" readOnly value={commentaireAuto} rows={5} />
                            </div>
                            <div className="space-y-2">
                                <Label>Commentaire Personnel</Label>
                                <Textarea placeholder="Observations..." value={commentairePersonnel} onChange={e => setCommentairePersonnel(e.target.value)} rows={3} />
                            </div>
                        </section>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSave}>Enregistrer</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};
