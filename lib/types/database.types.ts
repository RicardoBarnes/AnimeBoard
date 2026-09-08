export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type CollageRecipe = {
    template_type: '2-grid' | '3-grid' | '2x2' | 'vertical-stack';
    frames: {
        image_id: string;
        crop_x?: number;
        crop_y?: number;
        zoom?: number;
    }[];
    text_overlays?: {
        text: string;
        position: 'top-center' | 'bottom-center' | 'center';
        style?: 'bold' | 'normal';
    }[];
};

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string;
                    avatar_url: string | null;
                    role: 'user' | 'admin';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username: string;
                    avatar_url?: string | null;
                    role?: 'user' | 'admin';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string;
                    avatar_url?: string | null;
                    role?: 'user' | 'admin';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            images: {
                Row: {
                    id: string;
                    uploader_id: string;
                    storage_path: string;
                    public_url: string;
                    character_name: string | null;
                    series_name: string | null;
                    tags: string[];
                    file_size_bytes: number;
                    mime_type: string;
                    width: number | null;
                    height: number | null;
                    created_at: string;
                    removed_at: string | null;
                    removed_by: string | null;
                };
                Insert: {
                    id?: string;
                    uploader_id: string;
                    storage_path: string;
                    public_url: string;
                    character_name?: string | null;
                    series_name?: string | null;
                    tags?: string[];
                    file_size_bytes: number;
                    mime_type: string;
                    width?: number | null;
                    height?: number | null;
                    created_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
                Update: {
                    id?: string;
                    uploader_id?: string;
                    storage_path?: string;
                    public_url?: string;
                    character_name?: string | null;
                    series_name?: string | null;
                    tags?: string[];
                    file_size_bytes?: number;
                    mime_type?: string;
                    width?: number | null;
                    height?: number | null;
                    created_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
            };
            posts: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    body: string | null;
                    vote_count: number;
                    cover_image_url: string | null;
                    created_at: string;
                    updated_at: string;
                    removed_at: string | null;
                    removed_by: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    body?: string | null;
                    vote_count?: number;
                    cover_image_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    body?: string | null;
                    vote_count?: number;
                    cover_image_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
            };
            slides: {
                Row: {
                    id: string;
                    post_id: string;
                    slide_order: number;
                    slide_type: 'single' | 'collage';
                    single_image_id: string | null;
                    collage_recipe: CollageRecipe | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    slide_order: number;
                    slide_type: 'single' | 'collage';
                    single_image_id?: string | null;
                    collage_recipe?: CollageRecipe | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    slide_order?: number;
                    slide_type?: 'single' | 'collage';
                    single_image_id?: string | null;
                    collage_recipe?: CollageRecipe | null;
                    created_at?: string;
                };
            };
            slide_items: {
                Row: {
                    id: string;
                    slide_id: string;
                    image_id: string;
                    frame_index: number;
                };
                Insert: {
                    id?: string;
                    slide_id: string;
                    image_id: string;
                    frame_index: number;
                };
                Update: {
                    id?: string;
                    slide_id?: string;
                    image_id?: string;
                    frame_index?: number;
                };
            };
            votes: {
                Row: {
                    id: string;
                    post_id: string;
                    user_id: string;
                    vote_type: 'agree' | 'disagree';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    user_id: string;
                    vote_type: 'agree' | 'disagree';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    user_id?: string;
                    vote_type?: 'agree' | 'disagree';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            comments: {
                Row: {
                    id: string;
                    post_id: string;
                    user_id: string;
                    parent_comment_id: string | null;
                    vote_section: 'agree' | 'disagree';
                    content: string;
                    created_at: string;
                    updated_at: string;
                    removed_at: string | null;
                    removed_by: string | null;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    user_id: string;
                    parent_comment_id?: string | null;
                    vote_section: 'agree' | 'disagree';
                    content: string;
                    created_at?: string;
                    updated_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    user_id?: string;
                    parent_comment_id?: string | null;
                    vote_section?: 'agree' | 'disagree';
                    content?: string;
                    created_at?: string;
                    updated_at?: string;
                    removed_at?: string | null;
                    removed_by?: string | null;
                };
            };
        };
        Functions: {
            get_vote_counts: {
                Args: { p_post_id: string };
                Returns: { agree_count: number; disagree_count: number; total_votes: number }[];
            };
        };
    };
}
