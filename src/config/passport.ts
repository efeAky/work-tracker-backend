import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User, UserRole } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          externalId: profile.id,
          provider: "google",
        });

        if (!user) {
          user = await User.create({
            email: profile.emails?.[0].value,
            fullName: profile.displayName,
            provider: "google",
            externalId: profile.id,
            avatarUrl: profile.photos?.[0].value,
            role: UserRole.WORKER, // Default role
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    },
  ),
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "/api/auth/github/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        let user = await User.findOne({
          externalId: profile.id,
          provider: "github",
        });

        if (!user) {
          user = await User.create({
            email:
              profile.emails?.[0].value || `${profile.username}@github.com`,
            fullName: profile.displayName || profile.username,
            provider: "github",
            externalId: profile.id,
            avatarUrl: profile.photos?.[0].value,
            role: UserRole.WORKER,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

export default passport;
