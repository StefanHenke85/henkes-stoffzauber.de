import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

// Generic validation middleware factory
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validierungsfehler',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};

// Validation schemas for products
export const productSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, 'Name ist erforderlich').max(200),
      description: z.string().min(1, 'Beschreibung ist erforderlich').max(2000),
      price: z.coerce.number().min(0, 'Preis muss positiv sein'),
      stock: z.coerce.number().int().min(0, 'Bestand muss positiv sein'),
      fabrics: z.string().optional(),
      isFeatured: z.coerce.boolean().optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2000).optional(),
      price: z.coerce.number().min(0).optional(),
      stock: z.coerce.number().int().min(0).optional(),
      fabrics: z.string().optional(),
      isFeatured: z.coerce.boolean().optional(),
      isActive: z.coerce.boolean().optional(),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
};

// Validation schemas for orders/checkout
export const orderSchemas = {
  create: z.object({
    body: z.object({
      cart: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          quantity: z.number().int().min(1),
          imageUrl: z.string().optional(),
        })
      ).min(1, 'Warenkorb darf nicht leer sein'),
      address: z.object({
        firstName: z.string().min(1, 'Vorname ist erforderlich'),
        lastName: z.string().min(1, 'Nachname ist erforderlich'),
        email: z.string().email('Ungültige E-Mail-Adresse'),
        phone: z.string().optional(),
        street: z.string().min(1, 'Straße ist erforderlich'),
        houseNumber: z.string().min(1, 'Hausnummer ist erforderlich'),
        zip: z.string().regex(/^\d{5}$/, 'Ungültige Postleitzahl (5 Ziffern)'),
        city: z.string().min(1, 'Stadt ist erforderlich'),
        country: z.string().optional(),
      }),
      paymentMethod: z.enum(['paypal', 'invoice', 'prepayment']),
    }),
  }),

  getById: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
  }),

  updateStatus: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z.object({
      orderStatus: z.enum(['new', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
      trackingNumber: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }),
  }),
};

// Validation schemas for authentication
export const authSchemas = {
  login: z.object({
    body: z.object({
      username: z.string().min(1, 'Benutzername ist erforderlich'),
      password: z.string().min(1, 'Passwort ist erforderlich'),
    }),
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
    }),
  }),
};

// Query validation for pagination
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
  }),
});
