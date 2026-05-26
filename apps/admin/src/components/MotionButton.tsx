import { motion } from 'framer-motion';
import { Button, type ButtonProps } from '@maill/shared';
import { forwardRef } from 'react';
import { spring } from '@/lib/motion';

interface MotionButtonProps extends ButtonProps {
  // 是否启用 hover 微抬起效果（默认开启）
  hoverLift?: boolean;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ hoverLift = true, ...props }, ref) => {
    return (
      <motion.div
        className="inline-block"
        whileHover={hoverLift ? { y: -1 } : undefined}
        whileTap={{ scale: 0.96, y: 0 }}
        transition={spring.snappy}
      >
        <Button ref={ref} {...props} />
      </motion.div>
    );
  },
);
MotionButton.displayName = 'MotionButton';
