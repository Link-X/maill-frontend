import { motion } from 'framer-motion';
import { Button, type ButtonProps } from '@maill/shared';
import { forwardRef } from 'react';

export const MotionButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
      <Button ref={ref} {...props} />
    </motion.div>
  );
});
MotionButton.displayName = 'MotionButton';
