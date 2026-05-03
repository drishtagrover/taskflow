import { Task } from '../types';

const labels: Record<Task['status'], string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }: { status: Task['status'] }) {
  return <span className={`badge badge-${status}`}>{labels[status] ?? status}</span>;
}
