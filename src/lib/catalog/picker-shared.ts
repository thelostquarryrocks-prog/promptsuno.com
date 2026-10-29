// Types and constants the client builder shares with the server picker.
// Safe to import from client components: no catalog data in here.

export type PickerGroupId = "genre" | "mood" | "instruments" | "vocals" | "production";

export interface PickerGroup {
  id: PickerGroupId;
  label: string;
  /** Most a person can pick in this group. */
  max: number;
  hint: string;
  /** Style names, most connected first, so the first few are the safest picks. */
  options: string[];
}

export const PICKER_GROUP_IDS: readonly PickerGroupId[] = ["genre", "mood", "instruments", "vocals", "production"];

/** Picking this clears the other vocal choices, and picking a vocal clears it. */
export const INSTRUMENTAL = "Instrumental";
