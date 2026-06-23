"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type {
  RSVPFormDirectProps,
  RSVPFormIntegrationProps,
} from "./RSVPForm";

// `RSVPForm` pulls in react-hook-form + zod + @hookform/resolvers
// (~1 MB decoded). Lazy-load it so guests who never open the RSVP
// modal don't pay the cost. `ssr: false` is safe — the form is only
// reachable behind a client-state-driven open flag.
const RSVPForm = dynamic(() => import("./RSVPForm"), { ssr: false });

// ---------------------------------------------------------------------------
// Modal-only props — accept the same union as RSVPForm plus open/onClose
// ---------------------------------------------------------------------------

interface ModalDirectProps
  extends Omit<RSVPFormDirectProps, "inline" | "onClose"> {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalIntegrationProps
  extends Omit<RSVPFormIntegrationProps, "inline" | "onClose"> {
  open: boolean;
  onClose: () => void;
}

type RSVPModalProps = ModalDirectProps | ModalIntegrationProps;

function isIntegration(p: RSVPModalProps): p is ModalIntegrationProps {
  return "invitation" in p;
}

export default function RSVPModal(props: RSVPModalProps) {
  const isOpen = isIntegration(props) ? props.open : props.isOpen;

  // Lock body scroll when the modal is open.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Strip the modal-only fields before forwarding the rest to RSVPForm.
  const onClose = props.onClose;
  const formProps = isIntegration(props)
    ? {
        invitation: props.invitation,
        theme: props.theme,
        customTexts: props.customTexts,
        apiEndpoint: props.apiEndpoint,
        slugKey: props.slugKey,
        guest: props.guest,
      }
    : {
        invitationSlug: props.invitationSlug,
        theme: props.theme,
        showEmail: props.showEmail,
        showDietaryRestrictions: props.showDietaryRestrictions,
        showCompanion: props.showCompanion,
        customFields: props.customFields,
        apiEndpoint: props.apiEndpoint,
        slugKey: props.slugKey,
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl"
            style={{ backgroundColor: "#FFFFFF" }}
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 340,
              mass: 0.8,
            }}
          >
            <RSVPForm {...formProps} inline={false} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
