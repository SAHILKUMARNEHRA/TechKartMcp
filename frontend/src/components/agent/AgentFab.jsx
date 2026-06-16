import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore.js';

// Floating action button that opens the TechKart MCP shopping assistant.
// Sits bottom-right, pulses to draw the eye, and expands to a pill on hover.
export default function AgentFab() {
  const open = useStore((s) => s.agentOpen);
  const toggle = useStore((s) => s.toggleAgent);

  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          onClick={toggle}
          aria-label="Open TechKart assistant"
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          whileHover="hover"
          whileTap={{ scale: 0.9 }}
          className="agent-fab group fixed bottom-6 right-6 z-40"
        >
          {/* pulsing halo rings */}
          <span className="agent-fab-ring" aria-hidden="true" />
          <span className="agent-fab-ring agent-fab-ring-2" aria-hidden="true" />

          <span className="agent-fab-core">
            <motion.span
              className="agent-fab-icon"
              variants={{ hover: { rotate: [0, -12, 12, 0] } }}
              transition={{ duration: 0.6 }}
            >
              <Bot size={24} strokeWidth={2} />
            </motion.span>

            {/* label expands on hover */}
            <motion.span
              className="agent-fab-label"
              variants={{ hover: { width: 'auto', opacity: 1, marginLeft: 10 } }}
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            >
Assistant
            </motion.span>

            <Sparkles className="agent-fab-spark" size={13} aria-hidden="true" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
