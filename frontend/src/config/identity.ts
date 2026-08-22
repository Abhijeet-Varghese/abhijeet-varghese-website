/**
 * AV OS — client-side email identity (§3).
 *
 * ONLY the public, client-facing address may live here. The private owner
 * address must never appear in any client bundle, HTML, JSON-LD or API
 * response — it is server-side configuration only, and CI fails the build if
 * its literal ever appears in a client artifact.
 */
export const PUBLIC_EMAIL = 'hi@abhijeetvarghese.com';
export const PUBLIC_EMAIL_HREF = `mailto:${PUBLIC_EMAIL}`;
export const PUBLIC_NAME = 'Abhijeet Varghese';
