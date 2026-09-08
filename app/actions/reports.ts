'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rateLimit';

export type ReportType = 'post' | 'image' | 'comment';
export type ReportReasonCode = 'copyright' | 'spam' | 'nsfw' | 'harassment' | 'other';

export async function createReport(input: {
    reportType: ReportType;
    targetId: string;
    reasonCode: ReportReasonCode;
    reasonText: string;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const rateLimit = await checkRateLimit(supabase, user.id, 'create_report');
    if (!rateLimit.allowed) {
        return { error: rateLimit.error };
    }

    if (!input.reasonText || input.reasonText.trim().length < 10 || input.reasonText.length > 500) {
        return { error: 'Please explain the issue in at least 10 characters.' };
    }

    const insert: Record<string, unknown> = {
        reporter_id: user.id,
        report_type: input.reportType,
        reason_code: input.reasonCode,
        reason_text: input.reasonText.trim(),
    };

    if (input.reportType === 'post') insert.reported_post_id = input.targetId;
    if (input.reportType === 'image') insert.reported_image_id = input.targetId;
    if (input.reportType === 'comment') insert.reported_comment_id = input.targetId;

    const { error } = await supabase.from('reports').insert(insert);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(): Promise<
    | { error: string; supabase: null; adminId?: undefined }
    | { error: null; supabase: SupabaseServerClient; adminId: string }
> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', supabase: null };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden', supabase: null };
    }

    return { error: null, supabase, adminId: user.id };
}

export async function getReports(status: 'pending' | 'reviewed' | 'removed' | 'rejected' = 'pending') {
    const { error: authError, supabase } = await requireAdmin();
    if (authError || !supabase) {
        return { data: [], error: authError ?? 'Forbidden' };
    }

    const { data, error } = await supabase
        .from('reports')
        .select(
            `
            id,
            report_type,
            reason_code,
            reason_text,
            status,
            created_at,
            reported_post_id,
            reported_image_id,
            reported_comment_id,
            reporter:profiles!reports_reporter_id_fkey ( username ),
            reported_post:posts!reports_reported_post_id_fkey ( id, title, removed_at ),
            reported_image:images!reports_reported_image_id_fkey ( id, public_url, removed_at ),
            reported_comment:comments!reports_reported_comment_id_fkey ( id, content, removed_at )
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) {
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}

export async function resolveReport(
    reportId: string,
    action: 'reviewed' | 'removed' | 'rejected',
    adminNotes?: string
) {
    const { error: authError, supabase, adminId } = await requireAdmin();
    if (authError || !supabase) {
        return { error: authError ?? 'Forbidden' };
    }

    const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('report_type, reported_post_id, reported_image_id, reported_comment_id')
        .eq('id', reportId)
        .single();

    if (fetchError || !report) {
        return { error: 'Report not found' };
    }

    // Soft-remove the underlying content when the admin actions "removed".
    if (action === 'removed') {
        const removal = { removed_at: new Date().toISOString(), removed_by: adminId };

        if (report.report_type === 'post' && report.reported_post_id) {
            await supabase.from('posts').update(removal).eq('id', report.reported_post_id);
        } else if (report.report_type === 'image' && report.reported_image_id) {
            await supabase.from('images').update(removal).eq('id', report.reported_image_id);
        } else if (report.report_type === 'comment' && report.reported_comment_id) {
            await supabase.from('comments').update(removal).eq('id', report.reported_comment_id);
        }
    }

    const { error } = await supabase
        .from('reports')
        .update({
            status: action,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            admin_notes: adminNotes || null,
        })
        .eq('id', reportId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/app/admin/reports');
    return { success: true };
}
