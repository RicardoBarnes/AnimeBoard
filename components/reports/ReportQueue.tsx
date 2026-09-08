'use client';

import { useState } from 'react';
import ReportQueueItem from './ReportQueueItem';

type Report = React.ComponentProps<typeof ReportQueueItem>['report'];

export default function ReportQueue({ initialReports }: { initialReports: Report[] }) {
    const [reports, setReports] = useState(initialReports);

    if (reports.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                The grievance queue is empty. No open cases to review.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((report) => (
                <ReportQueueItem
                    key={report.id}
                    report={report}
                    onResolved={(id) => setReports((prev) => prev.filter((r) => r.id !== id))}
                />
            ))}
        </div>
    );
}
