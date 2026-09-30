import { confirmAction, notify as showNotification } from "@/components/ui/action-sheet";
import { SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME } from "./domain/seed";

export { SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME };

/** Cross-platform confirmation dialog. */
export function confirm(title: string, message: string, onConfirm: () => void) {
  confirmAction(title, message, onConfirm);
}

export function notify(title: string, message?: string) {
  showNotification(title, message);
}

/** Resets the persisted demo dataset back to the shipped seed. */
export function resetAllData(reset: () => void) {
  confirmAction(
    "Reset demo data",
    "This clears every account, auction, deal and e-mail you created in this browser and restores the sample data.",
    reset,
    "Reset",
  );
}
