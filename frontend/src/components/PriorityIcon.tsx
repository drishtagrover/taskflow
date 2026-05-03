import { AlertCircle, ArrowUp, ArrowDown, Minus, Dot } from 'lucide-react';
import { Task } from '../types';

const icons: Record<Task['priority'], JSX.Element> = {
  urgent: <AlertCircle size={13} />,
  high: <ArrowUp size={13} />,
  medium: <Minus size={13} />,
  low: <ArrowDown size={13} />,
  none: <Dot size={13} />,
};

export default function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  return (
    <span className={`priority-${priority}`} title={priority}>
      {icons[priority] ?? icons.none}
    </span>
  );
}
