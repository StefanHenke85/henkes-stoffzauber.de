import { createClient } from '@supabase/supabase-js';
import { env } from './environment';
import { logger } from '../utils/logger';

// Create Supabase client with service role key for admin operations
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }

    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection error:', error);
    return false;
  }
};

// Database Types based on our schema
export interface DbProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  image_url_webp: string | null;
  thumbnail_url: string | null;
  mask_url: string | null;
  fabrics: string | null;
  available_fabrics: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  size_type: string | null;
  available_sizes: string[] | null;
  fabric_scale: number | null;
  product_scale: number | null;
  tailor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFabric {
  id: string;
  name: string;
  description: string;
  fabric_type: string;
  image_url: string | null;
  image_url_webp: string | null;
  thumbnail_url: string | null;
  color: string | null;
  pattern: string | null;
  material: string | null;
  width: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  customer: Record<string, any>;
  items: Record<string, any>[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  paypal_order_id: string | null;
  invoice_path: string | null;
  tracking_number: string | null;
  notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAdmin {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVoucher {
  id: string;
  code: string;
  value: number;
  is_percentage: boolean;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface DbPattern {
  id: string;
  filename: string;
  name: string;
  description: string | null;
  file_type: 'pdf' | 'zip';
  file_size: number;
  file_path: string;
  category: string | null;
  tags: string[] | null;
  download_count: number;
  is_active: boolean;
  tailor_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPatternShare {
  id: string;
  token: string;
  pattern_id: string;
  expires_at: string;
  created_by: string;
  access_count: number;
  last_accessed_at: string | null;
  created_at: string;
}

export interface DbTailor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  is_active: boolean;
  username: string | null;
  password_hash: string | null;
  registration_status: 'pending' | 'approved' | 'rejected';
  last_login: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}
