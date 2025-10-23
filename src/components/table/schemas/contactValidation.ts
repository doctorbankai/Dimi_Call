import { z } from 'zod';
import { ContactStatus, Civility } from '../../../types';

// Phone number validation - supports international formats
const phoneRegex = /^(?:\+?[1-9]\d{1,14}|0[1-9](?:[0-9]{8}))$/;
const isValidPhone = (phone: string): boolean => {
  // Remove spaces, hyphens, parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
};

// Email validation - more permissive than default for business emails
const emailSchema = z.string().email({
  message: "Format d'email invalide"
}).refine((email) => {
  // Additional business email validation
  const domain = email.split('@')[1];
  return domain && domain.length > 1 && !domain.includes('..');
}, {
  message: "Domaine email invalide"
});

// Sanitize text inputs to prevent potential issues
const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .slice(0, 1000); // Limit length
};

// Core field schemas
const phoneSchema = z.string()
  .min(1, "Numéro de téléphone requis")
  .refine(isValidPhone, {
    message: "Format de numéro de téléphone invalide (ex: +33123456789 ou 0123456789)"
  })
  .transform((phone) => {
    // Normalize phone format for storage
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    // Add +33 prefix for French numbers starting with 0
    if (clean.startsWith('0') && clean.length === 10) {
      return `+33${clean.slice(1)}`;
    }
    return clean.startsWith('+') ? clean : `+${clean}`;
  });

const nameSchema = z.string()
  .min(1, "Ce champ est requis")
  .max(100, "Maximum 100 caractères")
  .transform(sanitizeText);

const commentSchema = z.string()
  .max(2000, "Commentaire trop long (max 2000 caractères)")
  .transform(sanitizeText)
  .optional();

const urlSchema = z.string()
  .url("Format d'URL invalide")
  .max(500, "URL trop longue")
  .optional()
  .or(z.literal(''));

// Date validation - YYYY-MM-DD format
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900;
  }, {
    message: "Date invalide"
  })
  .optional()
  .or(z.literal(''));

// Time validation - HH:MM format
const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)")
  .optional()
  .or(z.literal(''));

// Duration validation - MM:SS format
const durationSchema = z.string()
  .regex(/^([0-9]+):([0-5][0-9])$/, "Format de durée invalide (MM:SS)")
  .optional()
  .or(z.literal(''));

// Enums validation
const statusSchema = z.nativeEnum(ContactStatus, {
  errorMap: () => ({ message: "Statut invalide" })
});

const civilitySchema = z.nativeEnum(Civility, {
  errorMap: () => ({ message: "Civilité invalide" })
}).optional();

// Full Contact schema for creation
export const ContactCreateSchema = z.object({
  prenom: nameSchema,
  nom: nameSchema,
  telephone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  sexe: civilitySchema,
  source: z.string().max(100).transform(sanitizeText).optional().or(z.literal('')),
  type: z.string().max(100).transform(sanitizeText).optional().or(z.literal('')),
  qualite: z.string().max(100).transform(sanitizeText).optional().or(z.literal('')),
  lien: urlSchema,
  statut: statusSchema.default(ContactStatus.NonDefini),
  commentaire: commentSchema,
  dateRappel: dateSchema,
  heureRappel: timeSchema,
  dateRDV: dateSchema,
  heureRDV: timeSchema,
  dateAppel: dateSchema,
  heureAppel: timeSchema,
  dureeAppel: durationSchema,
  don: z.string().max(100).transform(sanitizeText).optional().or(z.literal('')),
  date: dateSchema,
  uid: z.string().max(50).optional().or(z.literal('')),
});

// Partial Contact schema for updates
export const ContactUpdateSchema = z.object({
  id: z.string().uuid("ID de contact invalide"),
}).and(
  ContactCreateSchema.partial().refine(
    (data) => {
      // At least one field must be provided for update
      const fields = Object.keys(data).filter(key => key !== 'id');
      return fields.length > 0;
    },
    {
      message: "Au moins un champ doit être modifié"
    }
  )
);

// Batch update schema
export const ContactBatchUpdateSchema = z.array(
  ContactUpdateSchema
).max(1000, "Trop de contacts à mettre à jour simultanément (max 1000)");

// Phone number formatting for display
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const clean = phone.replace(/[^\d+]/g, '');
  
  // French format: +33 1 23 45 67 89
  if (clean.startsWith('+33') && clean.length === 12) {
    const number = clean.slice(3);
    return `+33 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }
  
  // French local format: 01 23 45 67 89
  if (clean.startsWith('0') && clean.length === 10) {
    return clean.replace(/(\d{2})(?=\d)/g, '$1 ');
  }
  
  // International format: +XX XXX XXX XXX
  if (clean.startsWith('+') && clean.length > 4) {
    const country = clean.slice(0, 3);
    const number = clean.slice(3);
    return `${country} ${number.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`;
  }
  
  return phone;
};

// Email validation helper
export const isValidEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

// Phone validation helper
export const isValidPhoneNumber = (phone: string): boolean => {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

// Validation error formatter
export const formatValidationErrors = (error: z.ZodError): string[] => {
  return error.errors.map(err => {
    const field = err.path.join('.');
    return field ? `${field}: ${err.message}` : err.message;
  });
};

// Safe validation wrapper that doesn't throw
export const validateContact = (data: unknown, partial: boolean = false) => {
  const schema = partial ? ContactUpdateSchema : ContactCreateSchema;
  
  try {
    const result = schema.parse(data);
    return { success: true as const, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        data: null,
        errors: formatValidationErrors(error)
      };
    }
    return {
      success: false as const,
      data: null,
      errors: ['Erreur de validation inconnue']
    };
  }
};

// Type exports for use in components
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;
export type ContactBatchUpdateInput = z.infer<typeof ContactBatchUpdateSchema>;
export type ValidationResult<T> = {
  success: boolean;
  data: T | null;
  errors: string[] | null;
};