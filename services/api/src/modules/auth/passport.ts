import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { config } from '@config';

if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: '/api/v1/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}

if (config.appleClientId && config.appleTeamId && config.appleKeyId) {
  passport.use(
    new AppleStrategy(
      {
        clientID: config.appleClientId,
        teamID: config.appleTeamId,
        keyID: config.appleKeyId,
        privateKeyString: config.applePrivateKey,
        callbackURL: '/api/v1/auth/apple/callback',
        scope: ['name', 'email'],
      },
      async (_accessToken, _refreshToken, idToken, profile, done) => {
        done(null, { ...profile, idToken });
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj as any);
});

export default passport;
