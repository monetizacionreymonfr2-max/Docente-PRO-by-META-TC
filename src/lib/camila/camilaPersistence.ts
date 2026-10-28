import { supabase } from '../supabase';
import { crearCamilaPersistence } from './camilaPersistenceCore';

export type {
  ConversacionCamila, ResumenConversacion, RecuerdoCamila,
  MensajeHistorial, MensajeParaHistorial,
} from './camilaPersistenceCore';

export const CamilaPersistence = crearCamilaPersistence(supabase);
