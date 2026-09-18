/* Boots the first-party AV OS analytics once (document-delegated listeners)
   and fires the initial pageview. Route changes are tracked by App. */
import './avos-analytics.js';
/* The module itself fires the initial pageview exactly once on load
   (legacy parity). Route changes are tracked by App — which skips the
   first location so no pageview is ever duplicated. */
