import { defineAuth } from '@aws-amplify/backend';

/**
 * Email + password auth. This is a personal, single-user app hosted in the
 * cloud, so login exists to keep the data private rather than to support
 * many accounts — see amplify/data/resource.ts for the owner-based
 * authorization that actually restricts each user to their own rows.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
