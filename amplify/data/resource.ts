import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Data model for the personal golf app.
 *
 * Club: the bag. ShotRecord: one recorded shot for a club.
 *
 * ShotRecord carries a `source` + `externalId` pair purely for future
 * extensibility (e.g. importing shots from a launch monitor export or,
 * should one ever open up, a launch monitor API). The MVP only ever writes
 * `MANUAL`, and every stats/insight function reads ShotRecord[] without
 * caring where a row came from, so adding a real importer later needs no
 * schema change.
 */
const schema = a.schema({
  ClubCategory: a.enum([
    'DRIVER',
    'WOOD',
    'HYBRID',
    'IRON',
    'WEDGE',
    'PUTTER',
    'OTHER',
  ]),

  ShotDirection: a.enum([
    'STRAIGHT',
    'FADE',
    'DRAW',
    'PULL',
    'PUSH',
    'SLICE',
    'HOOK',
  ]),

  ShotSource: a.enum(['MANUAL', 'CSV_IMPORT', 'LAUNCH_MONITOR_API']),

  Club: a
    .model({
      name: a.string().required(),
      category: a.ref('ClubCategory').required(),
      loftDegrees: a.float(),
      isActive: a.boolean().default(true),
      shots: a.hasMany('ShotRecord', 'clubId'),
    })
    .authorization((allow) => [allow.owner()]),

  ShotRecord: a
    .model({
      clubId: a.id().required(),
      club: a.belongsTo('Club', 'clubId'),
      carryDistanceYds: a.float(),
      totalDistanceYds: a.float(),
      direction: a.ref('ShotDirection'),
      lateralDeviationYds: a.float(),
      shotShapeNotes: a.string(),
      // No schema-level default: the client (useShots.addShot) always sends
      // 'MANUAL' explicitly, since Amplify's ref-typed enums don't support
      // .default() the way scalar fields do.
      source: a.ref('ShotSource').required(),
      externalId: a.string(),
      recordedAt: a.datetime().required(),
      sessionLabel: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
