import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabase.surl, environment.supabase.key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }

    async uploadFile(file: File, path: string): Promise<string | null> {
        const { data, error } = await this.supabase.storage
            .from('task-attachments') // We'll need to make sure this bucket exists or use a variable
            .upload(path, file);

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = this.supabase.storage
            .from('task-attachments')
            .getPublicUrl(path);

        return publicUrlData.publicUrl;
    }

    async deleteFile(path: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from('task-attachments')
            .remove([path]);

        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }
    }
}
