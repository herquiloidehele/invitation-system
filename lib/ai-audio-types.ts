/** What `useAudio()` returns to a generated bundle. `ready` is false when the
 *  invitation has no background audio (no element to control). */
export interface AudioApi {
  playing: boolean;
  ready: boolean;
  toggle: () => void;
}
