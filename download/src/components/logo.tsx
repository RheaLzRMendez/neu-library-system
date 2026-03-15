import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({
  className,
  width = 120,
  height = 120,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Image
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNBBXhSu53Go1-ZkzM3nQc2eUzl7vrZ3HyAA&s"
        alt="New Era University Logo"
        width={width}
        height={height}
        className="rounded-full"
      />
    </div>
  );
}
